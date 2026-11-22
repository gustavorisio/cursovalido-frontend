import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const pastaPoliticas = new URL('../scripts/cobertura/', import.meta.url);
const limites = readdirSync(pastaPoliticas).filter(nome => nome.endsWith('.json'))
  .flatMap(nome => JSON.parse(readFileSync(new URL(nome, pastaPoliticas), 'utf8')));

function verificar(percentual) {
  const pasta = mkdtempSync(join(tmpdir(), 'cursovalido-cobertura-'));
  const arquivo = join(pasta, 'cobertura.json');
  try {
    const cobertura = Object.fromEntries(limites.map(([nome, , maximo]) => {
      const cobertas = maximo > 58 ? 100 : percentual;
      return [resolve(nome), {
        statementMap: Object.fromEntries(Array.from({ length: 100 }, (_, id) => [id, { start: { line: id + 1 } }])),
        s: Object.fromEntries(Array.from({ length: 100 }, (_, id) => [id, id < cobertas ? 1 : 0])),
      }];
    }));
    writeFileSync(arquivo, JSON.stringify(cobertura));
    return spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/verificar-cobertura.mjs', import.meta.url)), arquivo], { encoding: 'utf8' });
  } finally {
    unlinkSync(arquivo);
    rmdirSync(pasta);
  }
}

test('cobertura aceita as fronteiras de 50% e 58% e as exceções pequenas', () => {
  assert.equal(verificar(50).status, 0);
  assert.equal(verificar(58).status, 0);
});

test('cobertura abaixo de 50% falha mesmo com outros arquivos completos', () => {
  const resultado = verificar(49);
  assert.equal(resultado.status, 1);
  assert.match(resultado.stderr, /49\.00%.*50% e 58%/);
});

test('cobertura acima de 58% falha fora das exceções autorizadas', () => {
  const resultado = verificar(59);
  assert.equal(resultado.status, 1);
  assert.match(resultado.stderr, /59\.00%.*50% e 58%/);
});
