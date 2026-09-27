import { requisitar } from '../../../servicos/api';

const TAMANHO_PAGINA_PADRAO = 5;

export function buscarTopicos(page = 0, size = TAMANHO_PAGINA_PADRAO, busca = '') {
  const parametros = new URLSearchParams({ page: String(page), size: String(size) });
  if (busca.trim()) parametros.set('busca', busca.trim());
  return requisitar(`/forum/topicos?${parametros}`);
}

export function buscarTopicosPesquisa(busca, size = TAMANHO_PAGINA_PADRAO) {
  return buscarTopicos(0, size, busca);
}

export function buscarComentarios(idTopico) {
  return requisitar(`/forum/topicos/${idTopico}/comentarios`);
}

export function buscarUsuarios() {
  return requisitar('/forum/users');
}

export function criarTopico(dados) {
  return requisitar('/forum/topicos', {
    method: 'POST',
    body: JSON.stringify({ titulo: dados.titulo, descricao: dados.descricao })
  });
}

export function atualizarTopico(idTopico, dados) {
  return requisitar(`/forum/topicos/${idTopico}`, {
    method: 'PUT',
    body: JSON.stringify(dados)
  });
}

export function arquivarTopico(idTopico) {
  return requisitar(`/forum/topicos/${idTopico}/arquivar`, {
    method: 'PUT',
  });
}

export function criarComentario(idTopico, conteudo) {
  return requisitar(`/forum/topicos/${idTopico}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ conteudo })
  });
}

export function apagarTopico(idTopico) {
  return requisitar(`/forum/topicos/${idTopico}`, {
    method: 'DELETE',
  });
}

export function fecharTopico(idTopico) {
  return requisitar(`/forum/topicos/${idTopico}/fechar`, {
    method: 'PUT',
  });
}

export function atualizarComentario(idComentario, dados) {
  return requisitar(`/forum/comentarios/${idComentario}`, {
    method: 'PUT',
    body: JSON.stringify(dados)
  });
}

export function apagarComentario(idComentario) {
  return requisitar(`/forum/comentarios/${idComentario}`, {
    method: 'DELETE',
  });
}