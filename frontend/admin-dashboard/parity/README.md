# Admin dashboard parity suite

Playwright specs that run unchanged against two builds of the admin dashboard:

| Project | App | Mock gateway |
|---|---|---|
| `baseline` | http://localhost:4000 (pre-upgrade checkout) | http://localhost:8091 |
| `upgraded` | http://localhost:4200 (this checkout) | http://localhost:8092 |

`mock-api/` is a dependency-free, deterministic stand-in for the API gateway's
`/api/v1/admin/*` routes (snake_case wire format). Each app gets its own instance so
mutations never leak between runs; specs call `POST /__reset` before each test.

```bash
# mocks
cd frontend/admin-dashboard/parity && npm ci && npx playwright install chromium
PORT=8091 node mock-api/server.mjs &   # baseline gateway
PORT=8092 node mock-api/server.mjs &   # upgraded gateway

# baseline app (separate worktree of main, Node 20)
git worktree add ../careotter-baseline origin/main
cd ../careotter-baseline/frontend/admin-dashboard && npm ci
API_GATEWAY_URL=http://localhost:8091 npx ng serve --port 4000 &

# upgraded app (this checkout)
cd frontend/admin-dashboard && npm ci
API_GATEWAY_URL=http://localhost:8092 npx ng serve --port 4200 &

# run + report
cd frontend/admin-dashboard/parity
npx playwright test            # both projects
npm run report                 # side-by-side PNGs, pixel diff %, report/README.md
```
