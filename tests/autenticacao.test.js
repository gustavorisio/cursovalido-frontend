import test, { before, beforeEach, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement, StrictMode, act } from 'react';
import { createRoot } from 'react-dom/client';

let servidor;
let Provedor;
let useAutenticacao;
let sessaoModulo;
let ambiente;
let raiz;
let atual;
let chamadas;
let restaurar;

function token(email) {
  return `cabecalho.${Buffer.from(JSON.stringify({ sub: email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.assinatura`;
}

before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Provedor = (await servidor.ssrLoadModule('/src/contextos/AutenticacaoContexto.jsx')).AutenticacaoProvedor;
  useAutenticacao = (await servidor.ssrLoadModule('/src/contextos/useAutenticacao.js')).useAutenticacao;
  sessaoModulo = await servidor.ssrLoadModule('/src/servicos/sessaoNavegador.js');
});

after(async () => { await servidor?.close(); });

beforeEach(() => {
  ambiente = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000', pretendToBeVisual: true });
  const valores = {
    window: ambiente.window,
    document: ambiente.window.document,
    localStorage: ambiente.window.localStorage,
    sessionStorage: ambiente.window.sessionStorage,
    CustomEvent: ambiente.window.CustomEvent,
    addEventListener: ambiente.window.addEventListener.bind(ambiente.window),
    removeEventListener: ambiente.window.removeEventListener.bind(ambiente.window),
    dispatchEvent: ambiente.window.dispatchEvent.bind(ambiente.window),
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const descritores = new Map();
  for (const [chave, valor] of Object.entries(valores)) {
    descritores.set(chave, Object.getOwnPropertyDescriptor(globalThis, chave));
    Object.defineProperty(globalThis, chave, { configurable: true, writable: true, value: valor });
  }
  const fetchAnterior = globalThis.fetch;
  chamadas = [];
  globalThis.fetch = async (url, opcoes) => {
    const caminho = new URL(url).pathname;
    chamadas.push({ caminho, opcoes });
    const dados = opcoes.body ? JSON.parse(opcoes.body) : {};
    if (caminho.endsWith('/logout')) return new Response(null, { status: 204 });
    if (caminho.endsWith('/login')) return Response.json({ requerCodigo2fa: true });
    if (caminho.endsWith('/confirmar-2fa')) return Response.json({ token: token(dados.email), idUsuario: 1, nome: dados.email, perfil: 'ALUNO' });
    throw new Error(`Requisicao inesperada no teste: ${caminho}`);
  };
  restaurar = () => {
    globalThis.fetch = fetchAnterior;
    for (const [chave, descritor] of descritores) {
      if (descritor) Object.defineProperty(globalThis, chave, descritor);
      else delete globalThis[chave];
    }
  };
  raiz = createRoot(document.getElementById('root'));
});

afterEach(async () => {
  await act(async () => { raiz.unmount(); });
  sessaoModulo.controleSessao.encerrar();
  ambiente.window.close();
  restaurar();
});

async function montar() {
  function Exibir() {
    atual = useAutenticacao();
    return createElement('span', null, atual.sessao?.nome ?? 'Deslogado');
  }
  await act(async () => { raiz.render(createElement(StrictMode, null, createElement(Provedor, null, createElement(Exibir)))); });
}

async function entrar(email) {
  await act(async () => {
    await atual.autenticarUsuario(email, 'SenhaTeste123!');
    await atual.validarCodigo2fa(email, '123456');
  });
}

test('iniciar a aplicacao nao restaura dados antigos e revoga token legado', async () => {
  sessionStorage.setItem('token', token('antigo@example.com'));
  sessionStorage.setItem('curso-valido-sessao', JSON.stringify({ token: token('antigo@example.com'), nome: 'Antigo' }));
  await montar();
  assert.equal(atual.autenticado, false);
  assert.equal(atual.sessao, null);
  assert.equal(sessionStorage.getItem('token'), null);
  assert.ok(chamadas.some((item) => item.caminho.endsWith('/logout')));
});

test('sair limpa a conta e chama o logout autenticado do servidor', async () => {
  await montar();
  await entrar('ana@example.com');
  assert.equal(atual.autenticado, true);
  assert.equal(sessionStorage.getItem('token'), null);
  assert.equal(localStorage.getItem('token'), null);
  const anterior = atual.sessao.token;
  await act(async () => { await atual.sair(); });
  assert.equal(atual.autenticado, false);
  assert.equal(sessaoModulo.obterTokenSessao(), null);
  assert.ok(chamadas.some((item) => item.caminho.endsWith('/logout') ? item.opcoes.headers.Authorization === `Bearer ${anterior}` : false));
});

test('login em outra aba encerra a conta anterior sem apagar o controle novo', async () => {
  await montar();
  await entrar('ana@example.com');
  localStorage.setItem(sessaoModulo.CHAVE_CONTROLE_SESSAO, 'login-de-outra-aba');
  await act(async () => {
    window.dispatchEvent(new window.StorageEvent('storage', { key: sessaoModulo.CHAVE_CONTROLE_SESSAO, newValue: 'login-de-outra-aba' }));
  });
  assert.equal(atual.autenticado, false);
  assert.equal(localStorage.getItem(sessaoModulo.CHAVE_CONTROLE_SESSAO), 'login-de-outra-aba');
  assert.ok(chamadas.some((item) => item.caminho.endsWith('/logout')));
});

test('abrir o email para consultar o codigo nao cancela o segundo fator', async () => {
  await montar();
  await act(async () => { await atual.autenticarUsuario('ana@example.com', 'SenhaTeste123!'); });
  await act(async () => { document.dispatchEvent(new window.Event('visibilitychange')); });
  await act(async () => { await atual.validarCodigo2fa('ana@example.com', '123456'); });
  assert.equal(atual.autenticado, true);
});

test('um 401 atrasado da conta antiga nao encerra a conta nova', async () => {
  await montar();
  await entrar('ana@example.com');
  const anterior = atual.sessao.token;
  await entrar('bruno@example.com');
  await act(async () => {
    globalThis.dispatchEvent(new CustomEvent('curso-valido-sessao-expirada', { detail: { token: anterior } }));
  });
  assert.equal(atual.autenticado, true);
  assert.equal(atual.sessao.nome, 'bruno@example.com');
});

test('resposta atrasada do segundo fator nao restaura conta depois de sair', async () => {
  await montar();
  await act(async () => { await atual.autenticarUsuario('ana@example.com', 'SenhaTeste123!'); });
  const fetchNormal = globalThis.fetch;
  let liberar;
  const espera = new Promise((resolve) => { liberar = resolve; });
  globalThis.fetch = (url, opcoes) => url.endsWith('/confirmar-2fa') ? espera : fetchNormal(url, opcoes);
  const resultado = atual.validarCodigo2fa('ana@example.com', '123456').then(() => null, (erro) => erro);
  await act(async () => { await atual.sair(); });
  await act(async () => {
    liberar(Response.json({ token: token('ana@example.com'), idUsuario: 1, nome: 'Ana', perfil: 'ALUNO' }));
    await resultado;
  });
  assert.ok(await resultado instanceof Error);
  assert.equal(atual.autenticado, false);
  assert.equal(sessaoModulo.obterTokenSessao(), null);
  assert.ok(chamadas.some((item) => item.caminho.endsWith('/logout')));
});

test('requisicao antiga da aula nao usa a conta que acabou de entrar', async () => {
  await montar();
  await entrar('ana@example.com');
  const anterior = atual.sessao.token;
  await entrar('bruno@example.com');
  const fetchNormal = globalThis.fetch;
  let enviado;
  globalThis.fetch = (url, opcoes) => {
    if (url.endsWith('/progresso')) {
      enviado = opcoes.headers.Authorization;
      return Promise.resolve(Response.json({ mensagem: 'Sessao encerrada' }, { status: 401 }));
    }
    return fetchNormal(url, opcoes);
  };
  const servico = await servidor.ssrLoadModule('/src/componentes/aulas/servicos/servicoAluno.js');
  await act(async () => {
    await assert.rejects(servico.salvarPosicao(1, 30, { tokenAutenticacao: anterior }));
  });
  assert.equal(enviado, `Bearer ${anterior}`);
  assert.equal(atual.autenticado, true);
  assert.equal(atual.sessao.nome, 'bruno@example.com');
});

test('recarregar a interface preserva a sessao da mesma aba', async () => {
  await montar();
  await entrar('ana@example.com');
  const anterior = atual.sessao.token;
  chamadas.length = 0;
  await act(async () => { window.dispatchEvent(new window.Event('pagehide')); });
  await act(async () => { raiz.unmount(); });
  raiz = createRoot(document.getElementById('root'));
  await montar();
  assert.equal(atual.autenticado, true);
  assert.equal(atual.sessao.nome, 'ana@example.com');
  assert.equal(sessaoModulo.obterTokenSessao(), anterior);
  assert.equal(chamadas.some(item => item.caminho.endsWith('/logout')), false);
});

test('resposta de uma requisicao da conta antiga e descartada apos troca de usuario', async () => {
  await montar();
  await entrar('ana@example.com');
  const fetchNormal = globalThis.fetch;
  let liberar;
  const espera = new Promise((resolve) => { liberar = resolve; });
  globalThis.fetch = (url, opcoes) => url.endsWith('/teste-antigo') ? espera : fetchNormal(url, opcoes);
  const api = await servidor.ssrLoadModule('/src/servicos/api.js');
  const resultado = api.requisitar('/teste-antigo').then(() => null, (erro) => erro);
  await entrar('bruno@example.com');
  await act(async () => {
    liberar(Response.json({ nome: 'Dados de Ana' }));
    await resultado;
  });
  assert.equal((await resultado).codigo, 'SESSAO_ALTERADA');
  assert.equal(atual.sessao.nome, 'bruno@example.com');
  assert.equal(atual.autenticado, true);
});
