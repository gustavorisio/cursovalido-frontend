import { test, beforeAll, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement as h, act } from 'react';
import { MemoryRouter } from 'react-router-dom';
let createRoot;

let CampoSenha, AlterarSenha, contexto, useForum, raiz, dom, forum;
let ListaComentarios, DadosUsuario, PaginaForum;
const fetchOriginal = globalThis.fetch;
beforeAll(async () => {
  const inicial = new JSDOM('<div></div>');
  globalThis.window = inicial.window; globalThis.document = inicial.window.document;
  ({ createRoot } = await import('react-dom/client'));
  CampoSenha = (await import('/src/componentes/autenticacao/CampoSenha.jsx')).default;
  AlterarSenha = (await import('/src/componentes/autenticacao/FormularioAlterarSenha.jsx')).default;
  contexto = (await import('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
  useForum = (await import('/src/componentes/forum/hooks/useForum.js')).useForum;
  ListaComentarios = (await import('/src/componentes/forum/componentes/ListaComentarios.jsx')).default;
  DadosUsuario = (await import('/src/componentes/autenticacao/DadosUsuario.jsx')).default;
  PaginaForum = (await import('/src/componentes/forum/PaginaForum.jsx')).default;
  inicial.window.close();
});

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
  await act(() => raiz.render(h('form', { onSubmit: () => envios++ }, h(CampoSenha, { value: 'Segredo123!', onChange() { } }))));
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
    return Response.json(Array.from({ length: pagina === 0 ? 10 : 2 }, (_, indice) => ({ id: pagina * 10 + indice, titulo: 'Tecnologia' })));
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
  assert.equal(chamadas.at(-1).searchParams.get('size'), '10');
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

test('dados da conta exibem gamertag, data e hora do último aceite e a versão aceita', async () => {
  const dados = { id: 7, nomeCompleto: 'Aluno', email: 'aluno@example.com', gamertag: 'CV-ABCD2345EFGH', dataHoraAceite: '2026-11-14T15:42:30', versaoTermos: '2.1' };
  globalThis.fetch = async () => Response.json(dados);
  await act(async () => raiz.render(h(contexto.Provider, { value: { sessao: { idUsuario: 7 } } }, h(DadosUsuario))));
  const campos = Object.fromEntries([...document.querySelectorAll('dl > div')].map(div => [div.querySelector('dt').textContent, div.querySelector('dd').textContent]));
  assert.equal(campos.Gamertag, 'CV-ABCD2345EFGH');
  assert.match(campos['Último aceite dos termos'], /14\/11\/2026/);
  assert.match(campos['Último aceite dos termos'], /15:42:30/);
  assert.equal(campos['Versão dos termos aceitos'], '2.1');
});

for (const perfil of ['ALUNO', 'PROFESSOR', 'ADMINISTRADOR']) {
  test(`dados da conta de ${perfil} exibem matrícula somente para aluno`, async () => {
    globalThis.fetch = async () => Response.json({ id: 7, nomeCompleto: 'Usuário', email: 'usuario@example.com', gamertag: 'CV-ABCD2345EFGH', perfil, matricula: '000123' });
    await act(async () => raiz.render(h(contexto.Provider, { value: { sessao: { idUsuario: 7, perfil } } }, h(DadosUsuario))));
    const campos = Object.fromEntries([...document.querySelectorAll('dl > div')].map(div => [div.querySelector('dt').textContent, div.querySelector('dd').textContent]));
    assert.equal(campos.Gamertag, 'CV-ABCD2345EFGH');
    assert.equal(campos['Matrícula'], perfil === 'ALUNO' ? '000123' : undefined);
  });
}

test('aluno sem matrícula informada usa o perfil da sessão e não inventa um número', async () => {
  globalThis.fetch = async () => Response.json({ id: 7, nomeCompleto: 'Aluno', email: 'aluno@example.com' });
  await act(async () => raiz.render(h(contexto.Provider, { value: { sessao: { idUsuario: 7, perfil: 'ALUNO' } } }, h(DadosUsuario))));
  const campo = [...document.querySelectorAll('dl > div')].find(div => div.querySelector('dt').textContent === 'Matrícula');
  assert.equal(campo.querySelector('dd').textContent, 'Não informada');
});

test('dados da conta não inventam data ou versão quando o aceite não está informado', async () => {
  globalThis.fetch = async () => Response.json({ id: 7, nomeCompleto: 'Aluno', email: 'aluno@example.com' });
  await act(async () => raiz.render(h(contexto.Provider, { value: { sessao: { idUsuario: 7 } } }, h(DadosUsuario))));
  const campos = Object.fromEntries([...document.querySelectorAll('dl > div')].map(div => [div.querySelector('dt').textContent, div.querySelector('dd').textContent]));
  assert.equal(campos['Último aceite dos termos'], 'Não informado');
  assert.equal(campos['Versão dos termos aceitos'], 'Não informada');
});

test('fórum confirma cada alteração e preserva orientação quando o servidor recusa', async () => {
  const topico = { id: 1, idAutor: 7, titulo: 'Java', descricao: 'Dúvida' };
  const comentario = { id: 2, idAutor: 7, conteudo: 'Resposta' };
  let recusar = false;
  globalThis.fetch = async (url, opcoes) => {
    if (opcoes.method) {
      if (recusar) return Response.json({ codigo: 'CAMPOS_INVALIDOS', erro: 'Confira os campos.', campos: { titulo: 'Preencha este campo.' } }, { status: 400 });
      return opcoes.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json(topico);
    }
    if (url.endsWith('/users') || url.endsWith('/restricoes')) return Response.json([]);
    if (url.endsWith('/comentarios')) return Response.json([comentario]);
    return Response.json({ content: [topico], totalPages: 1 });
  };
  function Harness() { forum = useForum(); return h('div', { role: 'status' }, forum.mensagemSucesso); }
  await act(async () => raiz.render(h(contexto.Provider, { value: { autenticado: true, sessao: { idUsuario: 7, perfil: 'ADMINISTRADOR' } } }, h(Harness))));
  const verificar = async (acao, mensagem) => {
    await act(acao);
    assert.equal(forum.mensagemErro, '');
    assert.equal(document.querySelector('[role=status]').textContent, mensagem);
  };
  await verificar(() => forum.salvarTopico('Java', 'Dúvida'), 'Tópico publicado.');
  await act(() => forum.selecionarTopico(topico));
  await verificar(() => forum.salvarComentario('Resposta'), 'Comentário publicado.');
  await verificar(() => forum.editarTopico(1, 'Java atualizado', 'Descrição'), 'Tópico atualizado.');
  await verificar(() => forum.editarComentario(comentario, 'Correção'), 'Comentário atualizado.');
  await verificar(() => forum.excluirComentarioSelecionado(comentario), 'Comentário excluído.');
  recusar = true;
  let resultado;
  await act(async () => { resultado = await forum.salvarTopico('Java', 'Dúvida'); });
  assert.equal(resultado, null);
  assert.equal(forum.mensagemSucesso, '');
  assert.equal(forum.mensagemErro, 'Título: Preencha este campo.');
  recusar = false;
  await verificar(() => forum.fecharTopicoSelecionado(topico), 'Tópico fechado. Novos comentários não serão aceitos.');
  await verificar(() => forum.arquivarTopicoSelecionado(topico), 'Tópico arquivado e removido da lista.');
  assert.equal(forum.topicoSelecionado, null);
});
test('tela confirma publicação, bloqueia envio repetido e mantém formulário quando há erro', async () => {
  let concluir;
  globalThis.fetch = async (url, opcoes) => {
    if (opcoes.method === 'POST') return new Promise(resolve => { concluir = resolve; });
    return Response.json([]);
  };
  await act(async () => raiz.render(h(MemoryRouter, null, h(contexto.Provider,
    { value: { autenticado: true, sessao: { idUsuario: 7, perfil: 'ALUNO' } } }, h(PaginaForum)))));
  const botao = texto => [...document.querySelectorAll('button')].find(b => b.textContent === texto);
  const preencher = async () => {
    await act(() => botao('Novo tópico').click());
    for (const [seletor, tipo, valor] of [['input[aria-label="Título da postagem"]', 'HTMLInputElement', 'Minha dúvida'], ['textarea', 'HTMLTextAreaElement', 'Descrição que não deve ser perdida']]) {
      const campo = document.querySelector(seletor);
      await act(() => {
        Object.getOwnPropertyDescriptor(window[tipo].prototype, 'value').set.call(campo, valor);
        campo.dispatchEvent(new window.Event('input', { bubbles: true }));
      });
    }
  };
  await preencher();
  await act(() => botao('Publicar').click());
  assert.equal(botao('Aguarde...').disabled, true);
  assert.equal(document.querySelector('textarea').disabled, true);
  await act(async () => concluir(Response.json({ id: 9 })));
  assert.match(document.querySelector('[role=status]').textContent, /Tópico publicado\./);
  assert.ok(botao('Novo tópico'));
  await preencher();
  await act(() => botao('Publicar').click());
  await act(async () => concluir(Response.json({ codigo: 'CAMPOS_INVALIDOS', campos: { titulo: 'Escolha outro título.' } }, { status: 400 })));
  assert.equal(document.querySelector('[role=status]'), null);
  assert.match(document.querySelector('[role=alert]').textContent, /Título: Escolha outro título\./);
  assert.equal(document.querySelector('textarea').value, 'Descrição que não deve ser perdida');
  assert.equal(botao('Publicar').disabled, false);
});

test('visitante recebe somente a negativa no fórum e não consulta tópicos', async () => {
  const chamadas = [];
  globalThis.fetch = async url => { chamadas.push(url); return Response.json([]); };
  await act(() => raiz.render(h(contexto.Provider, { value: { autenticado: false, sessao: null } },
    h(MemoryRouter, null, h(PaginaForum)))));
  assert.match(document.querySelector('main').textContent, /Para acessar o fórum e participar das discussões, entre na sua conta/);
  assert.deepEqual(chamadas, []);
});
