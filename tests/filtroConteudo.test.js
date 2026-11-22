import { test } from 'vitest';
import assert from 'node:assert/strict';
import { censurarConteudo } from '../src/servicos/filtroConteudo';

for (const termo of ['lixo', 'fodace', 'foda-se', 'pau no cu', 'idiota', 'otario', 'OTÁRIO', 'p0rr4', 'p o r r a', 'v-i-a-d-o']) {
  test(`oculta ${termo} preservando o restante`, () => {
    assert.equal(censurarConteudo(`Olá, ${termo}. Tudo bem?`), 'Olá, ***. Tudo bem?');
  });
}

test('preserva palavras comuns, acentos, pontuação e máscaras anteriores', () => {
  const texto = 'Curso de estruturas: cumbuca, computador e espetáculo! ***';
  assert.equal(censurarConteudo(texto), texto);
  assert.equal(censurarConteudo(null), null);
});
