import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { Route, useLocation } from 'react-router-dom';
import { prepararTela, botao, clicar, preencher, enviar, simularApi } from './apoio/tela.js';

let ConfirmacaoEmail, SolicitarAlteracaoSenha, AlterarSenha, ExclusaoConta, AlterarSenhaConta, DadosUsuario;
const { renderizar } = prepararTela(async (carregar) => {
  ConfirmacaoEmail = (await carregar('paginas/ConfirmacaoEmail.jsx')).default;
  SolicitarAlteracaoSenha = (await carregar('paginas/SolicitarAlteracaoSenha.jsx')).default;
  AlterarSenha = (await carregar('paginas/AlterarSenha.jsx')).default;
  DadosUsuario = (await carregar('componentes/autenticacao/DadosUsuario.jsx')).default;
  AlterarSenhaConta = (await carregar('paginas/AlterarSenhaConta.jsx')).default;
  ExclusaoConta = (await carregar('componentes/autenticacao/ExclusaoConta.jsx')).default;
});

test('confirma o e-mail com o token do link', async () => {
  const chamadas = simularApi(() => new Response(null, { status: 204 }));
  await renderizar(ConfirmacaoEmail, { url: '/confirmacao?token=abc123' });
  assert.equal(chamadas.length, 0);

  await clicar('Confirmar meu e-mail');
  assert.equal(chamadas[0].rota, '/autenticacao/confirmar-email');
  assert.deepEqual(chamadas[0].dados, { token: 'abc123' });
  assert.match(document.querySelector('[role="status"]').textContent, /E-mail confirmado/);
  assert.equal(botao('Confirmar meu e-mail'), undefined);
});

test('link de confirmação expirado oferece reenvio', async () => {
  const chamadas = simularApi(({ rota }) => rota.endsWith('/confirmar-email')
    ? Response.json({ codigo: 'TOKEN_EXPIRADO' }, { status: 400 })
    : new Response(null, { status: 204 }));
  await renderizar(ConfirmacaoEmail, { url: '/confirmacao?token=expirado' });
  await clicar('Confirmar meu e-mail');
  assert.match(document.querySelector('[role="alert"]').textContent, /expirou/);

  await preencher('input[type="email"]', 'aluno@example.com');
  await enviar();
  assert.equal(chamadas[1].rota, '/autenticacao/reenviar-confirmacao');
  assert.deepEqual(chamadas[1].dados, { email: 'aluno@example.com' });
  assert.match(document.querySelector('[role="status"]').textContent, /novo link/);
});

test('pede instruções de recuperação e exibe a resposta genérica', async () => {
  const chamadas = simularApi(() => new Response(null, { status: 204 }));
  await renderizar(SolicitarAlteracaoSenha);
  await preencher('input[type="email"]', 'aluno@example.com');
  await enviar();

  assert.equal(chamadas[0].rota, '/autenticacao/solicitar-alteracao-senha');
  assert.deepEqual(chamadas[0].dados, { email: 'aluno@example.com' });
  assert.match(document.querySelector('[role="status"]').textContent, /Se a conta existir/);
});

test('redefinição valida as senhas e permite corrigir uma falha da API', async () => {
  const chamadas = simularApi(() => Response.json({}, { status: 503 }));
  await renderizar(AlterarSenha, { url: '/redefinir?token=abc123' });
  await preencher('input[type="password"]:first-of-type', 'fraca');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /pelo menos 8 caracteres/);

  await preencher('.formulario-publico > :nth-child(1) input', 'NovaSenha!');
  await preencher('.formulario-publico > :nth-child(2) input', 'OutraSenha!');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /confirmação deve ser igual/);
  assert.equal(chamadas.length, 0);

  await preencher('.formulario-publico > :nth-child(2) input', 'NovaSenha!');
  await enviar();
  assert.equal(chamadas[0].rota, '/autenticacao/alterar-senha');
  assert.deepEqual(chamadas[0].dados, { token: 'abc123', novaSenha: 'NovaSenha!', confirmacaoSenha: 'NovaSenha!' });
  assert.ok(document.querySelector('[role="alert"]'));
  assert.equal(botao('Alterar senha').disabled, false);
});

test('exclusão da conta pede confirmação e preserva o zero inicial do código', async () => {
  const chamadas = simularApi(() => new Response(null, { status: 204 }));
  const aoExcluir = vi.fn();
  await renderizar(ExclusaoConta, { props: { aoExcluir } });

  await clicar('Excluir minha conta');
  await clicar('Cancelar', document.querySelector('[role="dialog"]'));
  assert.equal(chamadas.length, 0);

  await clicar('Excluir minha conta');
  await clicar('Confirmar');
  assert.equal(chamadas[0].rota, '/autenticacao/conta/solicitar-exclusao');
  assert.equal(botao('Confirmar exclusão permanente').disabled, true);
  await preencher('#codigo-exclusao', '01a2345');
  await enviar();

  assert.equal(chamadas[1].metodo, 'DELETE');
  assert.deepEqual(chamadas[1].dados, { codigo: '012345' });
  assert.equal(aoExcluir.mock.calls.length, 1);
});

test('falha no código de exclusão mantém o formulário disponível para nova tentativa', async () => {
  simularApi(({ metodo }) => metodo === 'DELETE'
    ? Response.json({}, { status: 400 })
    : new Response(null, { status: 204 }));
  const aoExcluir = vi.fn();
  await renderizar(ExclusaoConta, { props: { aoExcluir } });
  await clicar('Excluir minha conta');
  await clicar('Confirmar');

  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /seis dígitos/);

  await preencher('#codigo-exclusao', '123456');
  await enviar();
  assert.ok(document.querySelector('[role="alert"]'));
  assert.equal(botao('Confirmar exclusão permanente').disabled, false);
  assert.equal(aoExcluir.mock.calls.length, 0);
  await clicar('Cancelar');
  assert.equal(document.querySelector('form'), null);
});

test('alteração de senha na conta encerra a sessão após salvar', async () => {
  const chamadas = simularApi(() => new Response(null, { status: 204 }));
  const sair = vi.fn();
  function Login() {
    return h('p', null, useLocation().state.mensagem);
  }
  await renderizar(AlterarSenhaConta, {
    url: '/configuracoes/alterar-senha', autenticacao: { sair },
    extra: [h(Route, { key: 'login', path: '/login', element: h(Login) })],
  });

  await preencher('input[autocomplete="current-password"]', 'SenhaAntiga!');
  await preencher('.formulario-publico > :nth-child(2) input', 'SenhaNova!');
  await preencher('.formulario-publico > :nth-child(3) input', 'SenhaNova!');
  await enviar();

  assert.equal(chamadas[0].rota, '/autenticacao/alterar-senha-autenticado');
  assert.equal(sair.mock.calls.length, 1);
  assert.match(document.body.textContent, /Entre com a nova senha/);
});

test('dados do usuário podem ser carregados novamente após uma resposta incompleta', async () => {
  const dados = { id: 5, email: 'ana@example.com', nomeCompleto: 'Ana Silva', perfil: { codigo: 'ALUNO' } };
  let primeira = true;
  simularApi(() => {
    if (!primeira) return Response.json(dados);
    primeira = false;
    return Response.json({ id: 5 });
  });
  await renderizar(DadosUsuario);

  assert.match(document.querySelector('[role="alert"]').textContent, /Não foi possível carregar seus dados/);
  await clicar('Tentar novamente');
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.match(document.querySelector('dl').textContent, /Ana Silva/);
});

test('alteração de senha na conta recusa senha atual vazia ou repetida sem chamar o servidor', async () => {
  const chamadas = simularApi(() => new Response(null, { status: 204 }));
  await renderizar(AlterarSenhaConta, { url: '/configuracoes/alterar-senha', autenticacao: { sair: vi.fn() } });

  await preencher('.formulario-publico > :nth-child(2) input', 'SenhaNova!');
  await preencher('.formulario-publico > :nth-child(3) input', 'SenhaNova!');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /Informe sua senha atual/);

  await preencher('input[autocomplete="current-password"]', 'SenhaNova!');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /diferente da senha atual/);
  assert.equal(chamadas.length, 0);
});
