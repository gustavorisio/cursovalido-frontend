import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let servidor, Formulario, Convite, servico, dom, raiz, anteriorFetch;
before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Formulario = (await servidor.ssrLoadModule('/src/componentes/autenticacao/FormularioCadastro.jsx')).default;
  Convite = (await servidor.ssrLoadModule('/src/paginas/CadastroConvite.jsx')).default;
  servico = await servidor.ssrLoadModule('/src/servicos/servicoAutenticacao.js');
});
after(async () => { await servidor?.close(); });
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  anteriorFetch = globalThis.fetch;
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close(); globalThis.fetch = anteriorFetch;
  for (const key of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[key];
});

test('cadastro comum remove telefone e apresenta CPF invalido', async () => {
  const props = { dados: { nomeCompleto: '', email: '', senha: '', cpf: '11111111111', dataNascimento: '', declarouMaiorIdade: false, aceitouTermosLgpd: false }, idade: 0, carregando: false, formularioValido: false, onAlterar: () => { }, onEnviar: () => { } };
  await act(() => raiz.render(createElement(MemoryRouter, null, createElement(Formulario, props))));
  assert.doesNotMatch(document.body.textContent, /telefone/i);
  assert.match(document.body.textContent, /CPF.CNPJ/);
  assert.match(document.body.textContent, /Informe um CPF válido/);
  assert.equal(document.querySelector('button').disabled, true);
});

test('cadastro por convite nao solicita telefone e mantem maioridade', async () => {
  globalThis.fetch = async (url) => String(url).includes('confirmar-email') ? new Response(null, { status: 204 }) : Response.json([{ nome: 'Termos', versao: '1.0', conteudo: 'Termos' }]);
  await act(async () => raiz.render(createElement(MemoryRouter, { initialEntries: ['/convites/cadastro?token=teste'] }, createElement(Convite))));
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmar meu e-mail').click());
  assert.ok(document.querySelector('form'));
  assert.doesNotMatch(document.querySelector('form').textContent, /telefone/i);
  assert.match(document.querySelector('form').textContent, /18 anos ou mais/);
  assert.match(document.querySelector('form').textContent, /CPF.CNPJ/);
  assert.equal(document.querySelector('form button').disabled, true);
});

test('contratos dos dois cadastros nao enviam telefone mesmo em dados legados', async () => {
  const enviados = [];
  globalThis.fetch = async (_url, options) => { enviados.push(JSON.parse(options.body)); return new Response(null, { status: 204 }); };
  const dados = { nomeCompleto: 'Aluno', email: 'aluno@example.com', senha: 'SenhaTeste123!', cpf: '52998224725', dataNascimento: '1990-01-01', telefone: '11999999999', declarouMaiorIdade: true, aceitouTermosLgpd: true, versaoTermos: '1.0' };
  await servico.cadastrarUsuario(dados);
  await servico.completarCadastroConvite('teste', dados);
  for (const envio of [enviados[0], enviados[1].cadastro]) {
    assert.equal(Object.hasOwn(envio, 'telefone'), false);
    assert.equal(envio.cpf, '52998224725');
  }
});

test('erros da consulta externa aparecem sem redirecionamento ou dados internos', async () => {
  const dados = { nomeCompleto: 'Aluno', email: 'aluno@example.com', senha: 'SenhaTeste123!', cpf: '52998224725', dataNascimento: '1990-01-01', declarouMaiorIdade: true, aceitouTermosLgpd: true, versaoTermos: '1.0' };
  for (const [status, codigo] of [[422, 'CPF_DADOS_INVALIDOS'], [503, 'CPF_CONSULTA_INDISPONIVEL']]) {
    globalThis.fetch = async () => Response.json({ codigo, erro: 'Mensagem interna' }, { status });
    await assert.rejects(servico.cadastrarUsuario(dados), erro => erro.status === status && erro.codigo === codigo && !erro.message.includes('Mensagem interna'));
    await assert.rejects(servico.completarCadastroConvite('teste', dados), erro => erro.status === status && erro.codigo === codigo && !erro.message.includes('Mensagem interna'));
  }
  assert.equal(window.location.href, 'http://localhost:3000/');
});
