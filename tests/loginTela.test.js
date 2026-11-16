import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { Route } from 'react-router-dom';
import { prepararTela, clicar, preencher, enviar, simularApi } from './apoio/tela.js';

let Login;
const { renderizar } = prepararTela(async (carregar) => {
  Login = (await carregar('paginas/Login.jsx')).default;
});

async function informarCredenciais() {
  await preencher('input[type="email"]', 'ana@example.com');
  await preencher('input[type="password"]', 'SenhaIncorreta!');
  await enviar();
}

test('login pede o código de segundo fator antes de levar aos cursos', async (t) => {
  const autenticarUsuario = t.mock.fn(async () => ({ requerCodigo2fa: true }));
  const validarCodigo2fa = t.mock.fn();
  await renderizar(Login, {
    url: '/login', autenticacao: { autenticarUsuario, validarCodigo2fa },
    extra: [h(Route, { key: 'cursos', path: '/cursos', element: h('h1', null, 'Meus cursos') })],
  });

  await informarCredenciais();
  assert.deepEqual(autenticarUsuario.mock.calls[0].arguments, ['ana@example.com', 'SenhaIncorreta!']);
  assert.equal(validarCodigo2fa.mock.callCount(), 0);
  assert.equal(document.querySelector('.botao-reenvio-2fa').disabled, true);
  await preencher('input[inputmode="numeric"]', '012345');
  await enviar();

  assert.deepEqual(validarCodigo2fa.mock.calls[0].arguments, ['ana@example.com', '012345']);
  assert.equal(document.querySelector('h1').textContent, 'Meus cursos');
});

test('cancelar o segundo fator limpa as credenciais para outro login', async (t) => {
  const autenticarUsuario = async () => ({ requerCodigo2fa: true });
  const sair = t.mock.fn();
  await renderizar(Login, { autenticacao: { autenticarUsuario, sair } });
  await informarCredenciais();
  await clicar('Cancelar login e usar outra conta');

  assert.equal(sair.mock.callCount(), 1);
  assert.equal(document.querySelector('input[type="email"]').value, '');
  assert.equal(document.querySelector('input[type="password"]').value, '');
});

test('login envia as credenciais preenchidas pelo navegador sem evento de alteração', async (t) => {
  const autenticarUsuario = t.mock.fn(async () => ({ requerCodigo2fa: true }));
  const validarCodigo2fa = t.mock.fn();
  await renderizar(Login, { autenticacao: { autenticarUsuario, validarCodigo2fa } });

  await preencher('input[type="email"]', 'outra-conta@example.com');
  await preencher('input[type="password"]', 'SenhaAntiga123!');
  document.querySelector('input[type="email"]').value = 'aluno@example.com';
  document.querySelector('input[type="password"]').value = 'SenhaNova123!';
  await enviar();

  assert.deepEqual(autenticarUsuario.mock.calls[0].arguments, ['aluno@example.com', 'SenhaNova123!']);
  await preencher('input[inputmode="numeric"]', '012345');
  await enviar();
  assert.deepEqual(validarCodigo2fa.mock.calls[0].arguments, ['aluno@example.com', '012345']);
});

for (const [codigo, mensagem] of [
  ['CREDENCIAIS_INVALIDAS', /E-mail ou senha incorretos/],
  ['PENDENTE_APROVACAO', /aguardando aprovação/],
  ['ACESSO_REJEITADO', /não foi aprovado/],
]) {
  test('login orienta o usuário quando recebe ' + codigo, async () => {
    const autenticarUsuario = async () => { throw Object.assign(new Error('Falha no login'), { codigo }); };
    await renderizar(Login, { autenticacao: { autenticarUsuario } });
    await informarCredenciais();
    assert.match(document.querySelector('[role="alert"]').textContent, mensagem);
  });
}

test('conta não confirmada pode pedir novo link pelo login', async (t) => {
  const chamadas = simularApi(t, () => new Response(null, { status: 204 }));
  const autenticarUsuario = async () => { throw Object.assign(new Error('E-mail pendente'), { codigo: 'EMAIL_NAO_CONFIRMADO' }); };
  await renderizar(Login, { autenticacao: { autenticarUsuario } });
  await informarCredenciais();
  assert.match(document.querySelector('[role="alert"]').textContent, /Confirme seu e-mail/);

  await clicar('Reenviar confirmação');
  assert.equal(chamadas[0].rota, '/autenticacao/reenviar-confirmacao');
  assert.deepEqual(chamadas[0].dados, { email: 'ana@example.com' });
  assert.match(document.querySelector('[role="status"]').textContent, /novo link de confirmação/);
});
