import test from 'node:test';
import assert from 'node:assert/strict';
import { validarCpf, validarIdade } from '../src/paginas/validacoesCadastro.js';

test('CPF aceita digitos validos, com e sem mascara', () => {
  for (const cpf of ['52998224725', '529.982.247-25', '11144477735', '12345678909']) assert.equal(validarCpf(cpf), true, cpf);
});
test('CPF rejeita digitos incorretos, repeticoes e formatos invalidos', () => {
  for (const cpf of [null, '', '12345678901', '52998224724', '5299822472', '529982247250', 'abc52998224725', '529-982-247-25', ...Array.from({length:10}, (_, n) => String(n).repeat(11))]) assert.equal(validarCpf(cpf), false, String(cpf));
});
test('idade distingue o aniversario de 18 anos do dia anterior', () => {
  const hoje = new Date();
  const nascimento = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
  const formatar = d => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  assert.equal(validarIdade(formatar(nascimento)), 18);
  nascimento.setDate(nascimento.getDate() + 1);
  assert.equal(validarIdade(formatar(nascimento)), 17);
});
