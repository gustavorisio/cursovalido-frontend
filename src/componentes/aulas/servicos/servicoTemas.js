import { requisitar } from '../../../servicos/api';

export function listarTemas() {
  return requisitar('/catalogo/temas', { semAutenticacao: true });
}

export function salvarTema(id, nome) {
  return requisitar(id ? `/temas/${id}` : '/temas', {
    method: id ? 'PUT' : 'POST', body: JSON.stringify({ nome }),
  });
}

export function excluirTema(id) {
  return requisitar(`/temas/${id}`, { method: 'DELETE' });
}
