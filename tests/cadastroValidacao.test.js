import test from 'node:test';
import assert from 'node:assert/strict';
import { validarIdade } from '../src/paginas/validacoesCadastro.js';

test('idade distingue o aniversario de 18 anos do dia anterior', () => {
  const hoje = new Date();
  const nascimento = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
  const formatar = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  assert.equal(validarIdade(formatar(nascimento)), 18);
  nascimento.setDate(nascimento.getDate() + 1);
  assert.equal(validarIdade(formatar(nascimento)), 17);
});
