import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { correspondeAoNome } from '../src/componentes/aulas/servicos/pesquisaConteudo.js';

let servidor, Modal, Documento, dom, raiz;
before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Modal = (await servidor.ssrLoadModule('/src/componentes/forum/componentes/ConfirmacaoModal.jsx')).default;
  Documento = (await servidor.ssrLoadModule('/src/componentes/comuns/DocumentoLegal.jsx')).default;
});
after(async () => { await servidor?.close(); });
beforeEach(() => {
  dom = new JSDOM('<button id="origem">Abrir</button><div id="root"></div>', { url: 'http://localhost:3000', pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => { await act(() => raiz.unmount()); dom.window.close(); delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

test('pesquisa por nome ignora acentos, caixa e espaços nas extremidades', () => {
  assert.equal(correspondeAoNome('Introdução à Programação', '  PROGRAMACAO '), true);
  assert.equal(correspondeAoNome('Java', 'Python'), false);
  assert.equal(correspondeAoNome('Java', ''), true);
});

test('modal mantém foco, cancela com Escape e bloqueia ações durante envio', async () => {
  let cancelamentos = 0, confirmacoes = 0;
  const origem = document.getElementById('origem'); origem.focus();
  const props = { titulo: 'Excluir conta', mensagem: 'Ação permanente', onCancelar: () => cancelamentos++, onConfirmar: () => confirmacoes++ };
  await act(() => raiz.render(createElement(Modal, props)));
  const botoes = document.querySelectorAll('[role="dialog"] button');
  assert.equal(document.activeElement, botoes[0]);
  await act(() => botoes[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })));
  assert.equal(document.activeElement, botoes[1]);
  await act(() => botoes[1].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  assert.equal(cancelamentos, 1);
  await act(() => raiz.render(createElement(Modal, { ...props, processando: true })));
  await act(() => { document.querySelector('[role="presentation"]').click(); botoes[1].click(); });
  assert.equal(cancelamentos, 1); assert.equal(confirmacoes, 0);
  assert.equal(botoes[0].disabled, true); assert.equal(botoes[1].disabled, true);
  await act(() => raiz.render(null));
  assert.equal(document.activeElement, origem);
});

test('documentos usam mesma navegação e estrutura com conteúdo próprio', async () => {
  const estruturas = [];
  for (const tipo of ['termos', 'privacidade']) {
    await act(() => raiz.render(createElement(MemoryRouter, null, createElement(Documento, { tipo, versao: '1.0', dataPublicacao: '', onVoltar() {}, onRecarregar() {} }))));
    const nav = document.querySelector('nav');
    assert.equal(nav.querySelector('button').textContent, '← Voltar');
    assert.equal(nav.querySelector('a').className, 'btn btn-secondary');
    assert.ok(document.querySelector('iframe').src.endsWith(tipo === 'termos' ? '/termos-aceite.html' : '/politica-privacidade.html'));
    estruturas.push([...document.querySelector('main').children].map((el) => el.tagName));
  }
  assert.deepEqual(estruturas[0], estruturas[1]);
});
