import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let servidor, Inicio, Contexto, dom, raiz;
before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Inicio = (await servidor.ssrLoadModule('/src/paginas/Inicio.jsx')).default;
  Contexto = (await servidor.ssrLoadModule('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
});
after(async () => { await servidor?.close(); });
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'https://cursovalido.dev' });
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount()); dom.window.close();
  for (const chave of ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[chave];
});

test('inicio nao incorpora YouTube nem carrega o player e preserva os caminhos de navegacao', async () => {
  await act(async () => raiz.render(createElement(MemoryRouter, null,
    createElement(Contexto.Provider, { value: { autenticado: false } }, createElement(Inicio)))));
  assert.equal(document.querySelector('iframe, video, script[src*="youtube"], script[src*="ytimg"]'), null);
  assert.equal(window.YT, undefined);
  assert.equal(window.onYouTubeIframeAPIReady, undefined);
  assert.equal(document.querySelectorAll('.cv-study-steps a').length, 3);
  assert.deepEqual([...document.querySelectorAll('.cv-study-steps a')].map(a => a.getAttribute('href')), ['/roadmap', '/cursos', '/forum']);
});