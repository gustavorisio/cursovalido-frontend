import { test, beforeAll, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement, act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let Formulario, Convite, AceiteDocumentos, DocumentoLegal, servico, Suporte, suporteServico, dom, raiz, anteriorFetch;
beforeAll(async () => {
  Formulario = (await import('/src/componentes/autenticacao/FormularioCadastro.jsx')).default;
  Convite = (await import('/src/paginas/CadastroConvite.jsx')).default;
  AceiteDocumentos = (await import('/src/componentes/comuns/AceiteDocumentos.jsx')).default;
  DocumentoLegal = (await import('/src/componentes/comuns/DocumentoLegal.jsx')).default;
  servico = await import('/src/servicos/servicoAutenticacao.js');
  Suporte = (await import('/src/componentes/suporte/PaginaSuporte.jsx')).default;
  suporteServico = await import('/src/componentes/suporte/servicoSuporte.js');
});

beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
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
  const props = { dados: { nomeCompleto: '', email: '', senha: '', confirmacaoSenha: '', dataNascimento: '', declarouMaiorIdade: false, aceitouTermosLgpd: false }, idade: 0, carregando: false, formularioValido: false, onAlterar: () => { }, onEnviar: () => { } };
  await act(() => raiz.render(createElement(MemoryRouter, null, createElement(Formulario, props))));
  assert.doesNotMatch(document.body.textContent, /telefone/i);
  assert.deepEqual([...document.querySelectorAll('input')].map(input => input.type), ['text', 'email', 'password', 'password', 'date', 'checkbox', 'checkbox']);
  assert.match(document.body.textContent, /18 anos ou mais/);
  assert.equal(document.querySelector('button[type=submit], button:not([type])').disabled, true);
});

test('cadastro por convite nao solicita telefone e mantem maioridade', async () => {
  globalThis.fetch = async (url) => String(url).includes('/convites/consultar') ? Response.json({ perfil: 'PROFESSOR', email: 'convidado@example.com' }) : String(url).includes('confirmar-email') ? new Response(null, { status: 204 }) : Response.json([{ nome: 'Termos', versao: '1.0', conteudo: 'Termos' }]);
  await act(async () => raiz.render(createElement(MemoryRouter, { initialEntries: ['/convites/cadastro?token=teste'] }, createElement(Convite))));
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmar meu e-mail').click());
  assert.ok(document.querySelector('form'));
  assert.doesNotMatch(document.querySelector('form').textContent, /telefone/i);
  assert.match(document.querySelector('form').textContent, /18 anos ou mais/);
  assert.deepEqual([...document.querySelectorAll('form input')].map(input => input.type), ['text', 'email', 'password', 'password', 'date', 'checkbox', 'checkbox']);
  assert.equal(document.querySelector('form button:not([type])').disabled, true);
});

test('contratos dos dois cadastros nao enviam telefone mesmo em dados legados', async () => {
  const enviados = [];
  globalThis.fetch = async (_url, options) => { enviados.push(JSON.parse(options.body)); return new Response(null, { status: 204 }); };
  const dados = { nomeCompleto: 'Aluno', email: 'aluno@example.com', senha: 'SenhaTeste123!', confirmacaoSenha: 'SenhaTeste123!', dataNascimento: '1990-01-01', telefone: '11999999999', declarouMaiorIdade: true, aceitouTermosLgpd: true, versaoTermos: '1.0' };
  await servico.cadastrarUsuario(dados);
  await servico.completarCadastroConvite('teste', dados);
  for (const envio of [enviados[0], enviados[1].cadastro]) {
    assert.equal(Object.hasOwn(envio, 'telefone'), false);
    assert.deepEqual(envio, { nomeCompleto: dados.nomeCompleto, email: dados.email, senha: dados.senha, confirmacaoSenha: dados.confirmacaoSenha, dataNascimento: dados.dataNascimento, declarouMaiorIdade: true, aceitouTermosLgpd: true, versaoTermos: dados.versaoTermos });
  }
});

test('aceite abre ambos os documentos e permite aceitar sem rolagem', async () => {
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
  assert.equal(document.querySelector('.aceite-documentos button'), null);
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
    assert.ok(document.querySelector('dialog.leitura-documento[open]'));
    const aceitar = document.querySelector('.leitura-documento .btn-primary');
    assert.equal(texto.scrollTop, 0);
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
  await act(async () => document.querySelector('input').click());
  assert.match(document.querySelector('[role=alert]').textContent, /indisponíve(?:l|is)/);
  assert.equal(document.querySelector('.leitura-documento .btn-primary').disabled, true);
  globalThis.fetch = async () => Response.json({ versao: '1.0', conteudo: 'Documento válido' });
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Tentar novamente').click());
  assert.equal(document.querySelector('[role=alert]'), null);
  assert.equal(document.querySelector('[role=region]').textContent, 'Documento válido');
  assert.equal(document.querySelector('.leitura-documento .btn-primary').disabled, false);
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
  assert.equal(document.querySelector('.leitura-documento .btn-primary').disabled, false);
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
    await act(async () => document.querySelector('input').click());
    if (tipo === 'privacidade') await act(async () => document.querySelector('dialog .btn-primary').click());
    const documentoNoAceite = document.querySelector('.conteudo-legal').outerHTML;
    await act(() => raiz.render(createElement(MemoryRouter, null, createElement(DocumentoLegal, { tipo, ...documentos[tipo] }))));
    assert.equal(document.querySelector('.conteudo-legal').outerHTML, documentoNoAceite);
    assert.equal(document.querySelector('iframe'), null);
  }
});


test('alternar documentos repetidamente mantém a página e reutiliza o conteúdo', async () => {
  let chamadas = 0;
  globalThis.fetch = async () => { chamadas++; return Response.json({versao: '2.0', conteudo: 'Política atual'}); };
  await act(() => raiz.render(createElement(MemoryRouter, {initialEntries: ['/termos-aceite.html']},
    createElement(DocumentoLegal, {tipo: 'termos', versao: '1.0', conteudo: 'Termos atuais'}))));
  const alternar = () => document.querySelectorAll('.documento-navegacao button')[1].click();
  await act(async () => { for(let i=0;i<30;i++) alternar(); });
  assert.equal(chamadas, 1);
  assert.equal(document.querySelector('main h1').textContent, 'Política de Privacidade');
  for(let i=0;i<50;i++) await act(async () => alternar());
  assert.equal(chamadas, 1);
  assert.equal(document.querySelector('.documento-navegacao a'), null);
  assert.equal(document.querySelectorAll('main').length, 1);
});

test('reabrir leituras no mesmo formulário não repete requisições', async () => {
  const chamadas = [];
  globalThis.fetch = async url => { chamadas.push(String(url)); return String(url).includes('/privacidade/')
    ? Response.json({versao: '2.0', conteudo: 'Privacidade'})
    : Response.json([{versao: '1.0', conteudo: 'Termos'}]); };
  await act(() => raiz.render(createElement(AceiteDocumentos, {versaoTermos:'1.0', aceito:false, onAlterar(){}})));
  await act(async () => document.querySelector('input').click());
  await act(async () => document.querySelector('dialog .btn-primary').click());
  for (let i = 0; i < 3; i++) {
    await act(async () => document.querySelector('dialog .btn-secondary').click());
    await act(async () => document.querySelector('input').click());
    assert.equal(document.querySelector('dialog h3').textContent, 'Política de Privacidade');
  }
  assert.equal(chamadas.length, 2);
});


test('suporte usa somente o email da conta e não envia contato legado', async () => {
  await act(() => raiz.render(createElement(MemoryRouter, null, createElement(Suporte))));
  assert.equal(document.querySelector('#emailContato'), null);
  assert.ok(document.querySelector('#emailConta'));
  const enviados=[];
  globalThis.fetch=async (_url, opcoes)=>{enviados.push(JSON.parse(opcoes.body));return Response.json({protocolo:'teste'});};
  await suporteServico.enviarSolicitacao({emailConta:'conta@example.com',emailContato:'legado@example.com',usuario:'Maria',motivo:'OUTROS',assunto:'Teste',descricao:'Descrição para suporte'});
  assert.equal(enviados[0].emailConta, 'conta@example.com');
  assert.equal(Object.hasOwn(enviados[0], 'emailContato'), false);
});
