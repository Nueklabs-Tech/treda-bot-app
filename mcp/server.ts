#!/usr/bin/env node
/**
 * TredaBot MCP server.
 *
 * Exposes two families of tools over stdio:
 *   - `deriv_*`  — live market data and pricing from the Deriv options API,
 *                  the same endpoints the running bot trades against
 *   - `strategy_*` — reading, summarising and validating the Blockly XML
 *                  strategies in this repo
 *
 * Everything here is read-only. There is deliberately no buy/sell tool: the
 * trade engine (src/external/bot-skeleton/services/tradeEngine) is the only
 * thing that should be placing contracts.
 *
 * Run:  npx tsx mcp/server.ts        (see .mcp.json)
 */

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
    activeSymbols,
    contractsFor,
    fetchAccounts,
    getPublicWsUrl,
    proposal,
    REPO_ROOT,
    serverTime,
    ticksHistory,
} from './deriv';
import { describeStrategy, getBlockTypes, listStrategies, readStrategy, validateStrategy } from './strategies';

import { join } from 'node:path';

// The app bakes NEXT_PUBLIC_* in at build time; this process reads the same
// files at startup so both resolve the same Deriv environment.
loadEnv({ path: join(REPO_ROOT, '.env'), quiet: true });
loadEnv({ path: join(REPO_ROOT, '.env.local'), override: true, quiet: true });

const server = new McpServer({ name: 'tredabot', version: '0.2.2' });

const json = (payload: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
});

const fail = (error: unknown) => ({
    isError: true,
    content: [{ type: 'text' as const, text: (error as Error).message ?? String(error) }],
});

/** Wraps a handler so a Deriv API failure comes back as a tool error, not a crash. */
const guard =
    <A>(handler: (args: A) => Promise<ReturnType<typeof json>>) =>
    async (args: A) => {
        try {
            return await handler(args);
        } catch (error) {
            return fail(error);
        }
    };

// ---------------------------------------------------------------------------
// Deriv market data
// ---------------------------------------------------------------------------

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const;

server.registerTool(
    'deriv_active_symbols',
    {
        title: 'List tradable symbols',
        description:
            'Tradable Deriv symbols with market, submarket and whether the exchange is currently open. ' +
            'Filter by market (e.g. synthetic_index, forex) or a substring of the symbol/name.',
        inputSchema: {
            market: z.string().optional().describe('Market id, e.g. synthetic_index, forex, cryptocurrency'),
            search: z.string().optional().describe('Case-insensitive substring of the symbol code or display name'),
            open_only: z.boolean().optional().describe('Only symbols whose exchange is currently open'),
        },
        annotations: READ_ONLY,
    },
    guard(async ({ market, search, open_only }) => {
        let symbols = await activeSymbols();

        if (market) symbols = symbols.filter(s => s.market === market);
        if (open_only) symbols = symbols.filter(s => s.exchange_is_open === 1 && !s.is_trading_suspended);
        if (search) {
            const needle = search.toLowerCase();
            symbols = symbols.filter(
                s =>
                    s.underlying_symbol.toLowerCase().includes(needle) ||
                    s.underlying_symbol_name.toLowerCase().includes(needle)
            );
        }

        return json({
            count: symbols.length,
            symbols: symbols.map(s => ({
                symbol: s.underlying_symbol,
                name: s.underlying_symbol_name,
                market: s.market,
                submarket: s.submarket,
                open: s.exchange_is_open === 1,
                pip_size: s.pip_size,
            })),
        });
    })
);

server.registerTool(
    'deriv_ticks',
    {
        title: 'Recent ticks',
        description: 'Most recent ticks for a symbol, as epoch/price pairs.',
        inputSchema: {
            symbol: z.string().describe('Underlying symbol, e.g. R_100 or 1HZ100V'),
            count: z.number().int().min(1).max(500).default(20),
        },
        annotations: READ_ONLY,
    },
    guard(async ({ symbol, count }) => {
        const response = await ticksHistory({ symbol, count, style: 'ticks' });
        const { times = [], prices = [] } = response.history ?? {};

        return json({
            symbol,
            pip_size: response.pip_size,
            ticks: times.map((epoch: number, i: number) => ({ epoch, price: prices[i] })),
        });
    })
);

server.registerTool(
    'deriv_candles',
    {
        title: 'OHLC candles',
        description: 'Most recent OHLC candles for a symbol at a given granularity.',
        inputSchema: {
            symbol: z.string().describe('Underlying symbol, e.g. R_100'),
            granularity: z
                .number()
                .int()
                .default(60)
                .describe('Candle size in seconds: 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400'),
            count: z.number().int().min(1).max(500).default(20),
        },
        annotations: READ_ONLY,
    },
    guard(async ({ symbol, granularity, count }) => {
        const response = await ticksHistory({ symbol, count, style: 'candles', granularity });
        return json({ symbol, granularity, candles: response.candles ?? [] });
    })
);

server.registerTool(
    'deriv_contracts_for',
    {
        title: 'Available contracts for a symbol',
        description:
            'Contract types tradable on a symbol, with duration limits and barrier counts. ' +
            'Use this to check a strategy targets a contract the symbol actually supports.',
        inputSchema: {
            symbol: z.string().describe('Underlying symbol, e.g. R_100'),
            contract_category: z
                .string()
                .optional()
                .describe('Filter by category, e.g. callput, accumulator, digits, touchnotouch'),
        },
        annotations: READ_ONLY,
    },
    guard(async ({ symbol, contract_category }) => {
        let available = await contractsFor(symbol);
        if (contract_category) available = available.filter(c => c.contract_category === contract_category);

        return json({
            symbol,
            count: available.length,
            contracts: available.map(c => ({
                contract_type: c.contract_type,
                category: c.contract_category,
                sentiment: c.sentiment,
                expiry_type: c.expiry_type,
                min_duration: c.min_contract_duration,
                max_duration: c.max_contract_duration,
                barriers: c.barriers,
                default_stake: c.default_stake,
                growth_rate_range: c.growth_rate_range,
            })),
        });
    })
);

server.registerTool(
    'deriv_proposal',
    {
        title: 'Price a contract',
        description:
            'Prices a contract without buying it — returns ask price, payout, spot, longcode and stake/payout limits. ' +
            'This only quotes; it never places a trade.',
        inputSchema: {
            symbol: z.string().describe('Underlying symbol, e.g. R_100'),
            contract_type: z.string().describe('Contract type, e.g. CALL, PUT, DIGITEVEN, ACCU'),
            amount: z.number().positive().default(10),
            basis: z.enum(['stake', 'payout']).default('stake'),
            currency: z.string().default('USD'),
            duration: z.number().int().positive().default(5),
            duration_unit: z.enum(['t', 's', 'm', 'h', 'd']).default('t'),
            barrier: z.string().optional().describe('Barrier or offset, e.g. "+0.5" or an absolute price'),
            barrier2: z.string().optional().describe('Second barrier for two-barrier contracts'),
            growth_rate: z.number().optional().describe('Accumulator growth rate, e.g. 0.03'),
        },
        annotations: READ_ONLY,
    },
    guard(async ({ symbol, growth_rate, ...rest }) =>
        json(
            await proposal({
                underlying_symbol: symbol,
                ...rest,
                ...(growth_rate === undefined ? {} : { growth_rate }),
            })
        )
    )
);

server.registerTool(
    'deriv_server_time',
    {
        title: 'Deriv server time',
        description: 'Current Deriv server epoch, plus the endpoint this server is talking to.',
        inputSchema: {},
        annotations: READ_ONLY,
    },
    guard(async () => {
        const epoch = await serverTime();
        return json({
            epoch,
            iso: new Date(epoch * 1000).toISOString(),
            endpoint: getPublicWsUrl(),
            environment: process.env.NEXT_PUBLIC_DERIV_ENV ?? 'production',
        });
    })
);

server.registerTool(
    'deriv_accounts',
    {
        title: 'List Deriv accounts',
        description:
            'Demo and real accounts with balances for the configured OAuth access token. ' +
            'Requires DERIV_ACCESS_TOKEN in the environment — copy the access_token from the ' +
            "browser's auth_info localStorage entry after logging into the app.",
        inputSchema: {},
        annotations: READ_ONLY,
    },
    guard(async () => {
        const token = process.env.DERIV_ACCESS_TOKEN;
        if (!token) {
            throw new Error(
                'DERIV_ACCESS_TOKEN is not set. Log into the app, copy access_token from the auth_info ' +
                    'localStorage entry, and set it in .env.local or the MCP server env.'
            );
        }

        const accounts = await fetchAccounts(token);
        return json({
            count: accounts.length,
            accounts: accounts.map(a => ({
                account_id: a.account_id,
                type: a.account_type,
                balance: a.balance,
                currency: a.currency,
                status: a.status,
            })),
        });
    })
);

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

const LOCAL_READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

server.registerTool(
    'strategy_list',
    {
        title: 'List bundled strategies',
        description:
            'Blockly strategy XML shipped in this repo. kind="strategy" are the complete strategies in src/xml; ' +
            'kind="legacy-example" are older bot-skeleton snippets that use a superseded block vocabulary, are ' +
            'not loaded by the app, and will not pass strategy_validate.',
        inputSchema: {
            kind: z.enum(['strategy', 'legacy-example']).optional().describe('Restrict to one kind'),
        },
        annotations: LOCAL_READ_ONLY,
    },
    guard(async ({ kind }) => {
        const strategies = listStrategies().filter(s => !kind || s.kind === kind);
        return json({ count: strategies.length, strategies });
    })
);

server.registerTool(
    'strategy_read',
    {
        title: 'Read a strategy XML file',
        description: 'Raw Blockly XML for a bundled strategy. Use the path returned by strategy_list.',
        inputSchema: {
            path: z.string().describe('Repo-relative path, e.g. src/xml/martingale.xml'),
        },
        annotations: LOCAL_READ_ONLY,
    },
    guard(async ({ path }) => {
        const { path: resolved, xml } = readStrategy(path);
        return { content: [{ type: 'text' as const, text: `<!-- ${resolved} -->\n${xml}` }] };
    })
);

server.registerTool(
    'strategy_describe',
    {
        title: 'Summarise a strategy',
        description:
            'Parses a strategy into a summary: market/symbol, trade and contract type, duration, stake, ' +
            'which purchase handlers are present, and a block-type histogram. ' +
            'Pass either a bundled path or raw XML.',
        inputSchema: {
            path: z.string().optional().describe('Repo-relative path, e.g. src/xml/martingale.xml'),
            xml: z.string().optional().describe('Raw Blockly XML, if not reading a bundled file'),
        },
        annotations: LOCAL_READ_ONLY,
    },
    guard(async ({ path, xml }) => {
        if (!path && !xml) throw new Error('Provide either `path` or `xml`.');
        const source = xml ?? readStrategy(path!).xml;
        return json({ ...(path ? { path } : {}), ...describeStrategy(source) });
    })
);

server.registerTool(
    'strategy_validate',
    {
        title: 'Validate a strategy',
        description:
            'Checks a strategy is well-formed XML and structurally loadable: one trade_definition with its ' +
            'required children, trade options, a before_purchase containing a purchase block, known block ' +
            'types, and variable blocks bound to a declaration.',
        inputSchema: {
            path: z.string().optional().describe('Repo-relative path, e.g. src/xml/martingale.xml'),
            xml: z.string().optional().describe('Raw Blockly XML, if not reading a bundled file'),
        },
        annotations: LOCAL_READ_ONLY,
    },
    guard(async ({ path, xml }) => {
        if (!path && !xml) throw new Error('Provide either `path` or `xml`.');
        const source = xml ?? readStrategy(path!).xml;
        return json({ ...(path ? { path } : {}), ...validateStrategy(source) });
    })
);

server.registerTool(
    'strategy_block_types',
    {
        title: 'List Blockly block types',
        description:
            'Every block type registered by the bot builder, scraped from ' +
            'src/external/bot-skeleton/scratch/blocks. Optionally filtered by substring.',
        inputSchema: {
            search: z.string().optional().describe('Case-insensitive substring, e.g. trade_definition, ema'),
        },
        annotations: LOCAL_READ_ONLY,
    },
    guard(async ({ search }) => {
        let types = getBlockTypes();
        if (search) {
            const needle = search.toLowerCase();
            types = types.filter(type => type.toLowerCase().includes(needle));
        }
        return json({ count: types.length, block_types: types });
    })
);

// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
