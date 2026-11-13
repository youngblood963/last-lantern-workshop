// Validate the approved DEVTEST entry and emit an exact copy for inspection.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const devtest = path.resolve(__dirname, '..');
const entry = fs.readFileSync(path.join(devtest, 'index.html'));
const manifestPath = path.join(devtest, 'consolidation', 'entry-manifest.json');
const args = process.argv.slice(2);
const mode = args[0] ?? '--generate';
assert(args.length <= 1 && ['--check', '--generate', '--print-manifest'].includes(mode),
  'Usage: node prepare.cjs [--check | --generate | --print-manifest]');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function scripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .map(([, attributes, body]) => ({
      src: attributes.match(/\bsrc="([^"]+)"/)?.[1],
      body
    }));
}

const html = entry.toString('utf8');
const base = html.match(/<base href="([^"]+)">/)?.[1];
assert.equal(base, '../playtest/', 'Unexpected DEVTEST script base');
const baseUrl = new URL(base, 'https://example.invalid/route127/devtest/index.html');
const startup = [];

function record(script, phase) {
  if (!script.src) {
    startup.push({ phase, inlineSHA256: sha256(script.body) });
    return;
  }
  const url = new URL(script.src, baseUrl);
  assert(url.origin === baseUrl.origin && /^\/route127\/(?:devtest|playtest)\//.test(url.pathname),
    'Unexpected DEVTEST script location: ' + script.src);
  startup.push({ phase, src: script.src, path: url.pathname.slice(1), query: url.search });
}

const direct = scripts(html);
assert.match(direct[0]?.src ?? '', /^\.\.\/devtest\/runtime\/environment\.js\?/,
  'DEVTEST environment must load first');
assert.match(direct[1]?.body ?? '', /devtest-startup-error/, 'Startup reporter must precede the gate');
const gate = direct[2]?.body ?? '';
assert.match(gate, /ROUTE127_ENV\?\.name!=="DEVTEST"/, 'Missing DEVTEST environment gate');
const payload = gate.match(/else\{document\.write\(("(?:\\.|[^"\\])*")\);\}/)?.[1];
assert(payload, 'Missing guarded startup payload');
direct.slice(0, 3).forEach(script => record(script, 'bootstrap'));
scripts(JSON.parse(payload)).forEach(script => record(script, 'guarded'));
direct.slice(3).forEach(script => record(script, 'overlay'));

const actual = {
  environment: 'DEVTEST',
  source: 'route127/devtest/index.html',
  sourceSHA256: sha256(entry),
  base,
  externalCount: startup.filter(script => script.src).length,
  inlineCount: startup.filter(script => !script.src).length,
  startup
};

if (mode === '--print-manifest') {
  process.stdout.write(JSON.stringify(actual, null, 2) + '\n');
} else {
  const approved = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(actual.sourceSHA256, approved.sourceSHA256,
    'DEVTEST entry drift: review the entry and manifest before generating');
  assert.deepEqual(actual, approved, 'DEVTEST startup manifest drift');
  if (mode === '--check') {
    console.log('PASS DEVTEST entry parity: ' + actual.externalCount + ' external scripts, ' +
      actual.inlineCount + ' inline blocks');
  } else {
    const output = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'route127-devtest-')), 'index.html');
    fs.writeFileSync(output, entry, { flag: 'wx' });
    console.log(output);
  }
}
