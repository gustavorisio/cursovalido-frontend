import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { JSDOM } from 'jsdom';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let servidor, Dashboard, LayoutDashboard, servico, dom, raiz, chamadas;
const fetchOriginal = globalThis.fetch;
const resumo = { alunosAtivos: 12, professoresAtivos: 2, cursosAtivos: 3, aulasAtivas: 8, matriculas: 15, topicosAtivos: 0, noticiasAtivas: 0 };

before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Dashboard = (await servidor.ssrLoadModule('/src/componentes/administracao/DashboardAdministrativo.jsx')).default;
  LayoutDashboard = (await servidor.ssrLoadModule('/src/paginas/Dashboard.jsx')).default;
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
    return new Response(JSON.stringify(url.endsWith('/resumo') ? resumo : url.includes('/atividade-diaria?') ? { data: new URL(url).searchParams.get('data'), matriculas: 3, cursosCriados: 0, aulasCriadas: 0, topicosCriados: 0, noticiasPublicadas: 0 } : []), { status: 200 });
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

test('dashboard exibe conteúdo sem menu lateral nem botão de menu', async () => {
  await act(async () => raiz.render(createElement(MemoryRouter, null, createElement(LayoutDashboard))));
  assert.equal(document.querySelector('.app-sidebar'), null);
  assert.equal(document.querySelector('button[aria-controls="menu-dashboard"]'), null);
  assert.ok(document.querySelector('main#conteudo-dashboard'));
  assert.equal(document.querySelectorAll('.small-box').length, 12);
});

test('painel consulta cinco endpoints e restringe a troca de período à série mensal', async () => {
  await act(async () => { raiz.render(createElement(Dashboard)); });
  assert.equal(chamadas.length, 5);
  assert.equal(document.querySelectorAll('.small-box').length, 12);
  assert.equal(document.querySelectorAll('.dashboard-grafico').length, 3);
  assert.match(document.querySelector('.dashboard-secao-titulo + .dashboard-indicadores').textContent, /12/);
  assert.match(document.body.textContent, /Nenhum registro/);
  const periodo = document.querySelector('select');
  await act(async () => {
    periodo.value = '6';
    periodo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  assert.equal(chamadas.length, 6);
  assert.ok(chamadas[5].endsWith('/matriculas-por-mes?meses=6'));
});

test('falha em uma seção preserva as demais e permite tentar novamente', async () => {
  const fetchSucesso = globalThis.fetch;
  globalThis.fetch = (url) => url.endsWith('/resumo') ? Promise.resolve(new Response('{}', { status: 500 })) : fetchSucesso(url);
  await act(async () => { raiz.render(createElement(Dashboard)); });
  assert.match(document.querySelector('[role="alert"]').textContent, /serviço está indisponível/);
  assert.equal(document.querySelectorAll('.dashboard-grafico').length, 3);
  globalThis.fetch = fetchSucesso;
  await act(async () => { document.querySelector('[role="alert"] button').click(); });
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.equal(document.querySelectorAll('.small-box').length, 12);
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

test('consulta atividade de uma data sem alterar os totais e os gráficos', async () => {
  await act(async () => raiz.render(createElement(Dashboard)));
  assert.doesNotMatch(document.body.textContent, /Média de idade/);
  const campo = document.querySelector('#dashboard-data');
  await act(async () => {
    campo.value = '2026-01-15';
    document.querySelector('.dashboard-filtro-data').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  });
  assert.equal(chamadas.length, 6);
  assert.ok(chamadas.at(-1).endsWith('/atividade-diaria?data=2026-01-15'));
  assert.match(document.querySelector('.dashboard-dia').textContent, /15\/01\/2026/);
  assert.match(document.querySelector('.dashboard-dia').textContent, /Matrículas realizadas3/);
});
