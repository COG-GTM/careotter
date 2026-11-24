// Builds report/side-by-side/*.png (baseline left, upgraded right), pixel-diff %
// and report/README.md from report/screenshots/{baseline,upgraded} + results.json.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const root = fileURLToPath(new URL('../report', import.meta.url));
const shots = join(root, 'screenshots');
const outDir = join(root, 'side-by-side');
mkdirSync(outDir, { recursive: true });

const load = (p) => PNG.sync.read(readFileSync(p));
const pad = (img, w, h) => {
  const out = new PNG({ width: w, height: h });
  out.data.fill(255);
  PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
  return out;
};

const names = existsSync(join(shots, 'baseline'))
  ? readdirSync(join(shots, 'baseline')).filter((f) => f.endsWith('.png')).sort()
  : [];
const diffs = [];
for (const file of names) {
  const upPath = join(shots, 'upgraded', file);
  if (!existsSync(upPath)) { diffs.push([file, null]); continue; }
  const a = load(join(shots, 'baseline', file));
  const b = load(upPath);
  const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
  const pa = pad(a, w, h), pb = pad(b, w, h);
  const changed = pixelmatch(pa.data, pb.data, null, w, h, { threshold: 0.1 });
  const gap = 16;
  const sbs = new PNG({ width: w * 2 + gap, height: h });
  sbs.data.fill(200);
  PNG.bitblt(pa, sbs, 0, 0, w, h, 0, 0);
  PNG.bitblt(pb, sbs, 0, 0, w, h, w + gap, 0);
  writeFileSync(join(outDir, file), PNG.sync.write(sbs));
  diffs.push([file, (changed / (w * h)) * 100]);
}

const results = {};
const resultsPath = join(root, 'results.json');
if (existsSync(resultsPath)) {
  const walk = (suite, prefix) => {
    for (const s of suite.suites || []) walk(s, s.file ? s.file.replace(/\.spec\.ts$/, '') : `${prefix} › ${s.title}`);
    for (const spec of suite.specs || []) {
      for (const t of spec.tests) {
        const key = `${prefix} › ${spec.title}`;
        results[key] ??= {};
        const last = t.results[t.results.length - 1];
        results[key][t.projectName] = last ? last.status : 'skipped';
      }
    }
  };
  walk(JSON.parse(readFileSync(resultsPath, 'utf8')), '');
}

const icon = (s) => (s === 'passed' ? 'pass' : s ? `**${s}**` : 'not run');
const count = (p) => Object.values(results).filter((r) => r[p] === 'passed').length;
const total = Object.keys(results).length;
let md = '# Parity report\n\n';
md += `Baseline (Angular 17, :4000) vs upgraded (:4200). Same specs, separate mock gateways.\n\n`;
md += `| Page / flow | Baseline | Upgraded |\n|---|---|---|\n`;
for (const [k, r] of Object.entries(results)) md += `| ${k} | ${icon(r.baseline)} | ${icon(r.upgraded)} |\n`;
md += `| **Total** | **${count('baseline')}/${total}** | **${count('upgraded')}/${total}** |\n\n`;
md += `## Screenshots (baseline left, upgraded right)\n\n| Page | Pixel diff | Side by side |\n|---|---|---|\n`;
for (const [f, d] of diffs) md += `| ${f.replace('.png', '')} | ${d === null ? 'missing upgraded' : d.toFixed(2) + '%'} | ${d === null ? '' : `[view](side-by-side/${f})`} |\n`;
writeFileSync(join(root, 'README.md'), md);
console.log(md);
