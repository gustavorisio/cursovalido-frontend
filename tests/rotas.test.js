import { test } from 'vitest';
import assert from 'node:assert/strict';
import { act } from 'react';
import { prepararTela, clicar, simularApi } from './apoio/tela.js';

let App;
const { renderizar } = prepararTela(async (carregar) => {
  App = (await carregar('App.jsx')).default;
});

test('rota pública exibe suporte e atualiza o título da aba', async () => {
  await renderizar(App, { navegador: true, url: '/suporte' });
  assert.equal(document.title, 'Curso Valido - Suporte');
  assert.equal(document.querySelector('h1').textContent, 'Suporte');
});

test('visitante que acessa configurações é redirecionado para o login', async () => {
  await renderizar(App, { navegador: true, url: '/configuracoes' });
  assert.equal(window.location.pathname, '/login');
  assert.equal(document.title, 'Curso Valido - Login');
});

test('evento de atualização dos termos abre a rota de aceite', async () => {
  const chamadas = simularApi(() => Response.json([{ versao: '1.2', conteudo: 'Termos atualizados.' }]));
  await renderizar(App, { navegador: true, url: '/suporte' });
  await act(async () => window.dispatchEvent(new window.Event('curso-valido-termos-atualizados')));

  assert.equal(window.location.pathname + window.location.search, '/termos-aceite?atualizacao=true');
  assert.equal(document.title, 'Curso Valido - Aceite dos termos');
  assert.equal(chamadas[0].rota, '/politicas/ativas');
  assert.match(document.querySelector('.documento-conteudo').textContent, /Termos atualizados/);
  await clicar('Voltar');
  assert.equal(window.location.pathname, '/');
});
