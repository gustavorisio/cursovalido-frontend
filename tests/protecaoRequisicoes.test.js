import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { act, createElement as h } from 'react';
import { prepararTela, botao, clicar, preencher, enviar, simularApi } from './apoio/tela.js';

let Login, Cadastro, CampoSenha, SolicitarAlteracaoSenha, useAcaoUnica, api;
const { renderizar } = prepararTela(async (carregar) => {
  Login = (await carregar('paginas/Login.jsx')).default;
  Cadastro = (await carregar('paginas/Cadastro.jsx')).default;
  CampoSenha = (await carregar('componentes/autenticacao/CampoSenha.jsx')).default;
  SolicitarAlteracaoSenha = (await carregar('paginas/SolicitarAlteracaoSenha.jsx')).default;
  ({ useAcaoUnica } = await carregar('contextos/useAcaoUnica.js'));
  api = await carregar('servicos/api.js');
});

function adiado() {
  let resolver;
  const promessa = new Promise((resolve) => { resolver = resolve; });
  return { promessa, resolver };
}

test('envios iguais simultâneos compartilham uma única requisição', async () => {
  const espera = adiado();
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => { await espera.promessa; return Response.json({ ok: true }); });
  const opcoes = { method: 'POST', semAutenticacao: true, body: JSON.stringify({ email: 'a@x.com' }) };
  const primeira = api.requisitar('/autenticacao/login', opcoes);
  const segunda = api.requisitar('/autenticacao/login', opcoes);
  const outra = api.requisitar('/autenticacao/login', { ...opcoes, body: JSON.stringify({ email: 'b@x.com' }) });
  espera.resolver();
  assert.deepEqual(await primeira, await segunda);
  await outra;
  assert.equal(fetch.mock.calls.length, 2);

  await api.requisitar('/autenticacao/login', opcoes);
  assert.equal(fetch.mock.calls.length, 3, 'depois da resposta um novo envio é liberado');
  fetch.mockRestore();
});

test('consultas GET não são agrupadas', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json([]));
  await Promise.all([api.requisitar('/politicas/ativas', { semAutenticacao: true }), api.requisitar('/politicas/ativas', { semAutenticacao: true })]);
  assert.equal(fetch.mock.calls.length, 2);
  fetch.mockRestore();
});

test('ação única ignora cliques repetidos até terminar', async () => {
  const espera = adiado();
  const acao = vi.fn(() => espera.promessa);
  function Botao() {
    const [executar, executando] = useAcaoUnica();
    return h('button', { type: 'button', onClick: () => executar(acao) }, executando ? 'Enviando' : 'Enviar');
  }
  await renderizar(Botao);
  const elemento = botao('Enviar');
  await act(async () => { elemento.click(); elemento.click(); elemento.click(); });
  assert.equal(acao.mock.calls.length, 1);
  assert.ok(botao('Enviando'));
  await act(async () => espera.resolver());
  await clicar('Enviar');
  assert.equal(acao.mock.calls.length, 2);
});

test('login com duplo envio chama a autenticação uma única vez', async () => {
  const espera = adiado();
  const autenticarUsuario = vi.fn(() => espera.promessa);
  await renderizar(Login, { autenticacao: { autenticarUsuario } });
  await preencher('input[type="email"]', 'ana@example.com');
  await preencher('input[type="password"]', 'Senha@1');
  const formulario = document.querySelector('form');
  await act(async () => {
    formulario.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    formulario.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  assert.equal(autenticarUsuario.mock.calls.length, 1);
  await act(async () => espera.resolver({ requerCodigo2fa: true }));
});

test('login informa campos vazios e código inválido sem chamar o servidor', async () => {
  const autenticarUsuario = vi.fn(async () => ({ requerCodigo2fa: true }));
  const validarCodigo2fa = vi.fn();
  await renderizar(Login, { autenticacao: { autenticarUsuario, validarCodigo2fa } });
  await enviar();
  assert.equal(document.querySelector('[role="alert"]').textContent, 'Informe seu e-mail.');
  await preencher('input[type="email"]', 'ana@example.com');
  await enviar();
  assert.equal(document.querySelector('[role="alert"]').textContent, 'Informe sua senha.');
  assert.equal(autenticarUsuario.mock.calls.length, 0);

  await preencher('input[type="password"]', 'Senha@1');
  await enviar();
  await preencher('input[inputmode="numeric"]', '123');
  await enviar();
  assert.equal(document.querySelector('[role="alert"]').textContent, 'O código deve ter exatamente 6 números.');
  assert.equal(validarCodigo2fa.mock.calls.length, 0);
});

test('cadastro com senha sem caractere especial mostra a regra pendente', async () => {
  const chamadas = simularApi(() => Response.json({ versao: '1.0', conteudo: 'Termos' }));
  await renderizar(Cadastro, { url: '/cadastro' });
  await preencher('input[autocomplete="name"]', 'Ana Souza');
  await preencher('input[type="email"]', 'ana@example.com');
  const [senha, confirmacao] = document.querySelectorAll('input[type="password"]');
  await preencher(`[id="${senha.id}"]`, 'SenhaForte1');
  await preencher(`[id="${confirmacao.id}"]`, 'SenhaForte1');
  const pendentes = [...document.querySelectorAll('.regras-senha .regra-pendente')].map((item) => item.textContent);
  assert.equal(pendentes.length, 1);
  assert.match(pendentes[0], /caractere especial/);

  const cadastrar = botao('Cadastrar');
  assert.equal(cadastrar.disabled, false);
  await enviar('form.formulario-cadastro');
  assert.equal(document.querySelector('form [role="alert"]').textContent, 'A senha deve ter pelo menos um caractere especial, como ! ou @.');
  assert.equal(chamadas.some(({ metodo }) => metodo === 'POST'), false);
});

test('campo de senha lista as regras e marca as atendidas', async () => {
  function Campo() {
    return h(CampoSenha, { value: 'abc', onChange: () => { } });
  }
  await renderizar(Campo);
  const itens = [...document.querySelectorAll('.regras-senha li')];
  assert.equal(itens.length, 4);
  assert.deepEqual(itens.map((item) => item.className), ['regra-atendida', 'regra-pendente', 'regra-atendida', 'regra-pendente']);
  assert.equal(document.querySelector('input').getAttribute('aria-describedby'), document.querySelector('.regras-senha').id);
});

test('pedido de recuperação valida o e-mail e não repete o envio', async () => {
  const espera = adiado();
  const chamadas = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (endereco, opcoes) => { chamadas.push(opcoes); await espera.promessa; return new Response(null, { status: 204 }); });
  await renderizar(SolicitarAlteracaoSenha);
  await enviar();
  assert.equal(document.querySelector('[role="alert"]').textContent, 'Informe seu e-mail.');
  await preencher('input[type="email"]', 'ana@example.com');
  const formulario = document.querySelector('form');
  await act(async () => {
    formulario.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    formulario.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  assert.equal(chamadas.length, 1);
  await act(async () => espera.resolver());
});
