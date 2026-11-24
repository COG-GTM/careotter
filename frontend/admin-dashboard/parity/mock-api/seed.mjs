// Seed data in the admin-service wire format (snake_case), fixed timestamps.
const GB = 1024 ** 3;
const MB = 1024 ** 2;

const people = [
  ['u-001', 'Dr. Maya Okafor', 'maya.okafor@careotter.io', 'admin', 'active', 'Cardiology', 42, 3.2 * GB, 10 * GB],
  ['u-002', 'Liam Chen', 'liam.chen@careotter.io', 'editor', 'active', 'Front Desk', 18, 1.1 * GB, 5 * GB],
  ['u-003', 'Sofia Rossi', 'sofia.rossi@careotter.io', 'viewer', 'suspended', 'Billing', 3, 120 * MB, 2 * GB],
  ['u-004', 'Noah Patel', 'noah.patel@careotter.io', 'editor', 'active', 'Pediatrics', 27, 4.7 * GB, 5 * GB],
  ['u-005', 'Ava Johnson', 'ava.johnson@careotter.io', 'viewer', 'pending', '', 0, 0, 1 * GB],
  ['u-006', 'Ethan Müller', 'ethan.muller@careotter.io', 'admin', 'active', 'IT', 65, 8.4 * GB, 20 * GB],
  ['u-007', 'Isabella García', 'isabella.garcia@careotter.io', 'editor', 'active', 'Radiology', 31, 2.6 * GB, 5 * GB],
  ['u-008', 'Lucas Dubois', 'lucas.dubois@careotter.io', 'viewer', 'active', 'Pharmacy', 9, 640 * MB, 2 * GB],
  ['u-009', 'Mia Kowalski', 'mia.kowalski@careotter.io', 'editor', 'suspended', 'Oncology', 14, 1.9 * GB, 5 * GB],
  ['u-010', 'Oliver Smith', 'oliver.smith@careotter.io', 'viewer', 'active', 'Front Desk', 5, 310 * MB, 1 * GB],
  ['u-011', 'Chloe Nguyen', 'chloe.nguyen@careotter.io', 'editor', 'active', 'Dermatology', 22, 1.4 * GB, 5 * GB],
  ['u-012', 'James Brown', 'james.brown@careotter.io', 'viewer', 'active', 'Billing', 7, 950 * MB, 1 * GB],
];

const day = n => `2026-11-${String(n).padStart(2, '0')}T09:30:00.000Z`;

const auditRows = [
  ['user.login', 'session', null, 'u-001'],
  ['document.created', 'document', 'doc-9f2a', 'u-001'],
  ['document.updated', 'document', 'doc-9f2a', 'u-002'],
  ['file.upload', 'file', 'lab-results-2026.pdf', 'u-004'],
  ['document.share', 'document', 'doc-77b1', 'u-007'],
  ['user.suspended', 'user', 'u-003', 'u-006'],
  ['file.download', 'file', 'xray-0042.dcm', 'u-007'],
  ['feature.config_changed', 'feature', 'ff-002', 'u-006'],
  ['document.deleted', 'document', 'doc-1c3e', 'u-001'],
  ['user.login', 'session', null, 'u-011'],
  ['user.suspended', 'user', 'u-009', 'u-001'],
  ['file.upload', 'file', 'consent-form.pdf', 'u-002'],
  ['user.logout', 'session', null, 'u-004'],
  ['document.created', 'document', 'doc-a8d0', 'u-011'],
];

export function seed() {
  const emailOf = Object.fromEntries(people.map(p => [p[0], p[2]]));
  return {
    users: people.map(([id, name, email, role, status, dept, docs, used, quota], i) => ({
      id, email, display_name: name, role, status, avatar_url: null,
      storage_quota: { used_bytes: Math.round(used), quota_bytes: quota },
      last_login_at: status === 'pending' ? null : day(20 - (i % 10)),
      created_at: `2025-${String((i % 12) + 1).padStart(2, '0')}-15T08:00:00.000Z`,
      metadata: { department: dept, documents_count: docs },
    })),
    audit: auditRows.map(([action, type, rid, actor], i) => ({
      id: `evt-${String(i + 1).padStart(3, '0')}`, actor_id: actor, actor_email: emailOf[actor],
      action, resource_type: type, resource_id: rid,
      changes_made: action.includes('config') ? { enabled: true } : null,
      ip_address: `10.0.0.${10 + i}`, created_at: day(19 - (i % 9)).replace('09:30', `1${i % 10}:0${i % 6}`),
    })),
    features: [
      ['ff-001', 'Patient Portal', 'Self-service portal for patients to view records', true, 'Patients'],
      ['ff-002', 'E-Prescribing', 'Send prescriptions directly to pharmacies', true, 'Clinical'],
      ['ff-003', 'Telehealth Video', 'Video visits from the appointment screen', false, 'Clinical'],
      ['ff-004', 'Bulk Export', 'Export patient records as a ZIP archive', false, 'Records'],
      ['ff-005', 'Dark Mode', 'Dark theme for the clinician web app', false, 'General'],
    ].map(([id, name, description, enabled, category]) => ({
      id, name, description, enabled, metadata: { category, updated_by: 'Ethan Müller' }, updated_at: day(12),
    })),
    announcements: [
      { id: 'ann-001', title: 'Scheduled maintenance Saturday', body: 'The records system will be read-only from 02:00 to 04:00 UTC.', severity: 'maintenance', status: 'published', target_audience: { role: 'all' }, created_by: 'Ethan Müller', created_at: day(10), starts_at: day(11), ends_at: '2026-12-01T00:00:00.000Z', updated_at: day(11) },
      { id: 'ann-002', title: 'New e-prescribing workflow', body: 'E-prescribing now supports controlled substances with 2FA.', severity: 'info', status: 'draft', target_audience: { role: 'editors' }, created_by: 'Dr. Maya Okafor', created_at: day(15), updated_at: day(15) },
      { id: 'ann-003', title: 'Security notice', body: 'Rotate your password before the end of the month.', severity: 'critical', status: 'published', target_audience: { role: 'admins' }, created_by: 'Ethan Müller', created_at: day(5), starts_at: day(5), updated_at: day(5) },
    ],
    health: {
      timestamp: '2026-11-20T12:00:00.000Z',
      services: [
        { name: 'auth-service', status: 'healthy', latency_ms: 12 },
        { name: 'file-service', status: 'healthy', latency_ms: 25 },
        { name: 'document-service', status: 'degraded', latency_ms: 840, message: 'p95 latency above 500ms' },
        { name: 'collab-service', status: 'healthy', latency_ms: 18 },
        { name: 'notification-service', status: 'unhealthy', latency_ms: 0, message: 'connection refused' },
        { name: 'search-service', status: 'healthy', latency_ms: 31 },
        { name: 'analytics-service', status: 'healthy', latency_ms: 44 },
        { name: 'audit-service', status: 'healthy', latency_ms: 9 },
      ],
      database: { status: 'healthy', latency_ms: 3 },
      redis: { status: 'healthy', latency_ms: 1 },
    },
    incidents: [
      { id: 'inc-001', title: 'Search autocomplete returning 500s', description: 'KeyError in ranking enrichment on /suggest.', severity: 'high', status: 'investigating', affected_service: 'search-service', devin_session_id: 'devin-abc123', devin_session_url: 'https://app.devin.ai/sessions/devin-abc123', devin_session_status: 'running', active: true, created_at: day(19), updated_at: day(19) },
      { id: 'inc-002', title: 'Slow document loads', description: 'Document open takes 4-5 seconds for large charts.', severity: 'medium', status: 'open', affected_service: 'document-service', active: true, created_at: day(18), updated_at: day(18) },
      { id: 'inc-003', title: 'Upload failures in Radiology', description: 'NoSuchBucket errors on DICOM uploads.', severity: 'critical', status: 'resolved', affected_service: 'file-service', devin_session_id: 'devin-def456', devin_session_url: 'https://app.devin.ai/sessions/devin-def456', devin_session_status: 'finished', active: false, resolved_at: day(17), created_at: day(16), updated_at: day(17) },
      { id: 'inc-004', title: 'Notification queue backlog', description: 'Legacy timestamps rejected by the strict schema.', severity: 'low', status: 'closed', affected_service: 'notification-service', active: false, resolved_at: day(14), closed_at: day(15), created_at: day(13), updated_at: day(15) },
    ],
    chaos: {},
    autoInvestigate: false,
  };
}
