// Deterministic stand-in for the API gateway's /api/v1/admin/* routes used by the
// admin dashboard. Each app under test gets its own instance (own port, own state)
// so baseline and upgraded runs never see each other's writes.
// POST /__reset restores the seed data. Usage: PORT=8091 node server.mjs
import http from 'node:http';
import { seed } from './seed.mjs';

const port = Number(process.env.PORT || 8091);
const host = process.env.HOST || '127.0.0.1';
const MAX_BODY = 1024 * 1024;
let db = seed();
let nextId = 1000;
const now = () => '2026-11-20T12:00:00.000Z';

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const readBody = req => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', c => {
    data += c;
    if (data.length > MAX_BODY) {
      reject(new HttpError(413, 'body too large'));
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      const parsed = data ? JSON.parse(data) : {};
      resolve(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
    } catch {
      reject(new HttpError(400, 'invalid JSON body'));
    }
  });
  req.on('error', reject);
});

function summary() {
  const byRole = {};
  const byTier = { standard: 0, premium: 0 };
  let used = 0;
  for (const u of db.users) {
    byRole[u.role] = (byRole[u.role] || 0) + 1;
    used += u.storage_quota.used_bytes;
    byTier[u.storage_quota.quota_bytes > 5 * 1024 ** 3 ? 'premium' : 'standard'] += u.storage_quota.used_bytes;
  }
  const topActions = {};
  for (const e of db.audit) topActions[e.action] = (topActions[e.action] || 0) + 1;
  return {
    users: {
      total: db.users.length,
      active: db.users.filter(u => u.status === 'active').length,
      suspended: db.users.filter(u => u.status === 'suspended').length,
      by_role: byRole,
    },
    storage: { total_used_bytes: used, by_tier: byTier },
    audit: { total_events: db.audit.length, top_actions: topActions },
  };
}

function audit(action, resourceType, resourceId) {
  db.audit.unshift({
    id: `evt-${nextId++}`, actor_id: 'a0000000-0000-0000-0000-000000000001', actor_email: 'admin@careotter.io',
    action, resource_type: resourceType, resource_id: resourceId, ip_address: '127.0.0.1', created_at: now(),
  });
}

const routes = [
  ['POST', /^\/__reset$/, () => { db = seed(); nextId = 1000; return [200, { ok: true }]; }],
  ['GET', /^\/health$/, () => [200, { status: 'ok' }]],
  ['GET', /^\/api\/v1\/admin\/metrics\/summary$/, () => [200, summary()]],
  ['GET', /^\/api\/v1\/admin\/users$/, () => [200, { users: db.users }]],
  ['GET', /^\/api\/v1\/admin\/users\/([^/]+)$/, (m) => {
    const u = db.users.find(x => x.id === m[1]);
    return u ? [200, u] : [404, { error: 'not found' }];
  }],
  ['PUT', /^\/api\/v1\/admin\/users\/([^/]+)\/(suspend|activate)$/, (m) => {
    const u = db.users.find(x => x.id === m[1]);
    if (!u) return [404, { error: 'not found' }];
    u.status = m[2] === 'suspend' ? 'suspended' : 'active';
    audit(m[2] === 'suspend' ? 'user.suspended' : 'user.activated', 'user', u.id);
    return [200, u];
  }],
  ['DELETE', /^\/api\/v1\/admin\/users\/([^/]+)$/, (m) => {
    db.users = db.users.filter(x => x.id !== m[1]);
    audit('user.deleted', 'user', m[1]);
    return [204];
  }],
  ['GET', /^\/api\/v1\/admin\/audit-logs$/, (_m, url) => {
    const actor = url.searchParams.get('actor_id');
    const logs = actor ? db.audit.filter(e => e.actor_id === actor) : db.audit;
    return [200, { audit_logs: logs }];
  }],
  ['GET', /^\/api\/v1\/admin\/features$/, () => [200, { features: db.features }]],
  ['PUT', /^\/api\/v1\/admin\/features\/([^/]+)$/, (m, _u, body) => {
    const f = db.features.find(x => x.id === m[1]);
    if (!f) return [404, { error: 'not found' }];
    f.enabled = !!body.feature?.enabled;
    return [200, f];
  }],
  ['GET', /^\/api\/v1\/admin\/health\/services$/, () => [200, db.health]],
  ['GET', /^\/api\/v1\/admin\/announcements$/, () => [200, { announcements: db.announcements }]],
  ['POST', /^\/api\/v1\/admin\/announcements$/, (_m, _u, body) => {
    const a = { id: `ann-${nextId++}`, ...body.announcement, created_by: 'Admin User', created_at: now(), updated_at: now() };
    db.announcements.unshift(a);
    return [201, a];
  }],
  ['PUT', /^\/api\/v1\/admin\/announcements\/([^/]+)$/, (m, _u, body) => {
    const a = db.announcements.find(x => x.id === m[1]);
    if (!a) return [404, { error: 'not found' }];
    Object.assign(a, body.announcement, { updated_at: now() });
    return [200, a];
  }],
  ['DELETE', /^\/api\/v1\/admin\/announcements\/([^/]+)$/, (m) => {
    db.announcements = db.announcements.filter(x => x.id !== m[1]);
    return [204];
  }],
  ['PUT', /^\/api\/v1\/admin\/quotas\/([^/]+)$/, (m, _u, body) => {
    const u = db.users.find(x => x.id === m[1]);
    if (!u) return [404, { error: 'not found' }];
    u.storage_quota.quota_bytes = body.quota?.quota_bytes ?? u.storage_quota.quota_bytes;
    return [200, u.storage_quota];
  }],
  ['GET', /^\/api\/v1\/admin\/incidents$/, () => [200, { incidents: db.incidents }]],
  ['GET', /^\/api\/v1\/admin\/incidents\/([^/]+)$/, (m) => {
    const i = db.incidents.find(x => x.id === m[1]);
    return i ? [200, { incident: i }] : [404, { error: 'not found' }];
  }],
  ['POST', /^\/api\/v1\/admin\/incidents$/, (_m, _u, body) => {
    const id = `inc-${nextId++}`;
    const i = {
      id, ...body.incident, status: 'investigating', active: true,
      devin_session_id: `devin-${id}`, devin_session_url: `https://app.devin.ai/sessions/devin-${id}`,
      devin_session_status: 'running', reporter_id: 'a0000000-0000-0000-0000-000000000001',
      created_at: now(), updated_at: now(),
    };
    db.incidents.unshift(i);
    return [201, { incident: i }];
  }],
  ['POST', /^\/api\/v1\/admin\/incidents\/([^/]+)\/trigger_session$/, (m) => {
    const i = db.incidents.find(x => x.id === m[1]);
    if (!i) return [404, { error: 'not found' }];
    Object.assign(i, {
      status: 'investigating', devin_session_id: `devin-${i.id}`,
      devin_session_url: `https://app.devin.ai/sessions/devin-${i.id}`, devin_session_status: 'running',
    });
    return [200, { incident: i }];
  }],
  ['PATCH', /^\/api\/v1\/admin\/incidents\/([^/]+)$/, (m, _u, body) => {
    const i = db.incidents.find(x => x.id === m[1]);
    if (!i) return [404, { error: 'not found' }];
    const status = body.incident?.status;
    i.status = status;
    i.active = status === 'open' || status === 'investigating';
    if (status === 'resolved') i.resolved_at = now();
    if (status === 'closed') i.closed_at = now();
    i.updated_at = now();
    return [200, { incident: i }];
  }],
  ['DELETE', /^\/api\/v1\/admin\/incidents\/([^/]+)$/, (m) => {
    const incident = db.incidents.find(x => x.id === m[1]);
    if (incident?.devin_session_id && incident.devin_session_status === 'running') {
      return [409, {
        error: 'Cannot delete incident with an active Devin session',
        details: `Stop Devin session '${incident.devin_session_id}' before deleting`,
      }];
    }
    db.incidents = db.incidents.filter(x => x.id !== m[1]);
    return [204];
  }],
  ['POST', /^\/api\/v1\/admin\/chaos$/, (_m, _u, body) => {
    db.chaos[body.service] = body.scenario;
    return [200, { status: 'armed', key: `chaos:${body.service}:${body.scenario}`, expires_in: 600 }];
  }],
  ['DELETE', /^\/api\/v1\/admin\/chaos$/, () => {
    const cleared = Object.keys(db.chaos).map(s => `chaos:${s}:${db.chaos[s]}`);
    db.chaos = {};
    return [200, { status: 'cleared', cleared }];
  }],
  ['GET', /^\/api\/v1\/admin\/settings\/auto_investigate$/, () => [200, { enabled: db.autoInvestigate }]],
  ['PUT', /^\/api\/v1\/admin\/settings\/auto_investigate$/, (_m, _u, body) => {
    db.autoInvestigate = !!body.enabled;
    return [200, { enabled: db.autoInvestigate }];
  }],
];

routes.push(['GET', /^\/api\/v1\/admin\/__parity$/, () => [200, { mock: true, port }]]);

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    const route = routes.find(([method, re]) => method === req.method && re.test(url.pathname));
    if (!route) return send(res, 404, { error: `no mock for ${req.method} ${url.pathname}` });
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
    const [status, payload] = route[2](url.pathname.match(route[1]), url, body);
    send(res, status, payload);
  } catch (err) {
    if (!res.headersSent) send(res, err instanceof HttpError ? err.status : 500, { error: String(err.message || err) });
  }
}).listen(port, host, () => console.log(`mock admin API on ${host}:${port}`));
