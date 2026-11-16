import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './apoio/servidor.js';

let servidor, aulas, aulasAdmin, administracao, autenticacao;

before(async () => {
  servidor = await createServer({ configFile: false, server: { middlewareMode: true }, logLevel: 'silent' });
  aulas = await servidor.ssrLoadModule('/src/componentes/aulas/servicos/servicoAulas.js');
  aulasAdmin = await servidor.ssrLoadModule('/src/componentes/aulas/servicos/servicoAdministradorAulas.js');
  administracao = await servidor.ssrLoadModule('/src/servicos/servicoAdministracao.js');
  autenticacao = await servidor.ssrLoadModule('/src/servicos/servicoAutenticacao.js');
});

after(async () => { await servidor?.close(); });

function registrarRequisicoes(t) {
  const chamadas = [];
  t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
    chamadas.push({
      caminho: new URL(url).pathname.replace(/^\/api/, ''),
      metodo: opcoes.method ?? 'GET',
      dados: opcoes.body ? JSON.parse(opcoes.body) : null,
    });
    return new Response(null, { status: 204 });
  });
  return chamadas;
}

test('professor usa rotas distintas para cadastrar e editar curso e módulo', async (t) => {
  const chamadas = registrarRequisicoes(t);
  const curso = { titulo: 'Desenvolvimento web' };
  const modulo = { titulo: 'Primeiros passos', ordem: 1 };
  await aulas.salvarCurso(null, curso);
  await aulas.salvarCurso(4, curso);
  await aulas.salvarModulo(null, 4, modulo);
  await aulas.salvarModulo(8, 4, modulo);
  await aulas.excluirModulo(8);
  await aulas.excluirCurso(4);

  assert.deepEqual(chamadas, [
    { caminho: '/cursos', metodo: 'POST', dados: curso },
    { caminho: '/cursos/4', metodo: 'PUT', dados: curso },
    { caminho: '/cursos/4/modulos', metodo: 'POST', dados: modulo },
    { caminho: '/modulos/8', metodo: 'PUT', dados: modulo },
    { caminho: '/modulos/8', metodo: 'DELETE', dados: null },
    { caminho: '/cursos/4', metodo: 'DELETE', dados: null },
  ]);
});

test('administração usa ações distintas para editar e alterar o estado da aula', async (t) => {
  const chamadas = registrarRequisicoes(t);
  const dados = { titulo: 'Introdução a HTML' };
  await aulasAdmin.editarAula(5, dados);
  await aulasAdmin.arquivarAula(5);
  await aulasAdmin.reabrirAula(5);

  assert.deepEqual(chamadas, [
    { caminho: '/administracao/aulas/5', metodo: 'PUT', dados },
    { caminho: '/administracao/aulas/5/arquivar', metodo: 'PUT', dados: null },
    { caminho: '/administracao/aulas/5/reabrir', metodo: 'PUT', dados: null },
  ]);
});

test('serviços administrativos orientam nova tentativa quando uma rota está indisponível', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 404 }));
  await assert.rejects(aulasAdmin.listarCursos(), /Não foi possível consultar os cursos/);
  await assert.rejects(administracao.buscarPermissoesAdministrativas(), /A administração está indisponível/);

  fetch.mock.mockImplementation(async () => Response.json({}, { status: 503 }));
  await assert.rejects(aulasAdmin.listarCursos(), { status: 503 });
  await assert.rejects(administracao.buscarPermissoesAdministrativas(), { status: 503 });
});

test('administração envia ações de convite à rota correspondente', async (t) => {
  const chamadas = registrarRequisicoes(t);
  const email = 'professora@example.com';
  await autenticacao.criarConvite(email, 'PROFESSOR');
  await autenticacao.buscarConvites();
  await autenticacao.buscarConvitesPendentes();
  await autenticacao.aprovarConvite(3);
  await autenticacao.rejeitarConvite(4);
  await autenticacao.removerPendenciaConvite(4);
  await autenticacao.cancelarConvite(5);
  await autenticacao.reenviarConvite(6);

  assert.deepEqual(chamadas.map(({ caminho, metodo }) => [caminho, metodo]), [
    ['/administracao/convites', 'POST'],
    ['/administracao/convites', 'GET'],
    ['/administracao/convites/pendentes', 'GET'],
    ['/administracao/convites/3/aprovar', 'POST'],
    ['/administracao/convites/4/rejeitar', 'POST'],
    ['/administracao/convites/4', 'DELETE'],
    ['/administracao/convites/5/cancelar', 'DELETE'],
    ['/administracao/convites/6/reenviar', 'POST'],
  ]);
  assert.deepEqual(chamadas[0].dados, { email, perfil: 'PROFESSOR' });
});

test('serviço de exclusão recusa código incompleto antes de chamar a API', (t) => {
  const chamadas = registrarRequisicoes(t);
  assert.throws(() => autenticacao.excluirConta('12345'), /seis dígitos/);
  assert.throws(() => autenticacao.excluirConta(123456), /seis dígitos/);
  assert.equal(chamadas.length, 0);
});
