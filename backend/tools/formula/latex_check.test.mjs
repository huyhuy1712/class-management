import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBatch } from './latex_check.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('renders fractions, roots, vectors and systems with the exam builder renderer', async () => {
  const formulas = [
    String.raw`\frac{x^2+1}{2}`,
    String.raw`\sqrt{x^2}`,
    String.raw`\overrightarrow{AB}`,
    String.raw`\begin{cases}x+y=1\\x-y=2\end{cases}`,
  ];
  const results = await checkBatch(formulas.map((latex, index) => ({ id: String(index), latex })));
  assert.ok(results.every(result => result.syntax === 'VALID' && result.render === 'VALID'));
});

test('rejects malformed LaTeX and unsafe commands without treating rendering as source verification', async () => {
  const formulas = [
    String.raw`\frac{1}{`, String.raw`\input{secret}`, '', String.raw`\unknowncommand{x}`,
    String.raw`\frac{1}`, String.raw`\sqrt`, 'x^',
  ];
  const results = await checkBatch(formulas.map((latex, index) => ({ id: String(index), latex })));
  assert.ok(results.every(result => result.syntax === 'INVALID' && result.render === 'NOT_RUN'));
});

test('bounds formula count and length', async () => {
  await assert.rejects(() => checkBatch(Array.from({ length: 1001 }, () => ({ id: '0', latex: 'x' }))));
  const [result] = await checkBatch([{ id: '0', latex: 'x'.repeat(4097) }]);
  assert.equal(result.syntax, 'INVALID');
});

test('library diagnostics cannot corrupt the JSON batch or expose formula text in logs', () => {
  const formulas = [String.raw`{}^{a}`, String.raw`^{y}`, String.raw`\overline{{v_n}}`];
  const response = spawnSync(process.execPath, [fileURLToPath(new URL('latex_check.mjs', import.meta.url))], {
    input: JSON.stringify({ formulas: formulas.map((latex, index) => ({ id: String(index), latex })) }),
    encoding: 'utf8',
    timeout: 5000,
  });
  assert.equal(response.status, 0);
  assert.equal(response.stderr, '');
  assert.equal(JSON.parse(response.stdout).results.length, formulas.length);
});
