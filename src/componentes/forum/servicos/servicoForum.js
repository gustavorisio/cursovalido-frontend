const URL_API = 'http://localhost:8080/api/forum';
const PAGINA_PADRAO = 0;
const TAMANHO_PAGINA_PADRAO = 10;

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
  }
}

async function buscarJson(caminho, opcoes = {}) {
  const token = import.meta.env.VITE_API_TOKEN
    || globalThis.localStorage?.getItem('accessToken')
    || globalThis.localStorage?.getItem('token');

  const headers = Object.assign({}, opcoes.headers);
  if (opcoes.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const config = Object.assign({}, opcoes, { headers });
  const resposta = await fetch(`${URL_API}${caminho}`, config);

  const texto = await resposta.text();
  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }
  }

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, dados?.erro || 'Não foi possível concluir a operação.');
  }

  return dados;
}

async function chamar(caminho, opcoes = {}) {
  const dados = await buscarJson(caminho, opcoes);
  return dados?.value ?? dados;
}

function cabecalho(usuario = { id: 1 }) {
  return { 'X-User-Id': String(usuario.id) };
}

export function buscarTopicos(page = PAGINA_PADRAO, size = TAMANHO_PAGINA_PADRAO, usuario) {
  const parametros = new URLSearchParams({ page: String(page), size: String(size) });
  return chamar(`/topicos?${parametros}`, { headers: cabecalho(usuario) });
}

export async function buscarTopicosPesquisa(usuario, size = 10) {
  const topicos = [];
  let page = 0;

  while (true) {
    const parametros = new URLSearchParams({ page: String(page), size: String(size) });
    const resposta = await buscarJson(`/topicos?${parametros}`, { headers: cabecalho(usuario) });
    const itens = Array.isArray(resposta) ? resposta : (resposta?.value ?? []);
    itens.forEach((item) => topicos.push(item));

    if (itens.length < size || itens.length === 0) break;
    page += 1;
  }

  return topicos;
}

export function buscarComentarios(idTopico, usuario) {
  return chamar(`/topicos/${idTopico}/comentarios`, { headers: cabecalho(usuario) });
}

export function buscarUsuarios(usuario) {
  return chamar('/users', { headers: cabecalho(usuario) });
}

export function buscarHistorico(idUsuario, usuario) {
  return chamar(`/history/${idUsuario}`, { headers: cabecalho(usuario) });
}

export function criarTopico(dados, usuario) {
  return chamar('/topicos', {
    method: 'POST',
    headers: cabecalho(usuario),
    body: JSON.stringify(Object.assign({}, dados, {
      idAutor: usuario.id,
      nomeAutor: usuario.nome,
      papelAutor: usuario.perfil
    }))
  });
}

export function atualizarTopico(idTopico, dados, usuario) {
  return chamar(`/topicos/${idTopico}`, {
    method: 'PUT',
    headers: cabecalho(usuario),
    body: JSON.stringify(dados)
  });
}

export function arquivarTopico(idTopico, usuario) {
  return chamar(`/topicos/${idTopico}/arquivar`, {
    method: 'PUT',
    headers: cabecalho(usuario)
  });
}

export function criarComentario(idTopico, conteudo, usuario) {
  return chamar(`/topicos/${idTopico}/comentarios`, {
    method: 'POST',
    headers: cabecalho(usuario),
    body: JSON.stringify({
      conteudo,
      idAutor: usuario.id,
      nomeAutor: usuario.nome,
      papelAutor: usuario.perfil,
      topico: idTopico
    })
  });
}

export function apagarTopico(idTopico, usuario) {
  return chamar(`/topicos/${idTopico}`, {
    method: 'DELETE',
    headers: cabecalho(usuario)
  });
}

export function fecharTopico(idTopico, usuario) {
  return chamar(`/topicos/${idTopico}/fechar`, {
    method: 'PUT',
    headers: cabecalho(usuario)
  });
}

export function atualizarComentario(idComentario, dados, usuario) {
  return chamar(`/comentarios/${idComentario}`, {
    method: 'PUT',
    headers: cabecalho(usuario),
    body: JSON.stringify(dados)
  });
}

export function apagarComentario(idComentario, usuario) {
  return chamar(`/comentarios/${idComentario}`, {
    method: 'DELETE',
    headers: cabecalho(usuario)
  });
}