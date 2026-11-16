import { test } from 'vitest';
import assert from 'node:assert/strict';
import { limparNomeCompleto, validarIdade } from '../src/paginas/validacoesCadastro.js';

test('idade distingue o aniversario de 18 anos do dia anterior', () => {
  const hoje = new Date();
  const nascimento = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
  const formatar = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  assert.equal(validarIdade(formatar(nascimento)), 18);
  nascimento.setDate(nascimento.getDate() + 1);
  assert.equal(validarIdade(formatar(nascimento)), 17);
});


test('senha aceita três caracteres com as classes obrigatórias e limita bytes', async () => {
  const {senhaValida} = await import('../src/servicos/politicaSenha.js');
  assert.equal(senhaValida('Aa!'), true);
  assert.equal(senhaValida('A!' + 'a'.repeat(70)), true);
  for(const senha of ['A!', 'aa!', 'AAA!', 'Aa', 'Aa!'+ 'a'.repeat(70), 'A!' + 'á'.repeat(36)]) {
    assert.equal(senhaValida(senha), false, senha);
  }
});

test('nome completo preserva letras acentuadas e remove números e símbolos', () => {
  assert.equal(limparNomeCompleto('  Joa\u0303o 123 da! Silva?'), 'João da Silva');
  assert.equal(limparNomeCompleto('123#$'), '');
});
