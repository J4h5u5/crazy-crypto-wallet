# PIE + pieUI — Complete Agent Skill Guide

Knowledge base for AI agents building projects with the PIE framework and `pie` / `pieui` CLIs.
Covers hard rules, every CLI command, workflow recipes, envelope policy, and edge cases.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Hard Rules — Never Do Manually](#2-hard-rules--never-do-manually)
3. [pieui CLI — All Commands](#3-pieui-cli--all-commands)
4. [pie CLI — All Commands](#4-pie-cli--all-commands)
5. [Envelope Policy](#5-envelope-policy)
6. [Workflow Recipes](#6-workflow-recipes)
7. [Edge Cases & IntrospectionErrors](#7-edge-cases--introspectionerrors)
8. [Project Setup & .gitignore](#8-project-setup--gitignore)
9. [check-sync Findings Guide](#9-check-sync-findings-guide)

---

## 1. Architecture

PIE is a fullstack framework. Frontend and backend are **strictly separated**, each with its own CLI.

```
┌─────────────────────────────────────────────┐
│              Platform (pieui.swarm.ing)       │
│  j4h5u5/my-project/MyCard                   │
│   ├── python/  ← pushed by pie CLI           │
│   └── typescript/  ← pushed by pieui CLI     │
└─────────────────────────────────────────────┘
         ↑ push/pull          ↑ push/pull
┌────────────────┐   ┌────────────────────────┐
│  Backend        │   │  Frontend               │
│  Python/FastAPI │   │  TypeScript/Next.js     │
│  pie CLI        │   │  pieui CLI              │
│  pages/         │   │  piecomponents/         │
│  components/    │   │  app/                   │
└────────────────┘   └────────────────────────┘
```

| Layer | Language | CLI | Key directories |
|---|---|---|---|
| Frontend | TypeScript / Next.js | `pieui` | `piecomponents/`, `app/` |
| Backend | Python / FastAPI | `pie` | `pages/`, `pages/components/` |

CLI paths (typical):
- `node /path/to/pieui/dist/cli.js <cmd>`
- `/path/to/pie/.venv/bin/pie <cmd>`

---

## 2. Hard Rules — Never Do Manually

These actions **must** go through the CLI. Doing them manually breaks the registry or platform metadata.

| ❌ Never manually | ✅ Use instead |
|---|---|
| Create a file in `piecomponents/` | `pieui card add ...` |
| Create `app/<path>/page.tsx` | `pieui page add <path>` |
| Edit `piecomponents/registry.ts` | Any `pieui card add/remove` call updates it automatically |
| Create `pages/components/*.py` | `pie card add ...` |
| Create `pages/*.py` | `pie page add ...` |
| Add a methods/event key to `<PieCard methods={...}>` | `pieui add-event <Card> <event>` |
| Add an IO event to a Python card | `pie card add-event <Card> <event>` |
| Delete a piecomponent directory | `pieui remove <ComponentName>` |

**Other hard rules:**

- `"use client"` — required at the top of **every** PIE card TSX file.
- `<button type="button">` — always set; without it the browser submits a form to `/api/process/`.
- `is_typed=False` — required in every `AsyncPage` subclass that does not override `get_content`.
- Python `snake_case` → camelCase on frontend. `send_label` → `sendLabel`. Match in both TS types and component code.
- After editing `web.py` (adding a new route) — **restart the backend process**.
- Never commit `.env`, `.pie/`, `.claude/`, `node_modules/`, `.next/`, `__pycache__/`, `.venv/`.

---

## 3. pieui CLI — All Commands

### 3.1 Auth

```bash
pieui login
```

Opens a browser URL for OAuth. On success writes `{ user_id, api_key, project }` to `.pie/config.json` and appends vars to `.env`.

**When:** Before any `card remote` or first project setup.
**Note:** Run from the project root so config is saved in the right `.pie/config.json`.

---

### 3.2 Init

```bash
pieui init [--out-dir <dir>]
```

Creates `piecomponents/registry.ts` in the project. Required once per new frontend project.

| Flag | Default | Description |
|---|---|---|
| `--out-dir`, `-o` | `.` | Base directory for piecomponents |

```bash
pieui init                          # standard
pieui init --out-dir packages/app   # monorepo sub-package
```

---

### 3.3 Create project

```bash
pieui create <AppName>          # scaffold Next.js app + run pieui init
pieui create-pie-app <AppName>  # blank Next.js template only
pieui create-pieui <AppName>    # alias for create-pie-app
```

**When:** Starting a new frontend project from scratch.

---

### 3.4 `page add`

```bash
pieui page add <path>
```

Generates `app/<path>/page.tsx` with the standard PIE Suspense wrapper.

```bash
pieui page add wallet/address
pieui page add wallet/send
pieui page add chat
```

**When:** Every new route. One command per page.
**No flags.**

---

### 3.5 `card add`

```bash
pieui card add [type] <ComponentName> [--io] [--ajax]
```

Scaffolds `piecomponents/<ComponentName>/` with `index.ts`, `types/index.ts`, `ui/<ComponentName>.tsx`.
Also updates `piecomponents/registry.ts` automatically.

**Types:**

| Type | Props signature | Use when |
|---|---|---|
| `simple` | `{ data }` | Card displays data, no children |
| `complex` | `{ data, children }` | Card wraps other components |
| `simple-container` | `{ data, content }` | Card has single content slot |
| `complex-container` | `{ data, content[] }` | Card has array content slots (default) |

**Flags:**

| Flag | What it adds |
|---|---|
| `--ajax` | `pathname`, `depsNames`, `kwargs` fields to the data interface |
| `--io` | Realtime / websocket support fields |

```bash
pieui card add simple WalletAddressCard
pieui card add complex-container LayoutCard
pieui card add simple LivePriceCard --io
pieui card add simple SendCard --ajax
pieui card add simple ChatCard --io --ajax
```

**When:** Every new component. Match the type to how the card will be used in the page tree.

---

### 3.6 `card remove`

```bash
pieui remove <ComponentName>
```

Deletes `piecomponents/<ComponentName>/` and removes the entry from `registry.ts`.

**When:** Removing a component that is no longer needed. Never delete manually.

---

### 3.7 `list`

```bash
pieui list [filter] [--src-dir <dir>]
```

Prints a table of all registered components: Name, Type, Data Type, Lazy, File.

| Filter | Shows |
|---|---|
| *(none)* | All components |
| `simple` | Simple only |
| `complex` | Complex only |
| `simple-container` | Simple containers |
| `complex-container` | Complex containers |

```bash
pieui list
pieui list simple
pieui list complex-container --src-dir app
```

**When:** Audit what's registered; before adding to verify name doesn't exist.

---

### 3.8 `list-events`

```bash
pieui list-events <ComponentName> [--src-dir <dir>]
```

Prints all `methods` keys declared in `<PieCard card="X" methods={...} />` for the component.

```bash
pieui list-events SendCard
```

**When:** Before adding an event (to avoid duplicates); auditing a card's API surface.

---

### 3.9 `add-event`

```bash
pieui add-event <ComponentName> <event> [--src-dir <dir>]
```

Adds a new key with a default handler to `<PieCard ... methods={{ <event>: handler }}>` in the component's TSX.

```bash
pieui add-event SendCard submit
pieui add-event ChatCard message
```

**When:** Adding realtime or AJAX event handlers to an existing card. Always use this — never edit the methods object manually.

---

### 3.10 `postbuild`

```bash
pieui postbuild [--out-dir <dir>] [--src-dir <dir>] [--append]
```

Scans piecomponents and generates a manifest JSON (used for SSR / production builds).

| Flag | Default | Description |
|---|---|---|
| `--out-dir`, `-o` | `public` | Output directory for manifest |
| `--src-dir`, `-s` | `src` | Source directory to scan |
| `--append` | off | Include built-in pieui components in the manifest |

```bash
pieui postbuild
pieui postbuild --append --out-dir dist
```

**When:** Part of the production build step (`next build`).

---

### 3.11 `card remote push`

```bash
pieui card remote push <ComponentName>
```

Uploads `piecomponents/<ComponentName>/` to the platform. Assigns a new revision `@N`.
Stores files under the `typescript/` envelope for the component.

```bash
pieui card remote push WalletAddressCard
```

**When:** After implementing a card and ready to publish; after every significant update.
**Note:** Each push = new immutable revision. Old revisions remain pullable by `@N`.

---

### 3.12 `card remote pull`

```bash
pieui card remote pull <ComponentName>[@rev]
pieui card remote pull <project>/<ComponentName>[@rev]
pieui card remote pull r/<user>/<ComponentName>
```

Downloads a component into `piecomponents/`. Overwrites local files.

| Form | Access |
|---|---|
| `MyCard` | Latest from current project |
| `MyCard@7` | Specific revision from current project |
| `other-proj/MyCard` | Another project of the **same user** |
| `r/username/MyCard` | Public component by any user |

```bash
pieui card remote pull WalletAddressCard
pieui card remote pull WalletAddressCard@3
pieui card remote pull r/delta37/PriceTickerCard
```

**When:** Onboarding to a new machine; reverting to a previous revision; reusing a public component.

---

### 3.13 `card remote list`

```bash
pieui card remote list [--user <U>] [--project <S>]
```

Lists component names on the platform.

```bash
pieui card remote list
pieui card remote list --user j4h5u5 --project my-other-project
```

**Note:** `--user / --project` only works if your API key has access to that project.

---

### 3.14 `card remote history`

```bash
pieui card remote history <ComponentName> [--page N] [--per-page N] [--from R] [--to R]
```

Shows revision history with per-file diffs (git-style). Includes both `python/` and `typescript/` envelope files.

| Flag | Default | Description |
|---|---|---|
| `--page` | 1 | Page number |
| `--per-page` | 10 | Revisions per page |
| `--from` | — | Start revision number |
| `--to` | — | End revision number |

```bash
pieui card remote history WalletAddressCard
pieui card remote history WalletAddressCard --page 2 --per-page 5
pieui card remote history WalletAddressCard --from 3 --to 7
```

**When:** Auditing what changed between pushes; debugging regressions.

---

### 3.15 `card remote public / private`

```bash
pieui card remote public <ComponentName>
pieui card remote private <ComponentName>
```

Makes a component readable by anyone as `r/<user>/<Name>`, or reverts to private.

```bash
pieui card remote public PriceTickerCard
pieui card remote private PriceTickerCard
```

---

### 3.16 `card remote remove`

```bash
pieui card remote remove <ComponentName>
```

Deletes the component from the platform (all revisions). Does not touch local files.

---

## 4. pie CLI — All Commands

### 4.1 Auth

```bash
pie login
```

Same OAuth flow as pieui. Writes to `.pie/config.json` in CWD and appends to `.env`.

**Critical:** Run from the backend project root directory. pie reads `.pie/config.json` relative to CWD.
If env vars `PIE_USER_ID`, `PIE_API_KEY`, `PIE_PROJECT` are set, they take precedence over config file.

```bash
cd my-api-project && pie login
```

---

### 4.2 `page add`

```bash
pie page add <path>
```

Creates `pages/<slug>.py` with an `AsyncPage` subclass, and links it in a stub.

```bash
pie page add wallet/address    # → pages/wallet_address.py
pie page add chat              # → pages/chat.py
```

**When:** Every new route on the backend. Then register the page class in `web.py`.

---

### 4.3 `card add`

```bash
pie card add [type] <ComponentName>
```

Creates `pages/components/<snake_name>.py` with a `Card` dataclass.

```bash
pie card add simple WalletAddressCard
pie card add complex ChatCard
```

**When:** Same time as `pieui card add` — both must exist for a complete component.

---

### 4.4 `card list`

```bash
pie card list
```

Prints a table: Name, Type, Ajax, IO, File path.

**When:** Verify all cards are registered; quick audit before push.

---

### 4.5 `card view`

```bash
pie card view <ComponentName>
```

Pretty-prints a card's full props table: field name, Python type, default value — plus Ajax / IO / Events flags.

```bash
pie card view WalletAddressCard
```

Output example:
```
Name: WalletAddressCard
Props:
+---------------+----------------+--------+
| Name          | Type           | Default|
+---------------+----------------+--------+
| title         | str            | 'My...'|
| network_label | str            | 'TON'  |
...
Ajax: yes  IO: no  Events: no
```

**When:** Quick inspection of a card's contract without opening the file.

---

### 4.6 `card dump-metadata`

```bash
pie card dump-metadata <ComponentName> [--out <file.json>]
```

Outputs full JSON metadata for the card in the **Python envelope** format:

```json
{
  "python": {
    "name": "WalletAddressCard",
    "propsSchema": { "properties": { ... }, "type": "object" },
    "propsCode": "@dataclass\nclass WalletAddressCard...",
    "ajaxList": ["pathname"],
    "events": [],
    "eventsPropsCode": {},
    "eventsPropsSchema": {},
    "inputPropsCode": null,
    "inputPropsSchema": null,
    "files": [{ "path": "wallet_address_card.py", "content": "..." }],
    "packages": ["pie"]
  }
}
```

| Flag | Default | Description |
|---|---|---|
| `--out`, `-o` | stdout | Write JSON to file instead of printing |

```bash
pie card dump-metadata WalletAddressCard
pie card dump-metadata WalletAddressCard --out meta.json
```

**When:** Debugging schema issues; sharing a card contract with another developer; input to `check-sync` review.

---

### 4.7 `card check-sync`

```bash
pie card check-sync <ComponentName>
```

Fetches the Python props schema (local) and TypeScript props schema (from `frontendProjectDir`) and diffs them field by field.

**Requires** `frontendProjectDir` in `.pie/config.json`:
```json
{
  "user_id": "...",
  "api_key": "...",
  "project": "...",
  "frontendProjectDir": "/absolute/path/to/frontend"
}
```

```bash
pie card check-sync WalletAddressCard
```

**When:** After editing either Python or TypeScript side; before pushing to the platform; as part of CI.
See [section 9](#9-check-sync-findings-guide) for interpreting output.

---

### 4.8 `card list-events`

```bash
pie card list-events <ComponentName>
```

Lists all `get_supported_events()` entries for the card (static parse of the Python source).

---

### 4.9 `card add-event`

```bash
pie card add-event <ComponentName> <event_name>
```

Adds an IO event handler stub to the Python card file.

```bash
pie card add-event ChatCard message
```

---

### 4.10 `card pull`

```bash
pie card pull <REF>
```

Downloads a Python card from the platform into `pages/components/`.

| REF form | Access |
|---|---|
| `MyCard` | Current project |
| `other-proj/MyCard` | Another project of the same user |
| `r/username/MyCard` | Public component by any user |

```bash
pie card pull WalletAddressCard
pie card pull r/delta37/PriceTickerCard
```

**When:** Onboarding; reusing a component from another project; restoring after local deletion.

---

### 4.11 `card remote push`

```bash
PIE_USER_ID=x PIE_API_KEY=y PIE_PROJECT=z pie card remote push <ComponentName>
```

Same as `pieui card remote push` but for the Python side. Stores files under the `python/` envelope.

**Known issue:** `pie card remote push` does not pick up `.pie/config.json` when invoked with env var overrides. Run from project root without env vars, or pass all three vars explicitly.

```bash
# Preferred: run from project root
cd my-api && pie card remote push WalletAddressCard

# Fallback: explicit env vars
PIE_USER_ID=j4h5u5 PIE_API_KEY=rp-xxx PIE_PROJECT=my-api \
  pie card remote push WalletAddressCard
```

---

### 4.12 `web`

```bash
pie web run    # start the FastAPI server
pie web lint   # lint the application
```

Alternative to running `uvicorn` directly.

---

### 4.13 `self-upgrade`

```bash
pie self-upgrade
```

Upgrades the installed `pie` package to the latest version.

---

## 5. Envelope Policy

The platform stores each component in **two separate envelopes**:

```
j4h5u5/my-project/MyCard/
  ├── python/my_card.py          ← written by  pie card remote push
  └── typescript/
      ├── piecomponents/MyCard/index.ts
      ├── piecomponents/MyCard/types/index.ts
      └── piecomponents/MyCard/ui/MyCard.tsx   ← written by pieui card remote push
```

**Why this matters:**

1. `pie card remote push` only touches `python/`. It does not overwrite TypeScript files.
2. `pieui card remote push` only touches `typescript/`. It does not overwrite Python files.
3. `pie card remote pull` restores only the Python file locally.
4. `pieui card remote pull` restores only the TypeScript files locally.
5. `card remote history` shows diffs for **both** envelopes in the same revision timeline — you can see Python and TS changes side by side.
6. `check-sync` fetches both envelopes from the platform and compares their schemas.

**Consequence:** You must push both sides separately. A component is fully published only after both `pie card remote push` and `pieui card remote push` have been called.

**API key scope:** Each project has its own API key. A key for `project-api` cannot read `project-ui` even for the same `user_id`. Store and use keys per-project.

---

## 6. Workflow Recipes

### Recipe 1 — Create a page with AJAX card

```bash
# Frontend
pieui page add wallet/send
pieui card add simple SendCard --ajax
# Implement piecomponents/SendCard/types/index.ts and ui/SendCard.tsx

# Backend
pie page add wallet/send
pie card add simple SendCard
# Implement pages/components/send_card.py + pages/wallet_send.py
# Register in web.py: "wallet/send": WalletSendPage()
# Restart backend
```

The `--ajax` flag adds `pathname: Optional[str]`, `deps_names`, `kwargs` to both scaffolded files. These enable page-navigation callbacks from the card.

---

### Recipe 2 — Create a realtime card with events

```bash
# Frontend
pieui card add simple LivePriceCard --io
pieui add-event LivePriceCard priceUpdate    # adds methods.priceUpdate handler

# Backend
pie card add simple LivePriceCard
pie card add-event LivePriceCard price_update

# Implement both sides, then push
pieui card remote push LivePriceCard
PIE_USER_ID=x PIE_API_KEY=y PIE_PROJECT=z pie card remote push LivePriceCard
```

---

### Recipe 3 — Verify backend ↔ frontend contract

```bash
# 1. Dump Python schema to file for reference
pie card dump-metadata MyCard --out /tmp/my_card_meta.json

# 2. Run sync check
pie card check-sync MyCard
# Read output — see section 9 for interpretation

# 3. If real mismatches found — fix types, then re-check
pie card check-sync MyCard

# 4. TypeScript compile check
npx tsc --noEmit
```

---

### Recipe 4 — Publish a card

```bash
# 1. Push TypeScript side
pieui card remote push MyCard
# → MyCard@1

# 2. Push Python side
pie card remote push MyCard
# → MyCard@1

# 3. Verify both sides landed
pieui card remote history MyCard
# Confirm diff shows both python/ and typescript/ files

# 4. (Optional) Make public
pieui card remote public MyCard
# Now accessible as r/username/MyCard by anyone
```

---

### Recipe 5 — Port a card from the platform to a new project

```bash
# Pull TypeScript files
pieui card remote pull r/username/MyCard         # public
# or
pieui card remote pull other-proj/MyCard         # your other project
# or
pieui card remote pull MyCard@5                  # specific revision

# Pull Python files
pie card pull r/username/MyCard
# or
pie card pull other-proj/MyCard

# Register in web.py if needed, then implement business logic
```

---

### Recipe 6 — Full project push (after implementation complete)

```bash
# 1. Type check
npx tsc --noEmit

# 2. Sync check all cards
for card in CardA CardB CardC; do
  pie card check-sync $card
done

# 3. Push all frontend cards
for card in CardA CardB CardC; do
  pieui card remote push $card
done

# 4. Push all backend cards
for card in CardA CardB CardC; do
  pie card remote push $card
done

# 5. Git
git add .
git commit -m "feat: ..."
git push
```

---

## 7. Edge Cases & IntrospectionErrors

### `pie card remote push` ignores `.pie/config.json`

When `PIE_USER_ID` / `PIE_API_KEY` / `PIE_PROJECT` env vars are set, pie looks for config in the **parent directories** of CWD rather than CWD itself. This causes "user_id required" errors even if `.pie/config.json` exists in the current folder.

**Fix:** Either unset the env vars and run from project root, or pass all three vars explicitly:
```bash
PIE_USER_ID=j4h5u5 PIE_API_KEY=rp-xxx PIE_PROJECT=my-project pie card remote push MyCard
```

---

### `check-sync` requires `frontendProjectDir`

`pie card check-sync` needs to know where the frontend project lives to read TypeScript type files. If not configured:
```
[pie] Frontend project path required to run check-sync.
```
**Fix:** Add to `.pie/config.json`:
```json
{ "frontendProjectDir": "/absolute/path/to/frontend" }
```

---

### API key 403 on `card remote list --project`

Each project has a scoped API key. A key for project A cannot access project B even for the same user.
**Fix:** Log in to the target project with `pieui login` / `pie login` to get the correct key.

---

### TON API key 401 from toncenter

`TonClient({ apiKey: "..." })` sends the key as `X-API-Key` header. Toncenter requires it as a **URL query param**.

**Fix:** Embed the key in the endpoint URL:
```typescript
const endpoint = `https://toncenter.com/api/v2/jsonRPC?api_key=${TON_API_KEY}`
const client = new TonClient({ endpoint })  // no apiKey field
```

---

### Stale Next.js bundle after `.env` change

The Next.js dev server caches SSR bundles. After changing `.env` values, the old bundle may still be served.

**Fix:**
```bash
rm -rf .next && bun run dev -- --port 3001
```

---

### Turbopack incompatible with native `.node` bindings

Some crypto packages (TON, Solana native modules) use `.node` binaries that Turbopack cannot handle.

**Fix:** Use webpack mode:
```bash
bun run dev -- --port 3001    # not: bun run dev --turbo
```

---

### `is_typed` error on AsyncPage

Missing `is_typed=False` in `__init__` causes a runtime type error on page load.

**Fix:**
```python
class MyPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([MyCard(name="MyCard")])
```

---

### Form submits to `/api/process/` instead of handler

Button inside a `<PieCard>` without `type="button"` is treated as a submit button.

**Fix:** Always use:
```tsx
<button type="button" onClick={...}>label</button>
```

---

### Python snake_case props not found in TS

PIE converts Python `snake_case` field names to `camelCase` when sending to the frontend. If TS types use `snake_case`, props will be `undefined`.

**Fix:** Always use camelCase in TS interfaces:
```typescript
// ❌ wrong
networkLabel: string   // Python: network_label ✓  TS: networkLabel ✓
// ✓ correct
sendLabel: string
```

---

## 8. Project Setup & .gitignore

### Monorepo structure

```
my-project/                 ← git root (Next.js frontend)
├── api/                    ← Python backend (subdirectory)
│   ├── pages/
│   ├── web.py
│   ├── pyproject.toml
│   └── .pie/               ← gitignored
├── piecomponents/
├── app/
├── lib/
├── .env                    ← gitignored (secrets)
├── .env.example            ← committed (template)
└── .pie/                   ← gitignored
```

To avoid git treating `api/` as a submodule: remove `api/.git` before committing.
```bash
rm -rf api/.git
git add api/
```

### .gitignore

```gitignore
# Frontend
/node_modules
/.next/
*.tsbuildinfo
next-env.d.ts
/coverage
/out
/build

# Backend
api/.venv/
api/**/__pycache__/
api/**/*.pyc
api/.env
api/.pie/

# Secrets & credentials
.env
.env.*
!.env.example
.pie/

# Misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
.claude/
```

---

## 9. check-sync Findings Guide

`pie card check-sync MyCard` output patterns and how to respond:

| Finding | Meaning | Action |
|---|---|---|
| `Python allows null, TS is required+non-null` | Python dataclass defaults make fields nullable in JSON Schema; TS correctly requires them | **No action** — expected, backend always sends a value |
| `depsNames / kwargs / flow / pathname` in Python, not in TS | PIE base `Card` class internal fields | **No action** — framework internals, frontend doesn't need them |
| `integer` vs `number` | Python `int` → JSON Schema `integer`; TS `number` → JSON Schema `number` | **No action** — integers are valid JS numbers |
| `array` vs `object` for list types | Schema generation difference between Python and TypeScript for `List[str]` / `string[]` | **No action** — runtime compatible |
| Field in TS but **not** in Python | Missing field in Python dataclass | **Fix:** Add field to `pages/components/my_card.py` |
| Field in Python but **not** in TS (non-framework field) | Missing field in TypeScript interface | **Fix:** Add field to `piecomponents/MyCard/types/index.ts` |
| Type completely incompatible (e.g. `string` vs `number`) | Real contract mismatch | **Fix:** Align types on both sides |
