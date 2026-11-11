import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { JSDOM } from 'jsdom';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

let servidor, Dashboard, servico, dom, raiz, chamadas;
const fetchOriginal = globalThis.fetch;
const resumo = { alunosAtivos: 12, professoresAtivos: 2, cursosAtivos: 3, aulasAtivas: 8, matriculas: 15, topicosAtivos: 0, noticiasAtivas: 0 };

before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Dashboard = (await servidor.ssrLoadModule('/src/componentes/administracao/DashboardAdministrativo.jsx')).default;
  servico = await servidor.ssrLoadModule('/src/servicos/servicoDashboard.js');
});
after(async () => { await servidor?.close(); });
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  chamadas = [];
  globalThis.fetch = async (url) => {
    chamadas.push(url);
    return new Response(JSON.stringify(url.endsWith('/resumo') ? resumo : []), { status: 200 });
  };
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close();
  globalThis.fetch = fetchOriginal;
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

test('painel consulta quatro endpoints e restringe a troca de período à série mensal', async () => {
  await act(async () => { raiz.render(createElement(Dashboard)); });
  assert.equal(chamadas.length, 4);
  assert.equal(document.querySelectorAll('.small-box').length, 7);
  assert.equal(document.querySelectorAll('.dashboard-grafico').length, 3);
  assert.match(document.querySelector('.small-box').textContent, /12/);
  assert.match(document.body.textContent, /Nenhum registro/);
  const periodo = document.querySelector('select');
  await act(async () => {
    periodo.value = '6';
    periodo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  assert.equal(chamadas.length, 5);
  assert.ok(chamadas[4].endsWith('/matriculas-por-mes?meses=6'));
});

test('falha em uma seção preserva as demais e permite tentar novamente', async () => {
  const fetchSucesso = globalThis.fetch;
  globalThis.fetch = (url) => url.endsWith('/resumo') ? Promise.resolve(new Response('{}', { status: 500 })) : fetchSucesso(url);
  await act(async () => { raiz.render(createElement(Dashboard)); });
  assert.match(document.querySelector('[role="alert"]').textContent, /servidor está indisponível/);
  assert.equal(document.querySelectorAll('.dashboard-grafico').length, 3);
  globalThis.fetch = fetchSucesso;
  await act(async () => { document.querySelector('[role="alert"] button').click(); });
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.equal(document.querySelectorAll('.small-box').length, 7);
});

test('períodos inválidos são rejeitados sem chamar a API', () => {
  for (const valor of [0, 25, 1.5, '12', NaN]) assert.throws(() => servico.buscarMatriculasPorMes(valor), RangeError);
  assert.equal(chamadas.length, 0);
});

test('resposta atrasada do período anterior não substitui a consulta atual', async () => {
  const fetchSucesso = globalThis.fetch;
  let liberar;
  globalThis.fetch = (url) => url.endsWith('?meses=12')
    ? new Promise((resolve) => { liberar = resolve; })
    : fetchSucesso(url);
  await act(async () => { raiz.render(createElement(Dashboard)); });
  const periodo = document.querySelector('select');
  await act(async () => {
    periodo.value = '3';
    periodo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  await act(async () => { liberar(new Response('{}', { status: 500 })); });
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.equal(periodo.value, '3');
  assert.match(document.querySelector('.dashboard-grafico').textContent, /Nenhum registro/);
});
