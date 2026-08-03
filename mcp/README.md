# TredaBot MCP server

A local [MCP](https://modelcontextprotocol.io) server that exposes this repo's two most
awkward-to-inspect surfaces to an MCP client: the **live Deriv API** the bot trades against,
and the **Blockly strategy XML** it runs.

Everything is read-only. There is deliberately no buy/sell tool — the trade engine in
`src/external/bot-skeleton/services/tradeEngine` is the only thing that should place contracts.

## Running it

Claude Code picks it up automatically from [`.mcp.json`](../.mcp.json) at the repo root.
To run it by hand (it speaks MCP over stdio, so this is only useful for piping JSON-RPC at it):

```bash
npm run mcp
```

No build step: `tsx` runs the TypeScript directly. `npm run type-check:mcp` type-checks it
separately from the app, since the root `tsconfig.json` only covers `src`.

## Testing it

```bash
npm run mcp:smoke
```

[`smoke.ts`](smoke.ts) spawns the server over stdio the same way a client does, calls every tool
once, and prints a PASS/SKIP/FAIL line each. It exits non-zero if anything fails, so it works as a
CI check. Cases marked `expect: 'error'` assert the failure paths — an unknown symbol, malformed
XML, a path escaping the strategy roots. `deriv_accounts` reports SKIP unless `DERIV_ACCESS_TOKEN`
is set.

It talks to the live Deriv API, so it needs network and its numbers move with the market. It is
checking that the tools answer, not that they answer with particular values. Add a case to the
`CHECKS` array to cover a new tool — the script prints a warning for any registered tool no check
covers.

For poking at tools by hand, the official inspector gives you a UI over the same stdio server:

```bash
npx @modelcontextprotocol/inspector npx tsx mcp/server.ts
```

## Configuration

Read from `.env` / `.env.local` at startup, so the server resolves the same Deriv environment
as the app:

| Variable                | Required                  | Purpose                                                                                                                           |
| ----------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_DERIV_ENV` | no                        | `preview`/`staging` selects the staging endpoints; anything else is production. Mirrors `src/external/deriv-core/config/urls.ts`. |
| `DERIV_ACCESS_TOKEN`    | only for `deriv_accounts` | OAuth access token. Log into the app and copy `access_token` out of the `auth_info` localStorage entry.                           |

Market-data tools need no credentials — they use the public socket at
`wss://api.derivws.com/trading/v1/options/ws/public`.

## Tools

### Deriv API

| Tool                   | What it does                                                                     |
| ---------------------- | -------------------------------------------------------------------------------- |
| `deriv_active_symbols` | Tradable symbols, filterable by market, name substring, or open-only             |
| `deriv_ticks`          | Recent ticks for a symbol as epoch/price pairs                                   |
| `deriv_candles`        | Recent OHLC candles at a given granularity                                       |
| `deriv_contracts_for`  | Contract types tradable on a symbol, with duration limits and barrier counts     |
| `deriv_proposal`       | Prices a contract — ask price, payout, spot, longcode, stake limits. Quotes only |
| `deriv_server_time`    | Server epoch plus the endpoint and environment in use                            |
| `deriv_accounts`       | Demo/real accounts and balances for `DERIV_ACCESS_TOKEN`                         |

### Strategies

| Tool                   | What it does                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `strategy_list`        | Strategy XML in the repo, tagged `strategy` or `legacy-example`                                                                                                     |
| `strategy_read`        | Raw Blockly XML for one file                                                                                                                                        |
| `strategy_describe`    | Market/symbol, trade and contract type, duration, stake, handlers present, block histogram                                                                          |
| `strategy_validate`    | Structural check: one `trade_definition` with its required children, trade options, a `before_purchase` containing a `purchase`, known block types, bound variables |
| `strategy_block_types` | Every block type the bot builder registers                                                                                                                          |

`strategy_describe` and `strategy_validate` take either a repo-relative `path` or raw `xml`.
`strategy_read` only accepts paths under `src/xml` or the bot-skeleton examples, and rejects
anything that escapes them.

## Two things worth knowing about this API

**The symbol field is `underlying_symbol`, not `symbol`.** Sending `symbol` to `proposal` fails
with `InputValidationFailed: Properties not allowed: symbol`. The tools take a friendly `symbol`
argument and translate.

**`active_symbols` takes no `product_type` and `contracts_for` takes no `currency`.** Both are
rejected outright, unlike the legacy Deriv API that most documentation describes.

## The two kinds of strategy XML

`src/xml/*.xml` are the complete strategies behind the quick-strategy gallery. They validate clean
apart from `dalembert_max-stake.xml`, whose `dalembert:totalUnits` references carry an id that
doesn't match its declaration — harmless, since Blockly recreates the variable by name on load.

`src/external/bot-skeleton/examples/xml-examples/*` are older snippets built on a superseded block
vocabulary (`trade`, `market`, `rsia`, `macda`). Nothing under `src/` loads them. They are listed
and readable, but `strategy_validate` will report them as missing a `trade_definition` — that is
the validator working, not a bug.
