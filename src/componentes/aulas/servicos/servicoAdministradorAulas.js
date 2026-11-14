import { requisitar } from '../../../servicos/api';

export async function listarCursos() {
  try {
    return await requisitar('/administracao/cursos');
  } catch (erro) {
    if (erro.status === 404) {
      throw new Error('Não foi possível consultar os cursos. Tente novamente mais tarde.', { cause: erro });
    }
    throw erro;
  }
}

export function buscarCurso(id) {
  return requisitar(`/administracao/cursos/${id}`);
}

export function editarCurso(id, dados) {
  return requisitar(`/administracao/cursos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}

export function excluirCurso(id) {
  return requisitar(`/administracao/cursos/${id}`, { method: 'DELETE' });
}

export function listarModulos(idCurso) {
  return requisitar(`/administracao/cursos/${idCurso}/modulos`);
}

export function listarAulas(idModulo) {
  return requisitar(`/administracao/modulos/${idModulo}/aulas`);
}

export function buscarAula(id) {
  return requisitar(`/administracao/aulas/${id}`);
}

export function editarAula(id, dados) {
  return requisitar('/administracao/aulas/' + id, { method: 'PUT', body: JSON.stringify(dados) });
}
export function arquivarAula(id) {
  return requisitar('/administracao/aulas/' + id + '/arquivar', { method: 'PUT' });
}
export function reabrirAula(id) {
  return requisitar('/administracao/aulas/' + id + '/reabrir', { method: 'PUT' });
}
