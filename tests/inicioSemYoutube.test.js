import { test, beforeAll, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let Inicio, Contexto, dom, raiz;
beforeAll(async () => {
  Inicio = (await import('/src/paginas/Inicio.jsx')).default;
  Contexto = (await import('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
});

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
  assert.equal(document.querySelector('.cv-study-map'), null);
  assert.match(document.querySelector('h1').textContent, /Aprenda tecnologia com um percurso claro/);
});
