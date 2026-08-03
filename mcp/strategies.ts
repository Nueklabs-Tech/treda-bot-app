/**
 * Strategy-side tooling for the MCP server: reading, summarising and validating
 * the Blockly XML that `DBot` loads into the workspace.
 *
 * The block registry is scraped from src/external/bot-skeleton/scratch/blocks at
 * runtime rather than hardcoded, so adding a block definition automatically
 * makes it a known type here.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

import { XMLParser, XMLValidator } from 'fast-xml-parser';

import { REPO_ROOT } from './deriv';

/**
 * Directories `strategy_list` walks and `strategy_read` will read from.
 *
 * The two are not equivalent. src/xml holds the complete strategies the app
 * ships in the quick-strategy gallery. The bot-skeleton examples are older
 * snippets written against a previous block vocabulary (`trade`, `market`,
 * `rsia`) that nothing in src/ loads; they are useful to read but will not pass
 * validation, so they are tagged separately rather than silently mixed in.
 */
const STRATEGY_ROOTS = [
    { dir: join(REPO_ROOT, 'src', 'xml'), kind: 'strategy' as const },
    {
        dir: join(REPO_ROOT, 'src', 'external', 'bot-skeleton', 'examples', 'xml-examples'),
        kind: 'legacy-example' as const,
    },
];

const BLOCKS_DIR = join(REPO_ROOT, 'src', 'external', 'bot-skeleton', 'scratch', 'blocks');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
});

const toArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
};

// ---------------------------------------------------------------------------
// Block registry
// ---------------------------------------------------------------------------

let block_registry: Set<string> | null = null;

const walkFiles = (dir: string, predicate: (file: string) => boolean): string[] => {
    let files: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            files = files.concat(walkFiles(full, predicate));
        } else if (predicate(full)) {
            files.push(full);
        }
    }
    return files;
};

/** Every block type the bot registers, e.g. `trade_definition`, `variables_get`. */
export function getBlockTypes(): string[] {
    if (block_registry) return [...block_registry].sort();

    const types = new Set<string>();
    const pattern = /Blockly\.Blocks\.([A-Za-z0-9_]+)|Blockly\.Blocks\['([^']+)'\]/g;

    for (const file of walkFiles(BLOCKS_DIR, f => ['.js', '.ts'].includes(extname(f)))) {
        const source = readFileSync(file, 'utf8');
        for (const match of source.matchAll(pattern)) {
            types.add(match[1] ?? match[2]);
        }
    }

    block_registry = types;
    return [...types].sort();
}

// ---------------------------------------------------------------------------
// Strategy files
// ---------------------------------------------------------------------------

export type StrategyFile = { path: string; name: string; kind: 'strategy' | 'legacy-example'; bytes: number };

export function listStrategies(): StrategyFile[] {
    const files: StrategyFile[] = [];

    for (const { dir, kind } of STRATEGY_ROOTS) {
        let entries: string[];
        try {
            entries = walkFiles(dir, f => extname(f) === '.xml');
        } catch {
            continue; // root not present in this checkout
        }

        for (const file of entries) {
            files.push({
                path: relative(REPO_ROOT, file),
                name: file
                    .split(sep)
                    .pop()!
                    .replace(/\.xml$/, ''),
                kind,
                bytes: statSync(file).size,
            });
        }
    }

    return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Resolves a caller-supplied path against the strategy roots and refuses
 * anything that escapes them — the MCP client is not a trusted source of paths.
 */
export function readStrategy(path: string): { path: string; xml: string } {
    const absolute = resolve(REPO_ROOT, path);
    const permitted = STRATEGY_ROOTS.some(({ dir }) => absolute === dir || absolute.startsWith(dir + sep));

    if (!permitted) {
        throw new Error(
            `Refusing to read ${path}: strategy files must live under ${STRATEGY_ROOTS.map(({ dir }) =>
                relative(REPO_ROOT, dir)
            ).join(' or ')}.`
        );
    }

    return { path: relative(REPO_ROOT, absolute), xml: readFileSync(absolute, 'utf8') };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export type ParsedBlock = {
    type: string;
    /** Name of the `<value>`/`<statement>` this block sits in, e.g. `DURATION`. */
    input?: string;
    fields: Record<string, string>;
    /** `id` attribute of the VAR field, which is how Blockly resolves variables. */
    var_id?: string;
    children: ParsedBlock[];
    is_shadow: boolean;
};

/**
 * Flattens the `<block>`/`<shadow>` tree. Blockly nests successors inside
 * `<next>` and inputs inside `<value>`/`<statement>`, so every one of those is
 * just another place a block can hang off its parent — the walk treats them
 * uniformly, keeping the input name so callers can tell DURATION from AMOUNT.
 */
const collectBlocks = (node: any, input?: string): ParsedBlock[] => {
    if (!node || typeof node !== 'object') return [];

    const blocks: ParsedBlock[] = [];

    for (const key of ['block', 'shadow']) {
        for (const raw of toArray(node[key])) {
            if (!raw || typeof raw !== 'object') continue;

            const fields: Record<string, string> = {};
            let var_id: string | undefined;

            for (const field of toArray<any>(raw.field)) {
                if (!field || typeof field !== 'object' || !field['@_name']) continue;
                fields[field['@_name']] = String(field['#text'] ?? '');
                if (field['@_name'] === 'VAR') var_id = field['@_id'];
            }

            const children: ParsedBlock[] = [];
            for (const container of ['value', 'statement', 'next'] as const) {
                for (const holder of toArray<any>(raw[container])) {
                    // `<next>` is a plain successor slot and carries no name.
                    const child_input = container === 'next' ? undefined : holder?.['@_name'];
                    children.push(...collectBlocks(holder, child_input));
                }
            }

            blocks.push({
                type: raw['@_type'] ?? 'unknown',
                input,
                fields,
                var_id,
                children,
                is_shadow: key === 'shadow',
            });
        }
    }

    return blocks;
};

export type StrategyVariable = { id?: string; name: string };

export type ParsedStrategy = {
    variables: StrategyVariable[];
    roots: ParsedBlock[];
    all: ParsedBlock[];
};

export function parseStrategy(xml: string): ParsedStrategy {
    const validity = XMLValidator.validate(xml);
    if (validity !== true) {
        throw new Error(`Malformed XML: ${validity.err.msg} (line ${validity.err.line})`);
    }

    const document = parser.parse(xml);
    const root = document.xml ?? document;

    const variables = toArray<any>(root?.variables?.variable)
        .map(v =>
            typeof v === 'object'
                ? { id: v['@_id'], name: String(v['#text'] ?? '') }
                : { id: undefined, name: String(v) }
        )
        .filter(v => v.name);

    const roots = collectBlocks(root);

    const all: ParsedBlock[] = [];
    const flatten = (blocks: ParsedBlock[]) => {
        for (const block of blocks) {
            all.push(block);
            flatten(block.children);
        }
    };
    flatten(roots);

    return { variables, roots, all };
}

const findBlock = (blocks: ParsedBlock[], type: string): ParsedBlock | undefined =>
    blocks.find(block => block.type === type);

/**
 * Reads the number sitting in a named input. Blockly stores the default in a
 * `<shadow>` and overlays a real `<block>` when the value is computed, so both
 * are searched and the shadow is the fallback.
 */
const numericInput = (parent: ParsedBlock | undefined, input: string) => {
    if (!parent) return { value: undefined as string | undefined, is_dynamic: false };

    const candidates = parent.children.filter(child => child.input === input);
    const numeric = candidates.find(child => child.fields.NUM !== undefined);

    return {
        value: numeric?.fields.NUM,
        // A non-shadow block in the slot means the value is computed at runtime
        // (e.g. a Martingale stake function), so the number is only a default.
        is_dynamic: candidates.some(child => !child.is_shadow),
    };
};

export type StrategySummary = ReturnType<typeof describeStrategy>;

export function describeStrategy(xml: string) {
    const { variables, all } = parseStrategy(xml);

    const market = findBlock(all, 'trade_definition_market');
    const trade_type = findBlock(all, 'trade_definition_tradetype');
    const contract_type = findBlock(all, 'trade_definition_contracttype');
    const candle_interval = findBlock(all, 'trade_definition_candleinterval');
    const restart_buysell = findBlock(all, 'trade_definition_restartbuysell');
    const restart_on_error = findBlock(all, 'trade_definition_restartonerror');
    const options = findBlock(all, 'trade_definition_tradeoptions');

    const block_counts: Record<string, number> = {};
    for (const block of all) {
        if (block.is_shadow) continue;
        block_counts[block.type] = (block_counts[block.type] ?? 0) + 1;
    }

    const duration = numericInput(options, 'DURATION');
    const stake = numericInput(options, 'AMOUNT');

    return {
        variables: variables.map(v => v.name),
        trade: {
            market: market?.fields.MARKET_LIST,
            submarket: market?.fields.SUBMARKET_LIST,
            symbol: market?.fields.SYMBOL_LIST,
            trade_type_category: trade_type?.fields.TRADETYPECAT_LIST,
            trade_type: trade_type?.fields.TRADETYPE_LIST,
            contract_type: contract_type?.fields.TYPE_LIST,
            candle_interval_seconds: candle_interval?.fields.CANDLEINTERVAL_LIST,
            currency: options?.fields.CURRENCY_LIST,
            duration_unit: options?.fields.DURATIONTYPE_LIST,
            duration: duration.value,
            stake: stake.value,
            stake_is_computed: stake.is_dynamic,
            time_machine_enabled: restart_buysell?.fields.TIME_MACHINE_ENABLED === 'TRUE',
            restart_on_error: restart_on_error?.fields.RESTARTONERROR === 'TRUE',
        },
        handlers: {
            before_purchase: all.some(b => b.type === 'before_purchase'),
            during_purchase: all.some(b => b.type === 'during_purchase'),
            after_purchase: all.some(b => b.type === 'after_purchase'),
            tick_analysis: all.some(b => b.type === 'tick_analysis'),
        },
        purchase_blocks: all.filter(b => b.type === 'purchase').length,
        total_blocks: all.filter(b => !b.is_shadow).length,
        block_counts,
    };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Children the Blockly workspace marks `deletable="false"` inside
 * `trade_definition` — a strategy missing one will not generate runnable code.
 */
const REQUIRED_TRADE_DEFINITION_CHILDREN = [
    'trade_definition_market',
    'trade_definition_tradetype',
    'trade_definition_contracttype',
    'trade_definition_candleinterval',
    'trade_definition_restartbuysell',
    'trade_definition_restartonerror',
];

export function validateStrategy(xml: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: ParsedStrategy;
    try {
        parsed = parseStrategy(xml);
    } catch (error) {
        return { valid: false, errors: [(error as Error).message], warnings };
    }

    if (!/<xml[^>]*is_dbot=["']true["']/.test(xml)) {
        warnings.push('Root <xml> element is missing is_dbot="true"; the bot builder may refuse to load it.');
    }

    const trade_definitions = parsed.all.filter(b => b.type === 'trade_definition');
    if (trade_definitions.length === 0) {
        errors.push('No trade_definition block — the strategy has nothing to trade.');
    } else if (trade_definitions.length > 1) {
        errors.push(`Found ${trade_definitions.length} trade_definition blocks; exactly one is allowed.`);
    }

    const types_present = new Set(parsed.all.map(b => b.type));
    for (const required of REQUIRED_TRADE_DEFINITION_CHILDREN) {
        if (!types_present.has(required)) errors.push(`Missing required block: ${required}`);
    }

    // Which options block appears depends on the product: accumulators and
    // multipliers each carry their own instead of the plain trade options.
    const OPTIONS_BLOCKS = [
        'trade_definition_tradeoptions',
        'trade_definition_multiplier',
        'trade_definition_accumulator',
    ];
    if (!OPTIONS_BLOCKS.some(type => types_present.has(type))) {
        errors.push(`Missing trade options — expected one of ${OPTIONS_BLOCKS.join(', ')}.`);
    }

    if (!types_present.has('before_purchase')) {
        errors.push('Missing before_purchase block — nothing will ever buy a contract.');
    } else if (!types_present.has('purchase')) {
        errors.push('before_purchase contains no purchase block.');
    }

    const known = new Set(getBlockTypes());
    const unknown = [...types_present].filter(type => type !== 'unknown' && !known.has(type));
    if (unknown.length > 0) {
        warnings.push(`Block types not registered in this build: ${unknown.join(', ')}`);
    }

    // Blockly binds variables by the field's `id`, not its label — the bundled
    // strategies contain get/set fields whose text case drifts from the
    // declaration, and those are fine. A missing id is the real defect.
    const declared_ids = new Set(parsed.variables.map(v => v.id).filter(Boolean));
    const dangling = new Set<string>();
    for (const block of parsed.all) {
        if (block.type !== 'variables_get' && block.type !== 'variables_set') continue;
        if (!block.var_id || !declared_ids.has(block.var_id)) {
            dangling.add(block.fields.VAR || '(unnamed)');
        }
    }
    if (dangling.size > 0) {
        warnings.push(
            'Variable blocks whose id matches no <variable> declaration: ' +
                `${[...dangling].join(', ')}. Blockly recreates these by name on load, so the strategy still ` +
                'runs, but the declaration and the references have drifted apart.'
        );
    }

    return { valid: errors.length === 0, errors, warnings };
}
