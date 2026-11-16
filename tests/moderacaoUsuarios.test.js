import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { prepararTela, clicar, botao, preencher, enviar, simularApi } from './apoio/tela.js';

let ModeracaoUsuarios, Administracao;
const { renderizar } = prepararTela(async (carregar) => {
  Administracao = (await carregar('paginas/Administracao.jsx')).default;
  ModeracaoUsuarios = (await carregar('componentes/administracao/ModeracaoUsuarios.jsx')).default;
});

const aluno = {
  id: 8, nome: 'Ana Silva', email: 'a***@example.com', perfil: 'ALUNO',
  ativo: true, podeModerar: true, podeExcluir: true, suspensoes: [],
};
const professora = {
  id: 9, nome: 'Beatriz Souza', email: 'beatriz@example.com', perfil: 'PROFESSOR',
  ativo: true, suspensoes: [],
};

test('filtra usuários pelo nome e informa quando não encontra resultados', async () => {
  await renderizar(ModeracaoUsuarios, { props: { usuarios: [aluno, professora] } });
  assert.equal(document.querySelectorAll('.moderacao-usuario').length, 2);

  await preencher('input[type="search"]', '  ANA ');
  assert.equal(document.querySelectorAll('.moderacao-usuario').length, 1);
  assert.match(document.querySelector('.moderacao-usuario').textContent, /Ana Silva/);

  await preencher('input[type="search"]', 'Carlos');
  assert.match(document.body.textContent, /Nenhum usuário encontrado/);
});

test('valida o motivo e a data antes de aplicar uma restrição permanente', async (t) => {
  const chamadas = simularApi(t, () => new Response(null, { status: 204 }));
  const onExecutar = t.mock.fn(async (acao) => acao());
  await renderizar(ModeracaoUsuarios, { props: { usuarios: [aluno], onExecutar } });
  await clicar('Aplicar restrição');
  await enviar('.moderacao-formulario');
  assert.match(document.querySelector('[role="alert"]').textContent, /Informe o motivo/);

  await preencher('textarea', ' Publicações repetidas ');
  await enviar('.moderacao-formulario');
  assert.match(document.querySelector('[role="alert"]').textContent, /Informe uma data válida/);
  await preencher('input[type="datetime-local"]', '2020-01-01T10:00');
  await enviar('.moderacao-formulario');
  assert.match(document.querySelector('[role="alert"]').textContent, /deve estar no futuro/);
  assert.equal(onExecutar.mock.callCount(), 0);

  await act(async () => document.querySelector('input[type="checkbox"]').click());
  await preencher('select', 'TOPICOS');
  await enviar('.moderacao-formulario');
  assert.match(onExecutar.mock.calls[0].arguments[1], /Ana Silva/);
  assert.equal(chamadas[0].rota, '/administracao/usuarios/8/suspensoes');
  assert.deepEqual(chamadas[0].dados, { escopo: 'TOPICOS', motivo: 'Publicações repetidas', expiraEm: null });
  assert.equal(document.querySelector('.moderacao-formulario'), null);
});

test('permite revogar restrição e encaminha a exclusão para confirmação', async (t) => {
  const chamadas = simularApi(t, () => new Response(null, { status: 204 }));
  const onExecutar = t.mock.fn();
  const suspensoes = [{ id: 10, escopo: 'FORUM', expiraEm: null, motivo: 'Publicações repetidas' }];
  await renderizar(ModeracaoUsuarios, { props: { usuarios: [{ ...aluno, suspensoes }], onExecutar } });
  await clicar('Revogar restrição');
  await clicar('Excluir conta');
  assert.equal(chamadas.length, 0);

  const [revogar, excluir] = onExecutar.mock.calls.map((chamada) => chamada.arguments[0]);
  await revogar();
  await excluir();

  assert.deepEqual(chamadas.map(({ rota, metodo }) => [rota, metodo]), [
    ['/administracao/usuarios/8/suspensoes/10', 'DELETE'],
    ['/administracao/usuarios/8', 'DELETE'],
  ]);
});

test('administrador comum restringe professor e encontra a conta pelo filtro', async (t) => {
  const professor = { ...professora, podeModerar: true, podeExcluir: false };
  const suspensao = { id: 11, escopo: 'FORUM', motivo: 'Publicações repetidas', expiraEm: null };
  let restringido = false;
  const chamadas = simularApi(t, ({ rota, busca, metodo }) => {
    if (rota === '/administracao/permissoes') return Response.json({ principal: false });
    if (rota === '/administracao/usuarios') {
      const restrito = busca.get('restrito');
      const conta = { ...professor, suspensoes: restringido ? [suspensao] : [] };
      return Response.json(restrito === null || restrito === String(restringido) ? [conta] : []);
    }
    if (rota === '/administracao/usuarios/9/suspensoes' && metodo === 'POST') {
      restringido = true;
      return Response.json(suspensao, { status: 201 });
    }
    if (rota === '/administracao/usuarios/9/suspensoes/11' && metodo === 'DELETE') {
      restringido = false;
      return new Response(null, { status: 204 });
    }
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Administracao, { sessao: { perfil: 'ADMINISTRADOR' }, props: { tela: 'usuarios' } });

  assert.equal(botao('Excluir conta'), undefined);
  await clicar('Aplicar restrição');
  await preencher('textarea', suspensao.motivo);
  await act(async () => document.querySelector('input[type="checkbox"]').click());
  await enviar('.moderacao-formulario');
  await clicar('Confirmar');

  await clicar('Sem restrição');
  assert.equal(chamadas.at(-1).busca.get('restrito'), 'false');
  assert.equal(document.querySelector('.moderacao-usuario'), null);

  await clicar('Com restrição');
  assert.equal(chamadas.at(-1).busca.get('restrito'), 'true');
  assert.match(document.querySelector('.moderacao-usuario').textContent, /Beatriz Souza/);
  await clicar('Revogar restrição');
  await clicar('Confirmar');
  assert.equal(document.querySelector('.moderacao-usuario'), null);

  await clicar('Todos os usuários');
  assert.equal(chamadas.at(-1).busca.has('restrito'), false);
  assert.match(document.querySelector('.moderacao-usuario').textContent, /Beatriz Souza/);
});
