import { test, beforeAll, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let Administracao, Contexto, dom, raiz;
const fetchOriginal = globalThis.fetch;
beforeAll(async () => {
  Administracao = (await import('/src/paginas/Administracao.jsx')).default;
  Contexto = (await import('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
});

beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close();
  globalThis.fetch = fetchOriginal;
  for (const chave of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[chave];
});

for (const tela of ['termos', 'privacidade']) {
  test(`publica ${tela} sem versao manual e mostra a versao devolvida pelo backend`, async () => {
    const [anterior, proxima] = tela === 'termos' ? ['v1.8', 'v2.0'] : ['7.0', '8.0'];
    let atual = { nome: 'Documento', versao: anterior, conteudo: 'Texto vigente' };
    const enviados = [];
    globalThis.fetch = async (url, opcoes = {}) => {
      if (String(url).endsWith('/administracao/permissoes')) return Response.json({ principal: true });
      if (opcoes.method === 'POST') {
        enviados.push(JSON.parse(opcoes.body));
        atual = { ...enviados.at(-1), versao: proxima };
        return Response.json(atual, { status: 201 });
      }
      return Response.json(String(url).endsWith('/politicas/ativas') ? [atual] : atual);
    };
    await act(async () => raiz.render(createElement(MemoryRouter, null,
      createElement(Contexto.Provider, { value: { sessao: { nome: 'Principal', idUsuario: 1 } } },
        createElement(Administracao, { tela })))));
    assert.ok(document.body.textContent.includes(`Versão vigente: ${anterior}`));
    assert.equal(document.querySelectorAll('form input').length, 1);
    assert.match(document.body.textContent, /incrementada automaticamente/);
    await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => document.querySelector('[role="dialog"] .btn-danger').click());
    assert.deepEqual(enviados, [{ nome: 'Documento', conteudo: 'Texto vigente' }]);
    assert.ok(document.body.textContent.includes(`Versão vigente: ${proxima}`));
  });
}
