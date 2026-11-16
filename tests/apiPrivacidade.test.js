import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

let servidor, api, sessao, dom;
const fetchOriginal = globalThis.fetch;
before(async () => {
  servidor = await createServer({ configFile: false, server: { middlewareMode: true }, logLevel: 'silent' });
  api = await servidor.ssrLoadModule('/src/servicos/api.js');
  sessao = await servidor.ssrLoadModule('/src/servicos/sessaoNavegador.js');
});
after(async () => { await servidor?.close(); });
beforeEach(() => {
  dom = new JSDOM('', { url: 'https://cursovalido.dev' });
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;
});
afterEach(() => {
  sessao.controleSessao.encerrar(); dom.window.close(); globalThis.fetch = fetchOriginal;
  delete globalThis.localStorage; delete globalThis.sessionStorage;
});

test('requisicao autenticada usa JWT sem cookies e sem cache', async () => {
  const token = 'header.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url') + '.assinatura';
  sessao.controleSessao.iniciar({ token });
  let enviada;
  globalThis.fetch = async (url, opcoes) => { enviada = opcoes; return Response.json({ ok: true }); };
  await api.requisitar('/administracao/usuarios');
  assert.equal(enviada.credentials, 'omit');
  assert.equal(enviada.cache, 'no-store');
  assert.equal(enviada.headers.Authorization, 'Bearer ' + token);
});

test('requisicao publica nao envia token nem cookies', async () => {
  let enviada;
  globalThis.fetch = async (url, opcoes) => { enviada = opcoes; return Response.json([]); };
  await api.requisitar('/forum/topicos', { semAutenticacao: true });
  assert.equal(enviada.credentials, 'omit');
  assert.equal(enviada.headers.Authorization, undefined);
});

test('erro interno nao e retido como detalhe tecnico no cliente', async () => {
  globalThis.fetch = async () => Response.json({ codigo: 'ERRO_INTERNO', message: 'jdbc:segredo', trace: 'consulta privada', path: '/interno' }, { status: 500 });
  await assert.rejects(() => api.requisitar('/forum/topicos'), erro => {
    assert.equal(erro.status, 500);
    assert.deepEqual(erro.dados, { codigo: 'ERRO_INTERNO' });
    assert.doesNotMatch(erro.message, /jdbc|segredo|privada|interno/);
    return true;
  });
});

test('validacoes de formulario preservam o contrato utilizado pelas telas', async () => {
  const dados = { codigo: 'CAMPOS_INVALIDOS', erro: 'Verifique os campos informados', campos: { titulo: 'Campo obrigatorio' } };
  globalThis.fetch = async () => Response.json(dados, { status: 400 });
  await assert.rejects(() => api.requisitar('/forum/topicos'), erro => {
    assert.deepEqual(erro.dados, dados);
    assert.equal(erro.codigo, 'CAMPOS_INVALIDOS');
    return true;
  });
});
test('limite de cadastro informa o motivo devolvido pela API em vez de pedir para tentar novamente', async () => {
  const erro = 'Limite de dois cadastros por endereço IP atingido. Se precisar de ajuda, procure o Suporte.';
  globalThis.fetch = async () => Response.json({ erro, codigo: 'OPERACAO_RECUSADA' }, { status: 429 });
  await assert.rejects(() => api.requisitar('/autenticacao/cadastro', { semAutenticacao: true }), { message: erro });
});
