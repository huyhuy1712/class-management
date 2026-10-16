import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const MAX_INPUT_BYTES = 4 * 1024 * 1024;
const MAX_FORMULAS = 1000;
const MAX_LATEX_LENGTH = 4096;
const UNSAFE_COMMAND = /\\(?:input|include|includegraphics|write|openout|read|usepackage|require|href|url|html\w*|def|gdef|newcommand|renewcommand|csname)\b/i;

function balancedGroups(latex) {
  let depth = 0;
  for (let index = 0; index < latex.length; index++) {
    if (latex[index] === '\\') {
      // Escaped braces are delimiters, not groups. Skip only the escaped character.
      if ('{}%\\'.includes(latex[index + 1] ?? '')) index++;
      continue;
    }
    if (latex[index] === '{') depth++;
    if (latex[index] === '}' && --depth < 0) return false;
    if (latex[index] === '%') return false;
    if (depth > 64) return false;
  }
  return depth === 0;
}

async function loadMathLive() {
  try {
    return await import('mathlive/ssr');
  } catch {
    // Development can reuse the exact renderer already installed for the exam builder.
    return import(new URL('../../../frontend/node_modules/mathlive/mathlive-ssr.min.mjs', import.meta.url));
  }
}

function withoutLibraryLogging(operation) {
  const names = ['log', 'info', 'debug', 'warn', 'error'];
  const original = names.map(name => console[name]);
  let logged = false;
  names.forEach(name => { console[name] = () => { logged = true; }; });
  try {
    return { value: operation(), logged };
  } finally {
    names.forEach((name, index) => { console[name] = original[index]; });
  }
}

export async function checkBatch(items) {
  if (!Array.isArray(items) || items.length > MAX_FORMULAS) {
    throw new Error('INVALID_FORMULA_BATCH');
  }

  const { validateLatex, convertLatexToMarkup, convertLatexToMathMl } = await loadMathLive();
  return items.map(({ id, latex }) => {
    const result = { id, syntax: 'INVALID', render: 'NOT_RUN', errors: [] };

    if (typeof latex !== 'string' || !latex.trim() || latex.length > MAX_LATEX_LENGTH) {
      result.errors.push('EMPTY_OR_TOO_LONG');
      return result;
    }
    if (UNSAFE_COMMAND.test(latex) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(latex)) {
      result.errors.push('UNSUPPORTED_COMMAND');
      return result;
    }
    // MathLive deliberately recovers some unfinished editor input. Imported content must be complete.
    if (!balancedGroups(latex)) {
      result.errors.push('INCOMPLETE_GROUP_OR_COMMENT');
      return result;
    }

    try {
      const syntax = withoutLibraryLogging(() => validateLatex(latex));
      result.errors = syntax.value.map(error => error.code ?? 'INVALID_LATEX');
      if (syntax.logged) result.errors.push('PARSER_REVIEW_REQUIRED');
      if (result.errors.length) return result;

      const conversion = withoutLibraryLogging(() => convertLatexToMathMl(latex));
      if (conversion.logged) {
        result.errors.push('MATH_STRUCTURE_REVIEW_REQUIRED');
        return result;
      }
      const mathml = conversion.value;
      const incompleteMath = /\?<\/|<(msqrt|mroot|mfrac)>\s*<\/\1>|<mrow>\s*<\/mrow>/.test(mathml);
      const missingScript = /(?<!\\)[_^]\s*(?:$|\{\s*\})/.test(latex);
      if (incompleteMath || missingScript) {
        result.errors.push('INCOMPLETE_MATH_ARGUMENT');
        return result;
      }

      result.syntax = 'VALID';
      const rendered = withoutLibraryLogging(() => convertLatexToMarkup(latex));
      const markup = rendered.value;
      result.render = !rendered.logged && typeof markup === 'string' && markup.length > 0 && markup.length <= 256_000
        ? 'VALID'
        : 'FAILED';
    } catch {
      result.render = result.syntax === 'VALID' ? 'FAILED' : 'NOT_RUN';
      result.errors.push('LATEX_CHECK_FAILED');
    }
    return result;
  });
}

async function main() {
  let size = 0;
  const chunks = [];
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > MAX_INPUT_BYTES) throw new Error('INPUT_LIMIT');
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const results = await checkBatch(input.formulas);
  process.stdout.write(JSON.stringify({ version: 'mathlive-0.111.0', results }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    process.stderr.write('LOCAL_LATEX_CHECK_UNAVAILABLE\n');
    process.exitCode = 1;
  });
}
