import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { JSDOM } from 'jsdom';
import { createElement as h, act } from 'react';
import { MemoryRouter } from 'react-router-dom';

let servidor, Contexto, Pagina, Cabecalho, dom, raiz, chamadas, createRoot;
const fetchOriginal = globalThis.fetch;
const eventoOriginal = globalThis.Event;
const comunicado = { id: 7, titulo: 'Manutenção programada', conteudo: 'Conteúdo do comunicado.\nSegunda linha.', criadoEm: '2026-11-15T12:00:00', lida: false };
const pagina = { itens: [comunicado], pagina: 0, totalPaginas: 1, totalElementos: 1, naoLidas: 1 };

before(async () => {
  const inicial = new JSDOM('<div></div>');
  globalThis.window = inicial.window; globalThis.document = inicial.window.document;
  ({ createRoot } = await import('react-dom/client'));
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Contexto = (await servidor.ssrLoadModule('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
  Pagina = (await servidor.ssrLoadModule('/src/componentes/notificacoes/PaginaNotificacoes.jsx')).default;
  Cabecalho = (await servidor.ssrLoadModule('/src/componentes/comuns/Cabecalho.jsx')).default;
  inicial.window.close();
});
after(async () => { await servidor.close(); });
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  raiz = createRoot(document.getElementById('root'));
  chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    const rota = new URL(url).pathname.replace('/api', '');
    chamadas.push({ rota, opcoes, url: String(url) });
    if (rota.endsWith('/nao-lidas')) return Response.json({ quantidade: 1 });
    if (rota.includes('/restricoes')) return Response.json([]);
    if (opcoes.method === 'PUT') return new Response(null, { status: 204 });
    if (opcoes.method === 'POST') return Response.json(comunicado, { status: 201 });
    return Response.json(pagina);
  };
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close();
  globalThis.fetch = fetchOriginal;
  globalThis.Event = eventoOriginal;
  for (const nome of ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[nome];
});

async function renderizar(perfil = 'ALUNO', cabecalho = false, id = 1) {
  await act(async () => raiz.render(h(MemoryRouter, null, h(Contexto.Provider, { value: { autenticado: Boolean(perfil), sessao: perfil ? { idUsuario: id, perfil } : null } },
    cabecalho ? h(Cabecalho) : h(Pagina, { administrador: perfil === 'ADMINISTRADOR' })))));
}

async function preencher(id, valor) {
  const campo = document.getElementById(id);
  const prototipo = campo.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  await act(() => {
    Object.getOwnPropertyDescriptor(prototipo, 'value').set.call(campo, valor);
    campo.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

for (const perfil of [null, 'ALUNO', 'PROFESSOR', 'ADMINISTRADOR']) {
  test(`sino de notificações aparece somente para aluno: ${perfil ?? 'visitante'}`, async () => {
    await renderizar(perfil, true);
    assert.equal(Boolean(document.querySelector('.notificacoes-sino')), perfil === 'ALUNO');
    assert.equal(chamadas.some(item => item.rota.endsWith('/nao-lidas')), perfil === 'ALUNO');
    if (perfil === 'ALUNO') {
      assert.match(document.querySelector('.notificacoes-sino').getAttribute('aria-label'), /1 não lida/);
      assert.equal(document.querySelector('.notificacoes-sino').getAttribute('href'), '/aluno/notificacoes');
    }
  });
}

test('admin publica apenas título e conteúdo, bloqueia duplicidade e limpa após sucesso', async () => {
  await renderizar('ADMINISTRADOR');
  assert.equal(document.querySelectorAll('form input, form textarea').length, 2);
  assert.equal(document.getElementById('comunicado-conteudo').maxLength, 5000);
  await preencher('comunicado-titulo', ' Aviso importante ');
  await preencher('comunicado-conteudo', 'a'.repeat(5000));
  assert.match(document.getElementById('comunicado-limite').textContent, /5\.000 \/ 5\.000/);
  await act(async () => {
    const formulario = document.querySelector('form');
    formulario.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    formulario.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  const envios = chamadas.filter(item => item.opcoes.method === 'POST');
  assert.equal(envios.length, 1);
  assert.deepEqual(JSON.parse(envios[0].opcoes.body), { titulo: 'Aviso importante', conteudo: 'a'.repeat(5000) });
  assert.equal(document.getElementById('comunicado-conteudo').value, '');
  assert.match(document.querySelector('[role="status"]').textContent, /publicado para todos os alunos/);
});

test('falha na publicação preserva os textos e permite nova tentativa', async () => {
  const consultar = globalThis.fetch;
  globalThis.fetch = async (url, opcoes) => opcoes?.method === 'POST' ? Response.json({ erro: 'Não foi possível publicar.' }, { status: 400 }) : consultar(url, opcoes);
  await renderizar('ADMINISTRADOR');
  await preencher('comunicado-titulo', 'Aviso');
  await preencher('comunicado-conteudo', 'Mensagem para os alunos.');
  await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.match(document.querySelector('[role="alert"]').textContent, /Não foi possível publicar/);
  assert.equal(document.getElementById('comunicado-conteudo').value, 'Mensagem para os alunos.');
  assert.equal(document.querySelector('form button').disabled, false);
});

test('leitura é salva antes de atualizar o estado e avisa o sino', async () => {
  let atualizacoes = 0;
  window.addEventListener('curso-valido-notificacoes-alteradas', () => atualizacoes++);
  await renderizar();
  assert.equal(document.querySelector('form'), null);
  assert.ok(document.querySelector('.notificacoes-nao-lida'));
  await act(async () => document.querySelector('article button').click());
  assert.equal(chamadas.filter(item => item.opcoes.method === 'PUT').length, 1);
  assert.equal(chamadas.at(-1).rota, '/aluno/notificacoes/7/lida');
  assert.equal(atualizacoes, 1);
  assert.equal(document.querySelector('.notificacoes-nao-lida'), null);
  assert.match(document.querySelector('[role="status"]').textContent, /em dia/);
  assert.equal(document.querySelector('article button').getAttribute('aria-expanded'), 'true');
  await act(async () => document.querySelector('article button').click());
  await act(async () => document.querySelector('article button').click());
  assert.equal(chamadas.filter(item => item.opcoes.method === 'PUT').length, 1);
});

test('falha ao registrar leitura mantém comunicado não lido e permite tentar novamente', async () => {
  const consultar = globalThis.fetch;
  globalThis.fetch = async (url, opcoes) => opcoes?.method === 'PUT' ? new Response(null, { status: 503 }) : consultar(url, opcoes);
  await renderizar();
  await act(async () => document.querySelector('article button').click());
  assert.ok(document.querySelector('[role="alert"]'));
  assert.ok(document.querySelector('.notificacoes-nao-lida'));
  assert.equal(document.querySelector('article button').disabled, false);
});

test('troca de aluno descarta a consulta pendente da conta anterior', async () => {
  let liberar;
  globalThis.fetch = async () => new Promise(resolve => { liberar = resolve; });
  await renderizar('ALUNO', false, 1);
  const consultaAntiga = liberar;
  globalThis.fetch = async () => Response.json({ ...pagina, itens: [], naoLidas: 0, totalElementos: 0, totalPaginas: 0 });
  await renderizar('ALUNO', false, 2);
  await act(async () => consultaAntiga(Response.json(pagina)));
  assert.equal(document.querySelector('article'), null);
  assert.match(document.body.textContent, /Nenhum comunicado disponível/);
});

const botao = texto => [...document.querySelectorAll('button')].find(item => item.textContent === texto);

test('administrador edita o comunicado existente e pode cancelar sem enviar alterações', async () => {
  await renderizar('ADMINISTRADOR');
  await act(() => botao('Editar').click());
  assert.equal(document.getElementById('comunicado-titulo').value, comunicado.titulo);
  assert.equal(document.getElementById('comunicado-conteudo').value, comunicado.conteudo);
  await preencher('comunicado-titulo', 'Rascunho');
  await act(() => botao('Cancelar edição').click());
  assert.equal(chamadas.some(item => item.opcoes.method === 'PUT'), false);
  assert.equal(document.getElementById('comunicado-titulo').value, '');
  await act(() => botao('Editar').click());
  await preencher('comunicado-titulo', 'Título atualizado');
  await preencher('comunicado-conteudo', 'a'.repeat(5000));
  await act(async () => {
    for (let i = 0; i < 2; i++) document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  const envios = chamadas.filter(item => item.opcoes.method === 'PUT');
  assert.equal(envios.length, 1);
  assert.equal(envios[0].rota, '/administracao/comunicados/7');
  assert.deepEqual(JSON.parse(envios[0].opcoes.body), { titulo: 'Título atualizado', conteudo: 'a'.repeat(5000) });
  assert.match(document.querySelector('[role="status"]').textContent, /Comunicado atualizado/);
  assert.equal(document.getElementById('novo-comunicado-titulo').textContent, 'Novo comunicado');
});

test('falha na edição mantém o rascunho e permite salvar novamente', async () => {
  const consultar = globalThis.fetch;
  globalThis.fetch = async (url, opcoes) => opcoes?.method === 'PUT' ? new Response(null, { status: 503 }) : consultar(url, opcoes);
  await renderizar('ADMINISTRADOR');
  await act(() => botao('Editar').click());
  await preencher('comunicado-titulo', 'Título atualizado');
  await act(async () => botao('Salvar alterações').click());
  assert.ok(document.querySelector('[role="alert"]'));
  assert.equal(document.getElementById('comunicado-titulo').value, 'Título atualizado');
  assert.equal(botao('Salvar alterações').disabled, false);
  assert.equal(document.querySelector('article h3').textContent, comunicado.titulo);
});

test('exclusão exige confirmação, permite cancelar e impede requisições duplicadas', async () => {
  const consultar = globalThis.fetch;
  let concluir, excluido = false;
  globalThis.fetch = async (url, opcoes) => {
    if (opcoes?.method === 'DELETE') {
      chamadas.push({ rota: new URL(url).pathname.replace('/api', ''), opcoes });
      return new Promise(resolve => { concluir = () => { excluido = true; resolve(new Response(null, { status: 204 })); }; });
    }
    const resposta = await consultar(url, opcoes);
    return excluido ? Response.json({ ...pagina, itens: [], totalElementos: 0, totalPaginas: 0 }) : resposta;
  };
  await renderizar('ADMINISTRADOR');
  await act(() => botao('Excluir').click());
  assert.match(document.querySelector('[role="dialog"]').textContent, /Manutenção programada/);
  assert.equal(chamadas.some(item => item.opcoes.method === 'DELETE'), false);
  await act(() => botao('Cancelar').click());
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.ok(document.querySelector('article'));
  await act(() => botao('Excluir').click());
  await act(() => { const confirmar = botao('Confirmar'); confirmar.click(); confirmar.click(); });
  assert.equal(chamadas.filter(item => item.opcoes.method === 'DELETE').length, 1);
  assert.equal(chamadas.at(-1).rota, '/administracao/comunicados/7');
  assert.equal(botao('Cancelar').disabled, true);
  await act(async () => concluir());
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(document.querySelector('article'), null);
  assert.match(document.querySelector('[role="status"]').textContent, /Comunicado excluído/);
});

test('falha na exclusão preserva o comunicado e exibe a falha para nova tentativa', async () => {
  const consultar = globalThis.fetch;
  globalThis.fetch = async (url, opcoes) => opcoes?.method === 'DELETE' ? new Response(null, { status: 503 }) : consultar(url, opcoes);
  await renderizar('ADMINISTRADOR');
  await act(() => botao('Excluir').click());
  await act(async () => botao('Confirmar').click());
  assert.ok(document.querySelector('[role="alert"]'));
  assert.equal(document.querySelector('article h3').textContent, comunicado.titulo);
  assert.equal(botao('Excluir').disabled, false);
  assert.equal(document.querySelector('[role="dialog"]'), null);
});

test('excluir o último comunicado de uma página retorna à página anterior', async () => {
  let excluido = false;
  globalThis.fetch = async (url, opcoes = {}) => {
    chamadas.push({ url: String(url), opcoes });
    if (opcoes.method === 'DELETE') { excluido = true; return new Response(null, { status: 204 }); }
    return Response.json({ ...pagina, pagina: Number(new URL(url).searchParams.get('page')), totalPaginas: excluido ? 1 : 2, totalElementos: excluido ? 10 : 11 });
  };
  await renderizar('ADMINISTRADOR');
  await act(async () => botao('Próxima').click());
  assert.match(document.querySelector('.notificacoes-paginacao').textContent, /Página 2 de 2/);
  await act(() => botao('Excluir').click());
  await act(async () => botao('Confirmar').click());
  assert.equal(new URL(chamadas.at(-1).url).searchParams.get('page'), '0');
  assert.equal(document.querySelector('.notificacoes-paginacao'), null);
});

test('aluno não recebe ações de edição ou exclusão', async () => {
  await renderizar();
  assert.equal(botao('Editar'), undefined);
  assert.equal(botao('Excluir'), undefined);
});
