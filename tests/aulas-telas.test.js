import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { JSDOM } from 'jsdom';
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

let servidor, contexto, telas, dom, raiz;
const fetchOriginal = globalThis.fetch;
const cursos = [
  { id: 1, titulo: 'React para web', descricao: 'Interfaces com React.', idTema: 8, nomeTema: 'Desenvolvimento', idArea: 8 },
  { id: 2, titulo: 'Banco de dados SQL', descricao: 'Consultas SQL.', idTema: 9, nomeTema: 'Meu tema novo' },
];
const modulos = [{ id: 3, idCurso: 1, titulo: 'Primeiros passos', descricao: 'Fundamentos do curso.', ordem: 1 }];
const aulas = [
  { id: 4, idModulo: 3, titulo: 'Introdução', descricao: 'Conheça o curso.', ordem: 1, youtubeVideoId: 'abcdefghijk', ativo: true },
  { id: 5, idModulo: 3, titulo: 'Componentes', descricao: 'Seu primeiro componente.', ordem: 2, youtubeVideoId: 'abcdefghijk', ativo: true },
];

const avaliacaoAluno = { id: 1, titulo: 'Diagnóstico do curso', versao: 1, perguntas: [{ enunciado: 'Qual alternativa?', alternativas: ['Correta', 'Incorreta'] }], resultado: null };
const avaliacaoGestor = { ...avaliacaoAluno, publicado: true, perguntas: [{ ...avaliacaoAluno.perguntas[0], alternativaCorreta: 0, explicacao: 'Entenda o conceito.', idAulaRevisao: 4 }] };

before(async () => {
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  contexto = (await servidor.ssrLoadModule('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
  telas = {};
  for (const nome of ['PaginaCatalogo', 'PaginaGestaoCursos', 'PaginaAulasAdministrador', 'PaginaCursoAluno', 'PaginaAulaAluno', 'PaginaQuestionarioAluno', 'PaginaEditorQuestionario']) {
    telas[nome] = (await servidor.ssrLoadModule(`/src/componentes/aulas/${nome}.jsx`)).default;
  }
});
after(async () => { await servidor?.close(); });
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.YT = { Player: class { destroy() {} }, PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 } };
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname.replace(/^\/api/, '');
    let dados;
    if (path === '/catalogo/temas') dados = [{ id: 8, nome: 'Desenvolvimento' }, { id: 9, nome: 'Meu tema novo' }];
    else if (path.endsWith('/plano')) dados = { avaliacoes: [], revisoes: [] };
    else if (path.endsWith('/diagnostico') || path.endsWith('/questionario')) dados = path.startsWith('/aluno') ? avaliacaoAluno : avaliacaoGestor;
    else if (/\/progresso$/.test(path)) dados = { posicaoSegundos: 0, concluida: path.includes('/4/') };
    else if (/\/matriculas$/.test(path)) dados = [{ idCurso: 1 }];
    else if (/\/cursos$/.test(path)) dados = cursos;
    else if (/\/cursos\/1$/.test(path)) dados = cursos[0];
    else if (/\/cursos\/1\/modulos$/.test(path)) dados = modulos;
    else if (/\/modulos\/3$/.test(path)) dados = modulos[0];
    else if (/\/modulos\/3\/aulas$/.test(path)) dados = aulas;
    else if (/\/aulas\/4$/.test(path)) dados = aulas[0];
    else throw new Error(`Endpoint inesperado: ${path}`);
    return new Response(JSON.stringify(dados), { status: 200 });
  };
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close();
  globalThis.fetch = fetchOriginal;
  for (const nome of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[nome];
});

async function renderizar(tela, perfil, caminho, rota = caminho) {
  await act(async () => {
    raiz.render(h(contexto.Provider, { value: { autenticado: Boolean(perfil), sessao: { perfil } } },
      h(MemoryRouter, { initialEntries: [caminho] }, h(Routes, null, h(Route, { path: rota, element: h(telas[tela]) })))));
  });
  assert.ok(document.querySelector('.page-header .page-title'));
  assert.equal(document.querySelector('[role="alert"]'), null);
}

for (const [perfil, tela, caminho] of [
  [null, 'PaginaCatalogo', '/cursos'],
  ['ALUNO', 'PaginaCatalogo', '/aluno/cursos'],
  ['PROFESSOR', 'PaginaGestaoCursos', '/professor/cursos'],
  ['ADMINISTRADOR', 'PaginaAulasAdministrador', '/administracao/cursos'],
]) {
  test(`catálogo de ${perfil ?? 'visitante'} compartilha temas, filtra e restaura cursos`, async () => {
    await renderizar(tela, perfil, caminho);
    assert.equal(document.querySelector('.catalogo-temas'), null);
    assert.equal(document.querySelectorAll('.aulas-cartao').length, 2);
    assert.equal(document.querySelector('.aulas-cartao .content-text'), null);
    assert.equal(document.querySelector('.aulas-cartao img'), null);
    assert.equal(document.querySelector('.aulas-cartao .aulas-etiqueta'), null);
    assert.equal(document.querySelector('.aulas-icone'), null);
    const filtro = document.querySelector('.aulas-filtro-tema select');
    assert.match(filtro.textContent, /Meu tema novo/);
    await act(async () => { filtro.value = '9'; filtro.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    assert.equal(document.querySelectorAll('.aulas-cartao').length, 1);
    assert.match(document.querySelector('.aulas-cartao').textContent, /SQL/);
    assert.equal(document.querySelector('.aulas-icone'), null);
    await act(async () => { filtro.value = ''; filtro.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    assert.equal(document.querySelectorAll('.aulas-cartao').length, 2);
  });
}

test('professor navega por módulos, aulas e abre formulário de edição', async () => {
  await renderizar('PaginaGestaoCursos', 'PROFESSOR', '/professor/cursos/1/modulos', '/professor/cursos/:idCurso/modulos');
  assert.match(document.querySelector('h1').textContent, /React/);
  assert.equal(document.querySelector('a[href="/professor/cursos/1/modulos/3/aulas"]').textContent, 'Ver aulas');
  await act(async () => [...document.querySelectorAll('button')].find((el) => el.textContent === 'Editar').click());
  assert.ok(document.querySelector('.aulas-editor'));
  assert.equal(document.querySelector('#conteudo-titulo').value, 'Primeiros passos');
});

test('professor recebe cards de aulas com edição e vídeo original', async () => {
  await renderizar('PaginaGestaoCursos', 'PROFESSOR', '/professor/cursos/1/modulos/3/aulas', '/professor/cursos/:idCurso/modulos/:idModulo/aulas');
  assert.equal(document.querySelectorAll('.aulas-cartao').length, 2);
  assert.equal(document.querySelector('.aulas-cartao-midia'), null);
  assert.ok(document.querySelector('a[href="https://www.youtube.com/watch?v=abcdefghijk"]'));
  await act(async () => [...document.querySelectorAll('button')].find(el => el.textContent === 'Editar').click());
  assert.equal(document.querySelector('#conteudo-imagem'), null);
});

for (const [perfil, tela, caminho, rota] of [
  ['ALUNO', 'PaginaCursoAluno', '/aluno/cursos/1', '/aluno/cursos/:idCurso'],
  ['ADMINISTRADOR', 'PaginaAulasAdministrador', '/administracao/cursos/1', '/administracao/cursos/:idCurso'],
  ['PROFESSOR', 'PaginaGestaoCursos', '/professor/cursos/1/modulos', '/professor/cursos/:idCurso/modulos'],
]) test(`${perfil} abre e fecha módulo preservando conteúdo e ações`, async () => {
  await renderizar(tela, perfil, caminho, rota);
  const modulo = document.querySelector('details.aulas-modulo');
  const conteudo = modulo.querySelector('.aulas-modulo-conteudo');
  const texto = conteudo.textContent;
  const links = [...conteudo.querySelectorAll('a')].map(link => link.href);
  assert.equal(modulo.open, false);
  assert.match(texto, /Fundamentos do curso/);
  await act(async () => modulo.querySelector('summary').click());
  assert.equal(modulo.open, true);
  await act(async () => modulo.querySelector('summary').click());
  assert.equal(modulo.open, false);
  assert.equal(modulo.querySelector('.aulas-modulo-conteudo'), conteudo);
  assert.equal(conteudo.textContent, texto);
  assert.deepEqual([...conteudo.querySelectorAll('a')].map(link => link.href), links);
});

test('aluno vê progresso calculado e links das aulas do curso', async () => {
  await renderizar('PaginaCursoAluno', 'ALUNO', '/aluno/cursos/1', '/aluno/cursos/:idCurso');
  assert.equal(document.querySelector('progress').value, 50);
  assert.equal(document.querySelectorAll('.aulas-linha').length, 2);
  assert.ok(document.querySelector('a[href="/aluno/cursos/1/aulas/4"]'));
});

test('aluno recebe sala com trilha do módulo e navegação preservada', async () => {
  await renderizar('PaginaAulaAluno', 'ALUNO', '/aluno/cursos/1/aulas/4', '/aluno/cursos/:idCurso/aulas/:idAula');
  assert.equal(document.querySelectorAll('.aulas-sala-trilha nav a').length, 2);
  assert.equal(document.querySelector('[aria-current="page"]').textContent.trim(), 'Aula 1Introdução');
  assert.ok(document.querySelector('.aulas-sala-player'));
  assert.ok([...document.querySelectorAll('button')].find((el) => el.textContent === 'Aula concluída').disabled);
});

test('administrador mantém módulos, visualização e ações de aula', async () => {
  await renderizar('PaginaAulasAdministrador', 'ADMINISTRADOR', '/administracao/cursos/1', '/administracao/cursos/:idCurso');
  assert.equal(document.querySelectorAll('.aulas-modulo').length, 1);
  assert.equal(document.querySelectorAll('.aulas-linha').length, 2);
  assert.ok(document.querySelector('a[href="/administracao/cursos/1/aulas/4"]'));
  assert.ok([...document.querySelectorAll('button')].find((el) => el.textContent === 'Arquivar aula'));
});

test('administrador visualiza aula individual no mesmo padrão', async () => {
  await renderizar('PaginaAulasAdministrador', 'ADMINISTRADOR', '/administracao/cursos/1/aulas/4', '/administracao/cursos/:idCurso/aulas/:idAula');
  assert.match(document.querySelector('h1').textContent, /Introdução/);
  assert.ok(document.querySelector('.aulas-sala-player'));
  assert.ok([...document.querySelectorAll('button')].find((el) => el.textContent === 'Editar aula'));
});

for (const [perfil, tela, caminho, botao, endpoint] of [
  ['PROFESSOR', 'PaginaGestaoCursos', '/professor/cursos', 'Editar', '/api/cursos/1'],
  ['ADMINISTRADOR', 'PaginaAulasAdministrador', '/administracao/cursos', 'Editar curso', '/api/administracao/cursos/1'],
]) {
  test(`${perfil} edita e salva o tema e ícone escolhidos manualmente`, async () => {
    const fetchSucesso = globalThis.fetch;
    let enviados;
    globalThis.fetch = async (url, opcoes) => {
      if (url.endsWith(endpoint) && opcoes.method === 'PUT') {
        enviados = JSON.parse(opcoes.body);
        return new Response(JSON.stringify({ ...cursos[0], ...enviados }), { status: 200 });
      }
      return fetchSucesso(url, opcoes);
    };
    await renderizar(tela, perfil, caminho);
    await act(async () => [...document.querySelectorAll('button')].find((el) => el.textContent === botao).click());
    const tema = document.querySelector('.aulas-editor .aulas-filtro-tema select');
    assert.equal(document.querySelector('#curso-icone'), null);
    assert.equal(tema.value, '8');
    await act(async () => {
      tema.value = '9'; tema.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await act(async () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    assert.deepEqual(enviados, { titulo: cursos[0].titulo, descricao: cursos[0].descricao, idTema: 9, idArea: 8 });
    assert.equal(document.querySelector('.aulas-editor'), null);
  });
}

test('administrador exclui curso somente depois da confirmação', async () => {
  const fetchSucesso = globalThis.fetch;
  let excluiu = false;
  globalThis.fetch = async (url, opcoes) => {
    if (url.endsWith('/api/administracao/cursos/1') && opcoes.method === 'DELETE') {
      excluiu = true;
      return new Response(null, { status: 204 });
    }
    if (excluiu && url.endsWith('/api/administracao/cursos')) return new Response(JSON.stringify([cursos[1]]), { status: 200 });
    return fetchSucesso(url, opcoes);
  };
  await renderizar('PaginaAulasAdministrador', 'ADMINISTRADOR', '/administracao/cursos');
  await act(async () => [...document.querySelectorAll('button')].find((el) => el.textContent === 'Excluir curso').click());
  assert.equal(excluiu, false);
  assert.match(document.querySelector('[role="dialog"]').textContent, /inativado/);
  await act(async () => [...document.querySelectorAll('[role="dialog"] button')].find((el) => el.textContent === 'Confirmar').click());
  assert.equal(excluiu, true);
  assert.equal(document.querySelectorAll('.aulas-cartao').length, 1);
});

test('o catálogo mantém somente a busca e os temas cadastrados como filtros', async () => {
  await renderizar('PaginaCatalogo', 'ALUNO', '/aluno/cursos?area=8', '/aluno/cursos');
  assert.equal(document.querySelectorAll('.aulas-cartao').length, 2);
  assert.equal(document.querySelectorAll('select').length, 1);
  assert.match(document.querySelector('select').textContent, /Todos os temas/);
});

test('questionário exibe correção e links de revisão recebidos do backend e permite refazer', async () => {
  const fetchSucesso = globalThis.fetch;
  let enviados;
  globalThis.fetch = async (url, opcoes) => {
    if (url.endsWith('/diagnostico/respostas')) {
      enviados = JSON.parse(opcoes.body);
      return new Response(JSON.stringify({ acertos: 0, total: 1, percentual: 0, correcoes: [{ pergunta: 0, acertou: false, alternativaCorreta: 0, explicacao: 'Entenda o conceito.' }], revisoes: [{ idAula: 4, titulo: 'Introdução', idModulo: 3 }] }), { status: 200 });
    }
    return fetchSucesso(url, opcoes);
  };
  await renderizar('PaginaQuestionarioAluno', 'ALUNO', '/aluno/cursos/1/diagnostico', '/aluno/cursos/:idCurso/diagnostico');
  assert.equal(document.querySelector('.avaliacao-correcoes'), null);
  await act(async () => document.querySelector('input[value="1"]').click());
  await act(async () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
  assert.deepEqual(enviados, { versao: 1, respostas: [1] });
  assert.match(document.querySelector('.avaliacao-resultado').textContent, /Vale revisar/);
  assert.ok(document.querySelector('a[href="/aluno/cursos/1/aulas/4"]'));
  await act(async () => [...document.querySelectorAll('button')].find((el) => el.textContent === 'Refazer avaliação').click());
  assert.equal(document.querySelector('input:checked'), null);
});

test('plano do curso apresenta diagnóstico, questionários e revisões com links corretos', async () => {
  const fetchSucesso = globalThis.fetch;
  globalThis.fetch = async (url, opcoes) => url.endsWith('/plano') ? new Response(JSON.stringify({ avaliacoes: [{ idModulo: null, titulo: 'Diagnóstico inicial', percentual: 50 }, { idModulo: 3, titulo: 'Módulo 1', percentual: null }], revisoes: [{ idAula: 4, titulo: 'Introdução' }] }), { status: 200 }) : fetchSucesso(url, opcoes);
  await renderizar('PaginaCursoAluno', 'ALUNO', '/aluno/cursos/1', '/aluno/cursos/:idCurso');
  assert.ok(document.querySelector('a[href="/aluno/cursos/1/diagnostico"]'));
  assert.ok(document.querySelector('a[href="/aluno/cursos/1/modulos/3/questionario"]'));
  assert.match(document.querySelector('.plano-estudos').textContent, /50% de acertos/);
});

for (const [perfil, raizRota] of [['PROFESSOR', 'professor'], ['ADMINISTRADOR', 'administracao']]) {
  test(`${perfil} edita e publica avaliação vinculada a uma aula do curso`, async () => {
    const fetchSucesso = globalThis.fetch;
    let enviados;
    globalThis.fetch = async (url, opcoes) => {
      if (url.endsWith(`/${raizRota}/cursos/1/diagnostico`) && opcoes.method === 'PUT') {
        enviados = JSON.parse(opcoes.body);
        return new Response(JSON.stringify({ ...enviados, versao: 2 }), { status: 200 });
      }
      return fetchSucesso(url, opcoes);
    };
    await renderizar('PaginaEditorQuestionario', perfil, `/${raizRota}/cursos/1/diagnostico`, `/${raizRota}/cursos/:idCurso/diagnostico`);
    assert.equal(document.querySelector('#revisao-0').value, '4');
    await act(async () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(enviados.publicado, true);
    assert.equal(enviados.perguntas[0].idAulaRevisao, 4);
    assert.equal(enviados.perguntas[0].alternativaCorreta, 0);
    assert.match(document.querySelector('[role="status"]').textContent, /Versão 2/);
  });
}
