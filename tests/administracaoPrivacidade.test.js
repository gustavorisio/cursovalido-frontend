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
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage; globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount()); dom.window.close(); globalThis.fetch = fetchOriginal;
  for (const chave of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[chave];
});
function dados(principal = true) {
  return [
    { id: 1, nome: 'Principal', gamertag: 'CV-AAAA2345BBBB', email: 'principal@example.com', perfil: 'ADMINISTRADOR', ativo: true, podeModerar: false, podeExcluir: false, suspensoes: [] },
    { id: 2, nome: 'Professor', gamertag: 'CV-CCCC2345DDDD', email: 'professor@example.com', perfil: 'PROFESSOR', ativo: true, podeModerar: true, podeExcluir: principal, suspensoes: [] },
    { id: 3, nome: 'Outro administrador', gamertag: 'CV-EEEE2345FFFF', email: 'admin@example.com', perfil: 'ADMINISTRADOR', ativo: true, podeModerar: principal, podeExcluir: principal, suspensoes: [] },
    { id: 4, nome: 'Estudante', gamertag: 'CV-GGGG2345HHHH', email: 'estudante@gmail.com', perfil: 'ALUNO', ativo: true, podeModerar: true, podeExcluir: false, suspensoes: [] },
  ];
}
async function renderizar(principal = true, tela = 'usuarios') {
  await act(async () => raiz.render(createElement(MemoryRouter, null,
    createElement(Contexto.Provider, { value: { sessao: { idUsuario: principal ? 1 : 3, nome: 'Administrador' } } },
      createElement(Administracao, { tela })))));
}
function artigo(nome) {
  return [...document.querySelectorAll('article')].find(elemento => elemento.querySelector('h3')?.textContent === nome);
}
function botao(elemento, texto) {
  return [...elemento.querySelectorAll('button')].find(item => item.textContent === texto);
}

test('principal confirma exclusao da equipe, sem oferecer autoexclusao nem exclusao de aluno', async () => {
  let usuarios = dados();
  const exclusoes = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    if (String(url).endsWith('/permissoes')) return Response.json({ principal: true });
    if (opcoes.method === 'DELETE') {
      exclusoes.push(String(url)); usuarios = usuarios.filter(u => u.id !== 2);
      return new Response(null, { status: 204 });
    }
    return Response.json(usuarios);
  };
  await renderizar();
  assert.equal(botao(artigo('Principal'), 'Excluir conta'), undefined);
  assert.equal(botao(artigo('Estudante'), 'Excluir conta'), undefined);
  assert.ok(botao(artigo('Outro administrador'), 'Excluir conta'));
  assert.match(artigo('Estudante').textContent, /CV-GGGG2345HHHH/);
  assert.doesNotMatch(artigo('Professor').textContent, /professor@example.com/);
  await act(async () => botao(artigo('Professor'), 'Excluir conta').click());
  assert.equal(exclusoes.length, 0);
  assert.match(document.querySelector('[role="dialog"]').textContent, /histórico|preservados/);
  await act(async () => botao(document.querySelector('[role="dialog"]'), 'Cancelar').click());
  assert.equal(exclusoes.length, 0);
  await act(async () => botao(artigo('Professor'), 'Excluir conta').click());
  await act(async () => botao(document.querySelector('[role="dialog"]'), 'Confirmar').click());
  assert.equal(exclusoes.length, 1);
  assert.ok(exclusoes[0].endsWith('/administracao/usuarios/2'));
  assert.equal(artigo('Professor'), undefined);
  assert.match(document.querySelector('[role="status"]').textContent, /Conta excluída/);
});

test('administrador comum nao recebe opcao para excluir membros da equipe', async () => {
  globalThis.fetch = async url => Response.json(String(url).endsWith('/permissoes') ? { principal: false } : dados(false));
  await renderizar(false);
  assert.equal([...document.querySelectorAll('button')].filter(item => item.textContent === 'Excluir conta').length, 0);
  assert.match(document.body.textContent, /CV-GGGG2345HHHH/);
});

test('administrador comum nao carrega nem gerencia convites pela URL direta', async () => {
  const chamadas = [];
  globalThis.fetch = async url => {
    chamadas.push(String(url));
    return Response.json({ principal: false });
  };
  await renderizar(false, 'convites');
  assert.equal(chamadas.length, 1);
  assert.ok(chamadas[0].endsWith('/permissoes'));
  assert.equal(document.querySelector('a[href="/administracao/convites"]'), null);
  assert.match(document.querySelector('[role="alert"]').textContent, /apenas para o root/);
  assert.equal(document.querySelector('form'), null);
});

test('root mantem formulario de convite para professor e administrador', async () => {
  globalThis.fetch = async url => Response.json(String(url).endsWith('/permissoes') ? { principal: true } : []);
  await renderizar(true, 'convites');
  assert.ok(document.querySelector('a[href="/administracao/convites"]'));
  assert.deepEqual([...document.querySelectorAll('select option')].map(item => item.value), ['PROFESSOR', 'ADMINISTRADOR']);
  assert.ok(botao(document.querySelector('form'), 'Enviar convite'));
});

test('falha ao excluir mantem o usuario na lista e informa o erro', async () => {
  globalThis.fetch = async (url, opcoes = {}) => {
    if (opcoes.method === 'DELETE') return Response.json({ mensagem: 'Falha' }, { status: 500 });
    return Response.json(String(url).endsWith('/permissoes') ? { principal: true } : dados());
  };
  await renderizar();
  await act(async () => botao(artigo('Professor'), 'Excluir conta').click());
  await act(async () => botao(document.querySelector('[role="dialog"]'), 'Confirmar').click());
  assert.ok(artigo('Professor'));
  assert.match(document.querySelector('[role="alert"]').textContent, /indisponível/);
});

test('paginação administrativa volta à última página disponível ao excluir um usuário', async () => {
  let usuarios = Array.from({ length: 11 }, (_, i) => ({
    ...dados()[1], id: i + 1, nome: 'Professor ' + (i + 1),
  }));
  globalThis.fetch = async (url, opcoes = {}) => {
    if (String(url).endsWith('/permissoes')) return Response.json({ principal: true });
    if (opcoes.method === 'DELETE') {
      usuarios = usuarios.filter(u => u.id !== 11);
      return new Response(null, { status: 204 });
    }
    return Response.json(usuarios);
  };
  await renderizar();
  assert.equal(document.querySelectorAll('.moderacao-usuario').length, 10);
  await act(() => botao(document.querySelector('.paginacao-lista'), 'Próxima').click());
  assert.equal(document.querySelectorAll('.moderacao-usuario').length, 1);
  await act(() => botao(artigo('Professor 11'), 'Excluir conta').click());
  await act(() => botao(document.querySelector('[role="dialog"]'), 'Confirmar').click());
  assert.equal(document.querySelectorAll('.moderacao-usuario').length, 10);
  assert.equal(document.querySelector('.paginacao-lista'), null);
});
