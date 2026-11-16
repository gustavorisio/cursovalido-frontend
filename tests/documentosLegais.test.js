import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { Route } from 'react-router-dom';
import { prepararTela, clicar, simularApi } from './apoio/tela.js';

let Privacidade, Termos, Cadastro;
const { renderizar } = prepararTela(async (carregar) => {
  Cadastro = (await carregar('paginas/Cadastro.jsx')).default;
  Privacidade = (await carregar('paginas/PoliticaDePrivacidade.jsx')).default;
  Termos = (await carregar('paginas/TermosDeUso.jsx')).default;
});

test('política de privacidade permite recuperar uma consulta que falhou', async () => {
  let tentativa = 0;
  const chamadas = simularApi(() => ++tentativa === 1
    ? Response.json({}, { status: 503 })
    : Response.json({ versao: '2.0', conteudo: 'Dados usados para manter sua conta.' }));
  await renderizar(Privacidade, {
    url: '/privacidade',
    sessao: { perfil: 'ALUNO' },
    extra: [h(Route, { key: 'cursos', path: '/cursos', element: h('h1', null, 'Meus cursos') })],
  });

  assert.match(document.querySelector('[role="alert"]').textContent, /Não foi possível carregar/);
  await clicar('Buscar novamente');
  assert.equal(chamadas.length, 2);
  assert.equal(chamadas[1].rota, '/politicas/privacidade/ativa');
  assert.match(document.querySelector('.documento-conteudo').textContent, /Dados usados/);
  assert.equal(document.querySelector('[role="alert"]'), null);

  await clicar('Voltar');
  assert.equal(document.querySelector('h1').textContent, 'Meus cursos');
});

test('decisão sobre termos atualizados encerra a sessão e retorna ao login', async () => {
  simularApi(() => Response.json([{ versao: '2.0', conteudo: 'Termos atualizados.' }]));
  const encerrarPorDecisaoTermos = vi.fn();
  await renderizar(Termos, {
    url: '/termos-aceite?atualizacao=true', sessao: { token: 'token-atual' },
    autenticacao: { encerrarPorDecisaoTermos },
    extra: [h(Route, { key: 'login', path: '/login', element: h('h1', null, 'Login') })],
  });

  await clicar('Entrar novamente');
  assert.deepEqual(encerrarPorDecisaoTermos.mock.calls[0], ['token-atual', true]);
  assert.equal(document.querySelector('h1').textContent, 'Login');
});

test('cadastro permite carregar os termos novamente após falha', async () => {
  let primeira = true;
  const chamadas = simularApi(() => {
    if (!primeira) return Response.json([{ versao: '2.0', conteudo: 'Termos do cadastro.' }]);
    primeira = false;
    return Response.json({}, { status: 503 });
  });
  await renderizar(Cadastro);
  assert.match(document.querySelector('[role="alert"]').textContent, /Não foi possível carregar os Termos/);

  await clicar('Buscar novamente');
  assert.equal(chamadas.length, 2);
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.match(document.querySelector('h1').textContent, /Cadastro de aluno/);
});
