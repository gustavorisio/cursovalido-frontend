import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { criarControleSessao, CHAVE_SESSAO, tokenValido } from '../src/servicos/sessaoNavegador.js';

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

test('reabrir o navegador restaura a sessão válida', () => {
  const local = armazenamento();
  const credencial = token();
  criarControleSessao(local).iniciar({ nome: 'Ana', token: credencial });
  assert.equal(criarControleSessao(local).obter().token, credencial);
});

test('outra aba observa um novo login e um logout', () => {
  const local = armazenamento();
  const primeira = criarControleSessao(local);
  const segunda = criarControleSessao(local);
  primeira.iniciar({ nome: 'Ana', token: token() });
  segunda.iniciar({ nome: 'Bruno', token: token() });
  assert.equal(primeira.obter().nome, 'Bruno');
  segunda.encerrar();
  assert.equal(primeira.obter(), null);
  assert.equal(local.getItem(CHAVE_SESSAO), null);
});

test('token expirado não é restaurado e é removido do armazenamento', () => {
  const local = armazenamento();
  const controle = criarControleSessao(local);
  local.setItem(CHAVE_SESSAO, JSON.stringify({ token: token(1) }));
  assert.equal(controle.obter(), null);
  assert.equal(local.getItem(CHAVE_SESSAO), null);
  assert.equal(tokenValido('abc.e30.def'), false);
  assert.throws(() => controle.iniciar({ token: token(1) }));
});

test('o formato legado não é restaurado', () => {
  const local = armazenamento();
  local.setItem('token', token());
  local.setItem('curso-valido-sessao', JSON.stringify({ token: token() }));
  assert.equal(criarControleSessao(local).obter(), null);
});
