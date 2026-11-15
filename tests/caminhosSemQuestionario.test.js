import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

let servidor, Roadmap, Gestao, Contexto, controleSessao, dom, raiz;
const fetchOriginal = globalThis.fetch;
const questionario = {
  id: 7, titulo: 'Descubra sua area', descricao: 'Explore as possibilidades', publicado: true,
  versao: 2, perguntaInicial: 'p1',
  perguntas: [
    { chave: 'p1', enunciado: 'Qual caminho prefere?', opcoes: [
      { texto: 'Explorar interfaces', proximaPergunta: 'p2', resultado: null },
      { texto: 'Explorar servidores', proximaPergunta: null, resultado: 'backend' },
    ] },
    { chave: 'p2', enunciado: 'Qual interface prefere?', opcoes: [
      { texto: 'Navegadores', proximaPergunta: null, resultado: 'frontend' },
      { texto: 'APIs', proximaPergunta: null, resultado: 'backend' },
    ] },
  ],
  resultados: [
    { chave: 'backend', titulo: 'Desenvolvimento backend', orientacao: 'Explore APIs e dados.', temasPesquisa: ['Java', 'SQL'] },
    { chave: 'frontend', titulo: 'Desenvolvimento frontend', orientacao: 'Explore interfaces.', temasPesquisa: ['HTML', 'React'] },
  ],
};
const secoes = [{ id: 1, titulo: 'Backend', conteudo: 'Conheça servidores.', ordem: 1, publicado: true }];
const resumo = { id: 7, titulo: questionario.titulo, descricao: questionario.descricao, publicado: true, versao: 2 };
function resultado(respostas = [{ pergunta: 'p1', opcao: 1 }], salvo = false) {
  return { versao: 2, respostas, resultado: questionario.resultados[0], atualizadoEm: salvo ? '2026-11-15T10:00:00' : null };
}
before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Roadmap = (await servidor.ssrLoadModule('/src/componentes/aulas/PaginaRoadmap.jsx')).default;
  Gestao = (await servidor.ssrLoadModule('/src/componentes/aulas/PaginaAdministracaoCaminhos.jsx')).default;
  Contexto = (await servidor.ssrLoadModule('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
  controleSessao = (await servidor.ssrLoadModule('/src/servicos/sessaoNavegador.js')).controleSessao;
});
after(async () => { await servidor?.close(); });
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  controleSessao.encerrar();
  dom.window.close();
  globalThis.fetch = fetchOriginal;
  for (const chave of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[chave];
});
function montarApi(interceptar = () => undefined) {
  const chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    const caminho = new URL(url).pathname.replace(/^\/api/, '');
    const chamada = { caminho, metodo: opcoes.method ?? 'GET', opcoes };
    chamadas.push(chamada);
    const resposta = await interceptar(chamada);
    if (resposta !== undefined) return resposta;
    if (caminho === '/catalogo/roadmap' || caminho === '/administracao/caminhos') return Response.json({ questionarios: [resumo], secoes });
    if (caminho === '/catalogo/roadmap/questionarios/7') return Response.json({ ...questionario, resultados: [] });
    if (caminho === '/administracao/caminhos/questionarios/7') return Response.json(questionario);
    if (caminho === '/aluno/roadmap/questionarios/7/resultado' && chamada.metodo === 'GET') return Response.json(null);
    throw new Error('Chamada inesperada: ' + chamada.metodo + ' ' + caminho);
  };
  return chamadas;
}
async function renderizar(Componente, perfil = null) {
  const sessao = perfil ? { idUsuario: 12, perfil } : null;
  if (perfil) {
    const token = 'cabecalho.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.assinatura';
    controleSessao.iniciar({ ...sessao, token });
  }
  await act(async () => raiz.render(createElement(MemoryRouter, null,
    createElement(Contexto.Provider, { value: { autenticado: Boolean(perfil), sessao } }, createElement(Componente)))));
}
function botao(texto) {
  const encontrado = [...document.querySelectorAll('button')].find(item => item.textContent === texto);
  assert.ok(encontrado, 'Botao ausente: ' + texto);
  return encontrado;
}
async function clicar(texto) { await act(async () => botao(texto).click()); }
async function escolher(indice) {
  const alternativa = document.querySelectorAll('.caminhos-etapa input[type="radio"]')[indice];
  assert.ok(alternativa);
  await act(async () => alternativa.click());
  const confirmar = [...document.querySelectorAll('.caminhos-etapa button')].find(item => ['Continuar', 'Revisar respostas'].includes(item.textContent));
  assert.ok(confirmar);
  await act(async () => confirmar.click());
}

test('pagina publica carrega questionario e preserva secoes e diagrama', async () => {
  const chamadas = montarApi();
  await renderizar(Roadmap);
  assert.deepEqual(chamadas.map(item => item.caminho), ['/catalogo/roadmap', '/catalogo/roadmap/questionarios/7']);
  assert.match(document.querySelector('details').textContent, /Backend.*Conheça servidores/);
  assert.ok(document.querySelector('img[src="/imagens/roadmap-fullstack.png"]'));
  assert.match(document.querySelector('.caminhos-etapas').textContent, /Qual caminho prefere/);
  assert.equal(document.querySelector('[role="alert"]'), null);
});

test('gestao preserva secoes e formulario de edicao junto com a aba de questionarios', async () => {
  montarApi();
  await renderizar(Gestao, 'ADMINISTRADOR');
  assert.ok(botao('Criar questionário'));
  await clicar('Seções explicativas');
  await clicar('Editar');
  assert.equal(document.getElementById('secao-titulo').value, 'Backend');
  assert.equal(document.getElementById('secao-conteudo').value, 'Conheça servidores.');
  assert.equal(document.getElementById('secao-ordem').value, '1');
});

test('visitante corrige ramificacao e calcula resultado sem enviar autenticacao ou respostas descartadas', async () => {
  const chamadas = montarApi(({ caminho, metodo, opcoes }) => {
    if (caminho.endsWith('/resultado') && metodo === 'POST') return Response.json(resultado(JSON.parse(opcoes.body).respostas));
  });
  await renderizar(Roadmap);
  await escolher(0);
  assert.match(document.body.textContent, /Qual interface prefere/);
  await escolher(0);
  await clicar('Corrigir resposta 1');
  await escolher(1);
  await clicar('Finalizar e ver resultado');
  const envio = chamadas.find(item => item.metodo === 'POST');
  assert.equal(envio.caminho, '/catalogo/roadmap/questionarios/7/resultado');
  assert.equal(envio.opcoes.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(envio.opcoes.body), { versao: 2, respostas: [{ pergunta: 'p1', opcao: 1 }] });
  assert.match(document.querySelector('.caminhos-resultado').textContent, /Desenvolvimento backend.*Java, SQL/);
  assert.equal(document.querySelector('.caminhos-resultado a').getAttribute('href'), '/cursos');
  await clicar('Refazer questionário');
  assert.match(document.body.textContent, /Qual caminho prefere/);
});

test('aluno recupera resultado salvo pela rota pessoal', async () => {
  const chamadas = montarApi(({ caminho, metodo }) => {
    if (caminho.startsWith('/aluno/') && metodo === 'GET') return Response.json(resultado(undefined, true));
  });
  await renderizar(Roadmap, 'ALUNO');
  const consulta = chamadas.find(item => item.caminho.startsWith('/aluno/'));
  assert.equal(consulta.caminho, '/aluno/roadmap/questionarios/7/resultado');
  assert.match(consulta.opcoes.headers.Authorization, /^Bearer /);
  assert.match(document.querySelector('.caminhos-resultado').textContent, /Desenvolvimento backend/);
  assert.equal(document.querySelector('.caminhos-resultado a').getAttribute('href'), '/aluno/cursos');
});

test('aluno envia escolhas e versao para persistencia autenticada', async () => {
  const chamadas = montarApi(({ caminho, metodo, opcoes }) => {
    if (caminho.startsWith('/aluno/') && metodo === 'POST') return Response.json(resultado(JSON.parse(opcoes.body).respostas, true));
  });
  await renderizar(Roadmap, 'ALUNO');
  await escolher(1);
  await clicar('Finalizar e ver resultado');
  const envio = chamadas.find(item => item.metodo === 'POST');
  assert.equal(envio.caminho, '/aluno/roadmap/questionarios/7/resultado');
  assert.match(envio.opcoes.headers.Authorization, /^Bearer /);
  assert.deepEqual(JSON.parse(envio.opcoes.body), { versao: 2, respostas: [{ pergunta: 'p1', opcao: 1 }] });
  assert.ok(document.querySelector('.caminhos-resultado'));
});

test('conflito de versao permite recarregar o questionario sem perder a pagina', async () => {
  const chamadas = montarApi(({ metodo }) => {
    if (metodo === 'POST') return Response.json({ erro: 'O questionario foi atualizado', codigo: 'OPERACAO_RECUSADA' }, { status: 409 });
  });
  await renderizar(Roadmap);
  await escolher(1);
  await clicar('Finalizar e ver resultado');
  assert.match(document.querySelector('[role="alert"]').textContent, /alterados/);
  await clicar('Recarregar questionário');
  assert.equal(chamadas.filter(item => item.caminho === '/catalogo/roadmap/questionarios/7').length, 2);
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.match(document.body.textContent, /Qual caminho prefere/);
});

test('administrador edita questionario com versao e pode abrir nova criacao sem apagar conteudo', async () => {
  const chamadas = montarApi(({ caminho, metodo }) => {
    if (caminho === '/administracao/caminhos/questionarios/7' && metodo === 'PUT') return Response.json({ ...questionario, versao: 3 });
  });
  await renderizar(Gestao, 'ADMINISTRADOR');
  await clicar('Editar');
  assert.equal(document.getElementById('caminhos-titulo').value, questionario.titulo);
  assert.equal(document.querySelectorAll('.editor-caminhos-opcao').length, 4);
  await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  const envio = chamadas.find(item => item.metodo === 'PUT');
  assert.equal(envio.caminho, '/administracao/caminhos/questionarios/7');
  assert.match(envio.opcoes.headers.Authorization, /^Bearer /);
  const dados = JSON.parse(envio.opcoes.body);
  assert.equal(dados.versao, 2);
  assert.equal(dados.perguntaInicial, 'p1');
  assert.equal(dados.perguntas[0].opcoes[0].proximaPergunta, 'p2');
  assert.deepEqual(dados.resultados, questionario.resultados);
  assert.match(document.querySelector('[role="status"]').textContent, /Questionário salvo/);
  await clicar('Criar questionário');
  assert.equal(document.getElementById('caminhos-titulo').value, '');
  assert.ok(botao('Adicionar pergunta'));
  assert.ok(botao('Adicionar resultado'));
  assert.equal(chamadas.some(item => item.metodo === 'DELETE'), false);
});
