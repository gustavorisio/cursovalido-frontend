import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement, act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let servidor, Formulario, Convite, AceiteDocumentos, DocumentoLegal, servico, dom, raiz, anteriorFetch;
before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Formulario = (await servidor.ssrLoadModule('/src/componentes/autenticacao/FormularioCadastro.jsx')).default;
  Convite = (await servidor.ssrLoadModule('/src/paginas/CadastroConvite.jsx')).default;
  AceiteDocumentos = (await servidor.ssrLoadModule('/src/componentes/comuns/AceiteDocumentos.jsx')).default;
  DocumentoLegal = (await servidor.ssrLoadModule('/src/componentes/comuns/DocumentoLegal.jsx')).default;
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

test('cadastro comum solicita somente os dados necessarios e mantem maioridade', async () => {
  const props = { dados: { nomeCompleto: '', email: '', senha: '', dataNascimento: '', declarouMaiorIdade: false, aceitouTermosLgpd: false }, idade: 0, carregando: false, formularioValido: false, onAlterar: () => { }, onEnviar: () => { } };
  await act(() => raiz.render(createElement(MemoryRouter, null, createElement(Formulario, props))));
  assert.doesNotMatch(document.body.textContent, /telefone/i);
  assert.deepEqual([...document.querySelectorAll('input')].map(input => input.type), ['text', 'email', 'password', 'date', 'checkbox', 'checkbox']);
  assert.match(document.body.textContent, /18 anos ou mais/);
  assert.equal(document.querySelector('button[type=submit], button:not([type])').disabled, true);
});

test('cadastro por convite nao solicita telefone e mantem maioridade', async () => {
  globalThis.fetch = async (url) => String(url).includes('confirmar-email') ? new Response(null, { status: 204 }) : Response.json([{ nome: 'Termos', versao: '1.0', conteudo: 'Termos' }]);
  await act(async () => raiz.render(createElement(MemoryRouter, { initialEntries: ['/convites/cadastro?token=teste'] }, createElement(Convite))));
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmar meu e-mail').click());
  assert.ok(document.querySelector('form'));
  assert.doesNotMatch(document.querySelector('form').textContent, /telefone/i);
  assert.match(document.querySelector('form').textContent, /18 anos ou mais/);
  assert.deepEqual([...document.querySelectorAll('form input')].map(input => input.type), ['text', 'email', 'password', 'date', 'checkbox', 'checkbox']);
  assert.equal(document.querySelector('form button:not([type])').disabled, true);
});

test('contratos dos dois cadastros nao enviam telefone mesmo em dados legados', async () => {
  const enviados = [];
  globalThis.fetch = async (_url, options) => { enviados.push(JSON.parse(options.body)); return new Response(null, { status: 204 }); };
  const dados = { nomeCompleto: 'Aluno', email: 'aluno@example.com', senha: 'SenhaTeste123!', dataNascimento: '1990-01-01', telefone: '11999999999', declarouMaiorIdade: true, aceitouTermosLgpd: true, versaoTermos: '1.0' };
  await servico.cadastrarUsuario(dados);
  await servico.completarCadastroConvite('teste', dados);
  for (const envio of [enviados[0], enviados[1].cadastro]) {
    assert.equal(Object.hasOwn(envio, 'telefone'), false);
    assert.deepEqual(envio, { nomeCompleto: dados.nomeCompleto, email: dados.email, senha: dados.senha, dataNascimento: dados.dataNascimento, declarouMaiorIdade: true, aceitouTermosLgpd: true, versaoTermos: dados.versaoTermos });
  }
});

test('aceite abre na página e exige chegar ao fim de ambos os documentos', async () => {
  globalThis.fetch = async (url) => String(url).includes('/privacidade/')
    ? Response.json({ versao: '2.0', conteudo: '<h2>Privacidade</h2><p>Texto da <strong>política de privacidade</strong>.</p>' })
    : Response.json([{ versao: '1.0', conteudo: '<h2>Termos</h2><p>Texto dos <strong>termos de aceite</strong>.</p>' }]);
  const alteracoes = [];
  function Fluxo() {
    const [aceito, setAceito] = useState(false);
    return createElement(AceiteDocumentos, { versaoTermos: '1.0', aceito, onAlterar(valor) { alteracoes.push(valor); setAceito(valor); } });
  }
  await act(() => raiz.render(createElement(Fluxo)));
  const checkbox = document.querySelector('input[type=checkbox]');
  await act(async () => checkbox.click());
  assert.equal(checkbox.checked, false);
  assert.equal(document.querySelector('iframe, a'), null);
  for (const titulo of ['Termos de Aceite', 'Política de Privacidade']) {
    const texto = document.querySelector('[role=region]');
    assert.equal(texto.getAttribute('aria-label'), titulo);
    assert.ok(texto.querySelector('h2'));
    assert.ok(texto.querySelector('p strong'));
    assert.doesNotMatch(texto.textContent, /<\/?(?:h2|p|strong)>/);
    assert.equal(document.activeElement, texto);
    const aceitar = document.querySelector('.leitura-documento .btn-primary');
    Object.defineProperties(texto, { clientHeight: { value: 200 }, scrollHeight: { value: 1000 } });
    await act(() => aceitar.click());
    assert.equal(aceitar.disabled, true);
    texto.scrollTop = 400;
    await act(() => texto.dispatchEvent(new window.Event('scroll', { bubbles: true })));
    assert.equal(aceitar.disabled, true);
    texto.scrollTop = 800;
    await act(() => texto.dispatchEvent(new window.Event('scroll', { bubbles: true })));
    assert.equal(aceitar.disabled, false);
    await act(async () => aceitar.click());
  }
  assert.deepEqual(alteracoes, [false, true]);
  assert.equal(checkbox.checked, true);
  assert.equal(document.querySelector('[role=region]'), null);
  await act(() => checkbox.click());
  assert.equal(checkbox.checked, false);
  assert.equal(alteracoes.at(-1), false);
});

test('documento indisponível bloqueia o aceite e permite tentar novamente', async () => {
  globalThis.fetch = async () => Response.json({ versao: '1.0', conteudo: '' });
  await act(() => raiz.render(createElement(AceiteDocumentos, { versaoTermos: '1.0', aceito: false, onAlterar() { assert.fail('Aceite indevido'); } })));
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent.startsWith('Política')).click());
  assert.match(document.querySelector('[role=alert]').textContent, /indisponível/);
  assert.equal(document.querySelector('.leitura-documento .btn-primary').disabled, true);
  globalThis.fetch = async () => Response.json({ versao: '1.0', conteudo: 'Documento válido' });
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Tentar novamente').click());
  assert.equal(document.querySelector('[role=alert]'), null);
  assert.equal(document.querySelector('[role=region]').textContent, 'Documento válido');
  assert.equal(document.querySelector('.leitura-documento .btn-primary').disabled, true);
});

test('termos de outra versão não podem ser aceitos', async () => {
  globalThis.fetch = async () => Response.json([{ versao: '2.0', conteudo: 'Novos termos' }]);
  await act(() => raiz.render(createElement(AceiteDocumentos, { versaoTermos: '1.0', aceito: false, onAlterar() { assert.fail('Aceite indevido'); } })));
  await act(async () => document.querySelector('input').click());
  assert.match(document.querySelector('[role=alert]').textContent, /Recarregue a página/);
  assert.equal(document.querySelector('.leitura-documento .btn-primary').disabled, true);
});

test('HTML legal preserva a formatação sem executar código nem aplicar estilos publicados', async () => {
  globalThis.fetch = async () => Response.json([{
    versao: '1.0',
    conteudo: '<!doctype html><html><head><title>Metadados</title><style>body { display: none }</style></head><body><h1 onclick="alert(1)">Termos</h1><p style="display:none">Leia &amp; aceite.</p><ul><li>Primeira regra</li></ul><script>alert("código oculto")</script><iframe src="https://example.com"></iframe><a href="javascript:alert(1)">Link inválido</a><a href="https://example.com" target="_blank">Link válido</a></body></html>'
  }]);
  await act(() => raiz.render(createElement(AceiteDocumentos, { versaoTermos: '1.0', aceito: false, onAlterar() { } })));
  await act(async () => document.querySelector('input').click());
  const texto = document.querySelector('[role=region]');
  assert.equal(texto.querySelector('h1').textContent, 'Termos');
  assert.equal(texto.querySelector('p').textContent, 'Leia & aceite.');
  assert.equal(texto.querySelector('ul li').textContent, 'Primeira regra');
  assert.equal(texto.querySelector('script, style, iframe, [onclick], [style], [target]'), null);
  assert.doesNotMatch(texto.textContent, /Metadados|código oculto|display: none/);
  const links = texto.querySelectorAll('a');
  assert.equal(links[0].hasAttribute('href'), false);
  assert.equal(links[1].getAttribute('href'), 'https://example.com');
  assert.equal(document.querySelector('.leitura-documento .btn-primary').disabled, true);
});

test('páginas de termos e privacidade exibem exatamente o mesmo documento formatado do aceite', async () => {
  const documentos = {
    termos: { versao: '1.0', conteudo: '<h1>Termos de Aceite</h1><p>Condições <strong>obrigatórias</strong>.</p><ol><li>Primeira condição</li></ol>' },
    privacidade: { versao: '2.0', conteudo: '<h1>Política de Privacidade</h1><p>Tratamento de <em>dados pessoais</em>.</p><ul><li>Seus direitos</li></ul>' }
  };
  globalThis.fetch = async (url) => String(url).includes('/privacidade/')
    ? Response.json(documentos.privacidade) : Response.json([documentos.termos]);
  for (const tipo of ['termos', 'privacidade']) {
    await act(() => raiz.render(createElement(AceiteDocumentos, { key: tipo, versaoTermos: '1.0', aceito: false, onAlterar() { } })));
    await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent.startsWith(tipo === 'termos' ? 'Termos' : 'Política')).click());
    const documentoNoAceite = document.querySelector('.conteudo-legal').outerHTML;
    await act(() => raiz.render(createElement(MemoryRouter, null, createElement(DocumentoLegal, { tipo, ...documentos[tipo] }))));
    assert.equal(document.querySelector('.conteudo-legal').outerHTML, documentoNoAceite);
    assert.equal(document.querySelector('iframe'), null);
  }
});
