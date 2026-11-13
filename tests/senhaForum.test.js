import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement as h, act } from 'react';
let createRoot;

let servidor, CampoSenha, AlterarSenha, raiz, dom;
const fetchOriginal = globalThis.fetch;
before(async () => {
  const inicial = new JSDOM('<div></div>');
  globalThis.window = inicial.window; globalThis.document = inicial.window.document;
  ({ createRoot } = await import('react-dom/client'));
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  CampoSenha = (await servidor.ssrLoadModule('/src/componentes/autenticacao/CampoSenha.jsx')).default;
  AlterarSenha = (await servidor.ssrLoadModule('/src/componentes/autenticacao/FormularioAlterarSenha.jsx')).default;
  inicial.window.close();
});
after(async () => servidor.close());
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close(); globalThis.fetch = fetchOriginal;
  for (const key of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[key];
});

test('olho alterna visibilidade sem enviar formulário nem alterar senha', async () => {
  let envios = 0;
  await act(() => raiz.render(h('form', { onSubmit: () => envios++ }, h(CampoSenha, { value: 'Segredo123!', onChange() {} }))));
  const campo = document.querySelector('input');
  const olho = document.querySelector('button');
  assert.equal(campo.type, 'password');
  await act(() => olho.click());
  assert.equal(campo.type, 'text');
  assert.equal(olho.getAttribute('aria-label'), 'Ocultar senha');
  assert.equal(campo.value, 'Segredo123!');
  await act(() => olho.click());
  assert.equal(campo.type, 'password');
  assert.equal(envios, 0);
});

test('alteração autenticada envia senha atual e só conclui após sucesso', async () => {
  const enviados = []; let conclusoes = 0;
  globalThis.fetch = async (url, options) => { enviados.push({ url, corpo: JSON.parse(options.body) }); return new Response(null, { status: 204 }); };
  await act(() => raiz.render(h(AlterarSenha, { aoConcluir: () => conclusoes++ })));
  const valores = ['SenhaAtual123!', 'NovaSenha123!', 'NovaSenha123!'];
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  for (const [i, input] of [...document.querySelectorAll('input')].entries()) {
    await act(() => { setter.call(input, valores[i]); input.dispatchEvent(new window.Event('input', { bubbles: true })); });
  }
  await act(() => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.equal(enviados.length, 1);
  assert.match(enviados[0].url, /alterar-senha-autenticado$/);
  assert.deepEqual(enviados[0].corpo, { senhaAtual: valores[0], novaSenha: valores[1], confirmacaoSenha: valores[2] });
  assert.equal(conclusoes, 1);
  assert.equal(document.querySelector('input').value, '');
});
