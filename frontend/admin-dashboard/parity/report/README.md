# Parity report

Baseline (Angular 17, :4000) vs upgraded (Angular 21, :4200). Same specs, separate mock gateways.

| Page / flow | Baseline | Upgraded |
|---|---|---|
| 01-auth › login page renders and validates empty credentials | pass | pass |
| 01-auth › password visibility toggle | pass | pass |
| 01-auth › sign in, see shell, sign out | pass | pass |
| 01-auth › API calls carry the bearer token and a 401 signs the user out | pass | pass |
| 02-dashboard › dashboard stats and charts | pass | pass |
| 02-dashboard › sidebar navigation and collapse | pass | pass |
| 03-users › users list paginates, searches and filters | pass | pass |
| 03-users › suspend, restore and delete a user from the list | pass | pass |
| 03-users › user detail page | pass | pass |
| 03-users › user detail for an unknown user keeps loading | pass | pass |
| 04-audit-features › audit logs list, search and filters | pass | pass |
| 04-audit-features › feature flags search and toggle | pass | pass |
| 05-health-analytics › system health summary and service cards | pass | pass |
| 05-health-analytics › analytics charts render | pass | pass |
| 06-announcements-quotas › announcements create, publish and delete | pass | pass |
| 06-announcements-quotas › storage quotas list and update | pass | pass |
| 07-incidents › incidents summary, filters and closed toggle | pass | pass |
| 07-incidents › report incident form validation and create | pass | pass |
| 07-incidents › launch Devin, resolve, close and delete incidents | pass | pass |
| 07-incidents › demo controls: auto-investigate and chaos | pass | pass |
| **Total** | **20/20** | **20/20** |

## Screenshots (baseline left, upgraded right)

| Page | Pixel diff | Side by side |
|---|---|---|
| 01-login-error | 0.00% | [view](side-by-side/01-login-error.png) |
| 01-login | 0.00% | [view](side-by-side/01-login.png) |
| 02-dashboard | 0.25% | [view](side-by-side/02-dashboard.png) |
| 03-users-filtered | 0.07% | [view](side-by-side/03-users-filtered.png) |
| 03-users | 0.24% | [view](side-by-side/03-users.png) |
| 04-user-detail | 0.25% | [view](side-by-side/04-user-detail.png) |
| 05-audit | 0.71% | [view](side-by-side/05-audit.png) |
| 06-features | 0.07% | [view](side-by-side/06-features.png) |
| 07-health | 0.13% | [view](side-by-side/07-health.png) |
| 08-analytics | 0.33% | [view](side-by-side/08-analytics.png) |
| 09-announcements-form | 0.03% | [view](side-by-side/09-announcements-form.png) |
| 09-announcements | 0.03% | [view](side-by-side/09-announcements.png) |
| 10-quotas | 0.00% | [view](side-by-side/10-quotas.png) |
| 11-incidents-demo-controls | 0.07% | [view](side-by-side/11-incidents-demo-controls.png) |
| 11-incidents-form | 0.04% | [view](side-by-side/11-incidents-form.png) |
| 11-incidents | 0.04% | [view](side-by-side/11-incidents.png) |
