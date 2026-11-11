import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { criarControleSessao, CHAVE_CONTROLE_SESSAO, tokenValido } from '../src/servicos/sessaoNavegador.js';

function token(exp = Math.floor(Date.now() / 1000) + 3600) {
  return `cabecalho.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.assinatura`;
}

function armazenamento() {
  const itens = new Map();
  return {
    getItem: (chave) => itens.get(chave) ?? null,
    setItem: (chave, valor) => itens.set(chave, valor),
    removeItem: (chave) => itens.delete(chave),
    itens,
  };
}

test('nova abertura nao restaura conta mesmo com dados antigos no armazenamento', () => {
  const local = armazenamento();
  local.setItem('token', token());
  local.setItem('curso-valido-sessao', JSON.stringify({ nome: 'Conta antiga', token: token() }));
  local.setItem(CHAVE_CONTROLE_SESSAO, 'controle-antigo');
  assert.equal(criarControleSessao(local).obter(), null);
});

test('tokens ficam em memoria e nao sao gravados no armazenamento compartilhado', () => {
  const local = armazenamento();
  const controle = criarControleSessao(local);
  const credencial = token();
  controle.iniciar({ nome: 'Ana', token: credencial });
  assert.equal(controle.obter().token, credencial);
  assert.equal(local.getItem('token'), null);
  assert.equal(local.getItem('curso-valido-sessao'), null);
  assert.equal([...local.itens.values()].includes(credencial), false);
});

test('login em outra aba impede uso da conta anterior imediatamente', () => {
  const local = armazenamento();
  const primeira = criarControleSessao(local);
  const segunda = criarControleSessao(local);
  primeira.iniciar({ nome: 'Ana', token: token() });
  segunda.iniciar({ nome: 'Bruno', token: token() });
  assert.equal(primeira.obter(), null);
  assert.equal(segunda.obter().nome, 'Bruno');
  const encerrada = primeira.encerrar();
  assert.equal(encerrada.nome, 'Ana');
  assert.equal(segunda.obter().nome, 'Bruno');
});

test('logout apaga a propriedade da sessao e nova abertura exige login', () => {
  const local = armazenamento();
  const controle = criarControleSessao(local);
  controle.iniciar({ token: token() });
  assert.ok(controle.encerrar().token);
  assert.equal(local.getItem(CHAVE_CONTROLE_SESSAO), null);
  assert.equal(controle.obter(), null);
  assert.equal(criarControleSessao(local).obter(), null);
});

test('token expirado ou sem expiracao nao autentica', () => {
  assert.equal(tokenValido(token(1)), false);
  assert.equal(tokenValido('abc.def.ghi'), false);
  assert.equal(tokenValido('abc.e30.def'), false);
  assert.equal(tokenValido(null), false);
  assert.throws(() => criarControleSessao(armazenamento()).iniciar({ token: token(1) }));
});

test('restaura a sessao valida apos F5 sem compartilhar token com outras abas', () => {
  const local = armazenamento();
  const aba = armazenamento();
  const primeira = criarControleSessao(local, aba);
  const credencial = token();
  primeira.iniciar({ nome: 'Ana', token: credencial });
  assert.equal(criarControleSessao(local, aba).obter().token, credencial);
  assert.equal(criarControleSessao(local, armazenamento()).obter(), null);
  assert.equal([...local.itens.values()].some(valor => valor.includes(credencial)), false);
  criarControleSessao(local, aba).encerrar();
  assert.equal(criarControleSessao(local, aba).obter(), null);
});
