import { beforeAll, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import { act, createElement as h } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JSDOM } from 'jsdom';

export function prepararTela(configurar) {
  let Contexto, createRoot, dom, raiz;
  const descritores = new Map();
  const modulos = import.meta.glob('/src/**/*.{js,jsx}');
  const carregar = (arquivo) => modulos['/src/' + arquivo]();

  beforeAll(async () => {
    const inicial = new JSDOM();
    globalThis.window = inicial.window;
    globalThis.document = inicial.window.document;
    try {
      ({ createRoot } = await import('react-dom/client'));
    } finally {
      inicial.window.close();
      delete globalThis.window;
      delete globalThis.document;
    }
    Contexto = (await carregar('contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
    await configurar?.(carregar);
  });

  beforeEach(() => {
    dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
    const globais = {
      window: dom.window,
      document: dom.window.document,
      sessionStorage: dom.window.sessionStorage,
      localStorage: dom.window.localStorage,
      addEventListener: dom.window.addEventListener.bind(dom.window),
      removeEventListener: dom.window.removeEventListener.bind(dom.window),
      dispatchEvent: dom.window.dispatchEvent.bind(dom.window),
      CustomEvent: dom.window.CustomEvent,
      IS_REACT_ACT_ENVIRONMENT: true,
    };
    for (const [nome, valor] of Object.entries(globais)) {
      descritores.set(nome, Object.getOwnPropertyDescriptor(globalThis, nome));
      Object.defineProperty(globalThis, nome, { configurable: true, writable: true, value: valor });
    }
    raiz = createRoot(document.getElementById('root'));
  });

  afterEach(async () => {
    await act(async () => raiz.unmount());
    dom.window.close();
    for (const [nome, descritor] of descritores) {
      if (descritor) Object.defineProperty(globalThis, nome, descritor);
      else delete globalThis[nome];
    }
    descritores.clear();
  });


  async function renderizar(Pagina, { url = '/', rota = url.split('?')[0], sessao = null, autenticacao = {}, props = {}, extra = [], navegador = false } = {}) {
    if (navegador) {
      window.history.replaceState(null, '', url);
      await act(async () => raiz.render(h(Pagina, props)));
      return;
    }
    await act(async () => raiz.render(h(Contexto.Provider, { value: { autenticado: Boolean(sessao), sessao, ...autenticacao } },
      h(MemoryRouter, { key: url, initialEntries: [url] },
        h(Routes, null, h(Route, { path: rota, element: h(Pagina, props) }), ...extra)))));
  }

  return { renderizar };
}

export function botao(texto, area = document) {
  return [...area.querySelectorAll('button')].find((item) => item.textContent.trim() === texto);
}

export async function clicar(texto, area) {
  const item = botao(texto, area);
  assert.ok(item, 'Botão esperado: ' + texto);
  await act(async () => item.click());
}

export async function preencher(seletor, valor) {
  const campo = document.querySelector(seletor);
  assert.ok(campo, 'Campo esperado: ' + seletor);
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(campo), 'value').set;
  await act(async () => {
    setter.call(campo, valor);
    campo.dispatchEvent(new window.Event(campo.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

export async function enviar(seletor = 'form') {
  await act(async () => document.querySelector(seletor).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
}

export function simularApi(responder) {
  const chamadas = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (endereco, opcoes) => {
    const url = new URL(endereco);
    const chamada = {
      rota: url.pathname.replace(/^\/api/, ''),
      busca: url.searchParams,
      metodo: opcoes.method ?? 'GET',
      dados: opcoes.body ? JSON.parse(opcoes.body) : null,
    };
    chamadas.push(chamada);
    return responder(chamada);
  });
  return chamadas;
}
