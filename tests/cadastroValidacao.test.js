import { test } from 'vitest';
import assert from 'node:assert/strict';
import { limparNomeCompleto } from '../src/paginas/validacoesCadastro.js';


test('senha segue a política de tamanho, classes obrigatórias e limite de bytes', async () => {
  const { senhaValida } = await import('../src/servicos/politicaSenha.js');
  assert.equal(senhaValida('Senha@123'), true);
  assert.equal(senhaValida('A!' + 'a'.repeat(70)), true);
  for (const senha of ['Aa!', 'aa!123456', 'AAA!12345', 'Senha@' + 'a'.repeat(70), 'A!' + 'á'.repeat(36)]) {
    assert.equal(senhaValida(senha), false, senha);
  }
});

test('nome completo preserva letras acentuadas e remove números e símbolos', () => {
  assert.equal(limparNomeCompleto('  Joa\u0303o 123 da! Silva?'), 'João da Silva');
  assert.equal(limparNomeCompleto('123#$'), '');
});
