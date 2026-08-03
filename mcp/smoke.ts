/**
 * Smoke test for the MCP server: spawns it exactly the way a client does
 * (stdio, via .mcp.json's command), calls every tool once, and reports what
 * came back.
 *
 *   npm run mcp:smoke
 *
 * The `deriv_*` checks hit the live Deriv API, so this needs network and its
 * output moves with the market — it is checking that the tools answer, not that
 * they answer with particular numbers. Cases marked `expect: 'error'` are
 * checking the failure paths are wired up too.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { REPO_ROOT } from './deriv';

type Check = {
    tool: string;
    args?: Record<string, unknown>;
    /** 'error' means the tool is supposed to reject this input. */
    expect?: 'ok' | 'error';
    /** Skip the pass/fail verdict — used where the result depends on local config. */
    optional?: boolean;
    note?: string;
};

const CHECKS: Check[] = [
    { tool: 'deriv_server_time' },
    { tool: 'deriv_active_symbols', args: { market: 'synthetic_index', open_only: true } },
    { tool: 'deriv_ticks', args: { symbol: 'R_100', count: 3 } },
    { tool: 'deriv_candles', args: { symbol: 'R_100', granularity: 60, count: 2 } },
    { tool: 'deriv_contracts_for', args: { symbol: 'R_100', contract_category: 'callput' } },
    {
        tool: 'deriv_proposal',
        args: { symbol: 'R_100', contract_type: 'CALL', amount: 10, duration: 5, duration_unit: 't' },
    },
    { tool: 'deriv_proposal', args: { symbol: 'NOPE_123', contract_type: 'CALL' }, expect: 'error' },
    { tool: 'deriv_accounts', optional: true, note: 'needs DERIV_ACCESS_TOKEN' },

    { tool: 'strategy_list', args: { kind: 'strategy' } },
    { tool: 'strategy_read', args: { path: 'src/xml/martingale.xml' } },
    { tool: 'strategy_describe', args: { path: 'src/xml/martingale.xml' } },
    { tool: 'strategy_validate', args: { path: 'src/xml/martingale.xml' } },
    { tool: 'strategy_validate', args: { xml: '<xml is_dbot="true"><block type="notify"/></xml>' } },
    { tool: 'strategy_validate', args: { xml: '<xml><unclosed>' } },
    { tool: 'strategy_read', args: { path: '../../../etc/passwd' }, expect: 'error' },
    { tool: 'strategy_block_types', args: { search: 'trade_definition' } },
];

const PREVIEW_CHARS = 220;

const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'tsx', 'mcp/server.ts'],
    cwd: REPO_ROOT,
});

const client = new Client({ name: 'tredabot-smoke', version: '1.0.0' });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`Connected. ${tools.length} tools registered.\n`);

const untested = tools.filter(tool => !CHECKS.some(check => check.tool === tool.name));
if (untested.length > 0) {
    console.log(`No check covers: ${untested.map(t => t.name).join(', ')}\n`);
}

let failed = 0;

for (const check of CHECKS) {
    const expect = check.expect ?? 'ok';
    const result: any = await client.callTool({ name: check.tool, arguments: check.args ?? {} });

    const errored = result.isError === true;
    const matched = errored === (expect === 'error');
    const verdict = check.optional ? (errored ? 'SKIP' : 'PASS') : matched ? 'PASS' : 'FAIL';

    if (verdict === 'FAIL') failed++;

    const body = (result.content?.[0]?.text ?? '').replace(/\s+/g, ' ').slice(0, PREVIEW_CHARS);
    const label = `${check.tool}${check.args ? ` ${JSON.stringify(check.args)}` : ''}`;

    console.log(`[${verdict}] ${label}${check.note ? ` (${check.note})` : ''}`);
    console.log(`        ${body}${body.length >= PREVIEW_CHARS ? '…' : ''}\n`);
}

await client.close();

console.log(failed === 0 ? `All ${CHECKS.length} checks passed.` : `${failed} of ${CHECKS.length} checks failed.`);
process.exit(failed === 0 ? 0 : 1);
