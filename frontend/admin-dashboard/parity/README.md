# Admin dashboard parity suite

Playwright specs that run unchanged against two builds of the admin dashboard:

| Project | App | Mock gateway |
|---|---|---|
| `baseline` | http://localhost:4000 (pre-upgrade checkout) | http://127.0.0.1:8091 |
| `upgraded` | http://localhost:4200 (this checkout) | http://127.0.0.1:8092 |

`mock-api/` is a dependency-free, deterministic stand-in for the API gateway's
`/api/v1/admin/*` routes (snake_case wire format). Each app gets its own instance so
mutations never leak between runs; specs call `POST /__reset` before each test.

```bash
REPO=$(git rev-parse --show-toplevel)   # run from anywhere inside the careotter checkout

# mocks (bind 127.0.0.1 only; HOST=... to override)
cd "$REPO/frontend/admin-dashboard/parity" && npm ci && npx playwright install chromium
PORT=8091 node mock-api/server.mjs &   # baseline gateway
PORT=8092 node mock-api/server.mjs &   # upgraded gateway

# baseline app (separate worktree of main, Node 20)
git -C "$REPO" worktree add "$REPO/../careotter-baseline" c52ca8b   # last Angular 17 commit on main
cd "$REPO/../careotter-baseline/frontend/admin-dashboard" && npm ci
API_GATEWAY_URL=http://127.0.0.1:8091 npx ng serve --port 4000 &

# upgraded app (this checkout, Node 20.19+ / 22.12+)
cd "$REPO/frontend/admin-dashboard" && npm ci
API_GATEWAY_URL=http://127.0.0.1:8092 npx ng serve --port 4200 &

# run + report
cd "$REPO/frontend/admin-dashboard/parity"
npx playwright test            # both projects
npm run report                 # side-by-side PNGs, pixel diff %, report/README.md
```

Each test first checks `GET <app>/api/v1/admin/__parity` returns this project's mock port, so the
suite refuses to run against an app that proxies to a real gateway.
