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

  const headers = { ...opcoes.headers };
  if (opcoes.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const config = { ...opcoes, headers };
  const resposta = await fetch(`${URL_API}${caminho}`, config);

  const texto = await resposta.text();
  if (!resposta.ok) {
    let mensagem = `O servidor respondeu com o status ${resposta.status}.`;

    if (texto) {
      try {
        const erro = JSON.parse(texto);
        mensagem = erro?.erro || erro?.message || mensagem;
      } catch {
        mensagem = `O servidor respondeu com um erro ${resposta.status} em formato inválido.`;
      }
    }

    throw new ErroApi(resposta.status, mensagem);
  }

  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new ErroApi(
      resposta.status,
      `A API retornou uma resposta inválida com o status ${resposta.status}.`
    );
  }
}

async function chamar(caminho, opcoes = {}) {
  const dados = await buscarJson(caminho, opcoes);
  return dados?.value ?? dados;
}

function cabecalho(usuario = { id: 1 }) {
  return { 'X-User-Id': String(usuario.id) };
}

export function buscarTopicos(page = PAGINA_PADRAO, size = TAMANHO_PAGINA_PADRAO, usuario, busca = '') {
  const parametros = new URLSearchParams({ page: String(page), size: String(size) });
  if (busca.trim()) parametros.set('busca', busca.trim());
  return chamar(`/topicos?${parametros}`, { headers: cabecalho(usuario) });
}

export function buscarTopicosPesquisa(usuario, busca, size = TAMANHO_PAGINA_PADRAO) {
  return buscarTopicos(0, size, usuario, busca);
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
    body: JSON.stringify({ titulo: dados.titulo, descricao: dados.descricao })
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
    body: JSON.stringify({ conteudo })
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