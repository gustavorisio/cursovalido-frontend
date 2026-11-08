import { requisitar } from './api';

export function listarNoticias({ pagina = 0, tamanho = 12, busca = '' } = {}) {
  const parametros = new URLSearchParams({ page: pagina, size: tamanho, busca: busca.trim() });
  return requisitar(`/noticias?${parametros}`);
}
export const buscarNoticia = (id) => requisitar(`/noticias/${encodeURIComponent(id)}`);
export const criarNoticia = (dados) => requisitar('/noticias', { method: 'POST', body: JSON.stringify(dados) });
export const editarNoticia = (id, dados) => requisitar(`/noticias/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(dados) });
export const excluirNoticia = (id) => requisitar(`/noticias/${encodeURIComponent(id)}`, { method: 'DELETE' });
