import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement as h, act } from 'react';
let createRoot;

let servidor, CampoSenha, AlterarSenha, contexto, useForum, raiz, dom, forum;
let ListaComentarios, DadosUsuario;
const fetchOriginal = globalThis.fetch;
before(async () => {
  const inicial = new JSDOM('<div></div>');
  globalThis.window = inicial.window; globalThis.document = inicial.window.document;
  ({ createRoot } = await import('react-dom/client'));
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  CampoSenha = (await servidor.ssrLoadModule('/src/componentes/autenticacao/CampoSenha.jsx')).default;
  AlterarSenha = (await servidor.ssrLoadModule('/src/componentes/autenticacao/FormularioAlterarSenha.jsx')).default;
  contexto = (await servidor.ssrLoadModule('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
  useForum = (await servidor.ssrLoadModule('/src/componentes/forum/hooks/useForum.js')).useForum;
  ListaComentarios = (await servidor.ssrLoadModule('/src/componentes/forum/componentes/ListaComentarios.jsx')).default;
  DadosUsuario = (await servidor.ssrLoadModule('/src/componentes/autenticacao/DadosUsuario.jsx')).default;
  inicial.window.close();
});
after(async () => servidor.close());
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close(); globalThis.fetch = fetchOriginal;
  for (const key of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[key];
});

test('olho alterna visibilidade sem enviar formulário nem alterar senha', async () => {
  let envios = 0;
  await act(() => raiz.render(h('form', { onSubmit: () => envios++ }, h(CampoSenha, { value: 'Segredo123!', onChange() {} }))));
  const campo = document.querySelector('input');
  const olho = document.querySelector('button');
  assert.equal(campo.type, 'password');
  await act(() => olho.click());
  assert.equal(campo.type, 'text');
  assert.equal(olho.getAttribute('aria-label'), 'Ocultar senha');
  assert.equal(campo.value, 'Segredo123!');
  await act(() => olho.click());
  assert.equal(campo.type, 'password');
  assert.equal(envios, 0);
});

test('alteração autenticada envia senha atual e só conclui após sucesso', async () => {
  const enviados = []; let conclusoes = 0;
  globalThis.fetch = async (url, options) => { enviados.push({ url, corpo: JSON.parse(options.body) }); return new Response(null, { status: 204 }); };
  await act(() => raiz.render(h(AlterarSenha, { aoConcluir: () => conclusoes++ })));
  const valores = ['SenhaAtual123!', 'NovaSenha123!', 'NovaSenha123!'];
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  for (const [i, input] of [...document.querySelectorAll('input')].entries()) {
    await act(() => { setter.call(input, valores[i]); input.dispatchEvent(new window.Event('input', { bubbles: true })); });
  }
  await act(() => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.equal(enviados.length, 1);
  assert.match(enviados[0].url, /alterar-senha-autenticado$/);
  assert.deepEqual(enviados[0].corpo, { senhaAtual: valores[0], novaSenha: valores[1], confirmacaoSenha: valores[2] });
  assert.equal(conclusoes, 1);
  assert.equal(document.querySelector('input').value, '');
});

test('meus tópicos consulta endpoint próprio e mantém busca na paginação', async () => {
  const chamadas = [];
  globalThis.fetch = async (url) => {
    const u = new URL(url); chamadas.push(u);
    if (u.pathname.endsWith('/users')) return Response.json({ usuarios: [] });
    if (u.pathname.endsWith('/restricoes')) return Response.json([]);
    return Response.json({ content: [{ id: 1, titulo: 'Java' }], totalPages: 3 });
  };
  function Harness() { forum = useForum(); return null; }
  await act(async () => raiz.render(h(contexto.Provider, { value: { autenticado: true, sessao: { idUsuario: 7, perfil: 'ALUNO' } } }, h(Harness))));
  await act(() => forum.carregarTopicos(0, 'Java'));
  await act(async () => forum.setMeusTopicos(true));
  await act(() => forum.carregarTopicos(1));
  const ultima = chamadas.at(-1);
  assert.equal(ultima.pathname, '/api/forum/topicos/meus');
  assert.equal(ultima.searchParams.get('page'), '1');
  assert.equal(ultima.searchParams.get('busca'), 'Java');
  assert.equal(ultima.searchParams.has('idAutor'), false);
  assert.equal(forum.totalPaginas, 3);
  await act(() => forum.setMeusTopicos(false));
  assert.equal(chamadas.filter(u => u.pathname.endsWith('/topicos')).at(-1).searchParams.get('page'), '0');
});

test('tópicos gerais permitem avançar com resposta em lista e encerram na página incompleta', async () => {
  const chamadas = [];
  globalThis.fetch = async (url) => {
    const consulta = new URL(url);
    chamadas.push(consulta);
    const pagina = Number(consulta.searchParams.get('page'));
    return Response.json(Array.from({ length: pagina === 0 ? 5 : 2 }, (_, indice) => ({ id: pagina * 5 + indice, titulo: 'Tecnologia' })));
  };
  function Harness() { forum = useForum(); return null; }
  await act(async () => raiz.render(h(contexto.Provider, { value: { autenticado: false } }, h(Harness))));
  assert.equal(forum.pagina, 0);
  assert.ok(forum.totalPaginas > forum.pagina + 1);
  await act(async () => forum.carregarTopicos(0, 'Tecnologia'));
  await act(async () => forum.carregarTopicos(1));
  assert.equal(forum.topicos.length, 2);
  assert.equal(forum.pagina + 1, forum.totalPaginas);
  assert.equal(chamadas.at(-1).searchParams.get('busca'), 'Tecnologia');
});

test('comentário excluído mantém o cartão, oculta conteúdo e ações', async () => {
  await act(() => raiz.render(h(ListaComentarios, {
    comentarios: [{ id: 1, ativo: false, conteudo: 'Texto original privado', nomeAutor: 'Aluno' }],
    podeEditar: () => true, podeExcluir: () => true,
  })));
  assert.equal(document.querySelectorAll('.comment-card').length, 1);
  assert.match(document.body.textContent, /Esta mensagem foi excluída\./);
  assert.doesNotMatch(document.body.textContent, /Texto original privado/);
  assert.equal(document.querySelectorAll('button').length, 0);
});

test('dados da conta exibem data e hora do último aceite e a versão aceita', async () => {
  const dados = { id: 7, nomeCompleto: 'Aluno', email: 'aluno@example.com', dataHoraAceite: '2026-11-14T15:42:30', versaoTermos: '2.1' };
  globalThis.fetch = async () => Response.json(dados);
  await act(async () => raiz.render(h(contexto.Provider, { value: { sessao: { idUsuario: 7 } } }, h(DadosUsuario))));
  const campos = Object.fromEntries([...document.querySelectorAll('dl > div')].map(div => [div.querySelector('dt').textContent, div.querySelector('dd').textContent]));
  assert.match(campos['Último aceite dos termos'], /14\/11\/2026/);
  assert.match(campos['Último aceite dos termos'], /15:42:30/);
  assert.equal(campos['Versão dos termos aceitos'], '2.1');
});

test('dados da conta não inventam data ou versão quando o aceite não está informado', async () => {
  globalThis.fetch = async () => Response.json({ id: 7, nomeCompleto: 'Aluno', email: 'aluno@example.com' });
  await act(async () => raiz.render(h(contexto.Provider, { value: { sessao: { idUsuario: 7 } } }, h(DadosUsuario))));
  const campos = Object.fromEntries([...document.querySelectorAll('dl > div')].map(div => [div.querySelector('dt').textContent, div.querySelector('dd').textContent]));
  assert.equal(campos['Último aceite dos termos'], 'Não informado');
  assert.equal(campos['Versão dos termos aceitos'], 'Não informada');
});
