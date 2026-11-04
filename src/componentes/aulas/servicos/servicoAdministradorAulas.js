import { requisitar } from '../../../servicos/api';

export async function listarCursos() {
  try {
    return await requisitar('/administracao/cursos');
  } catch (erro) {
    if (erro.status === 404) {
      throw new Error('O backend em execução não possui a consulta administrativa de cursos. Reinicie o backend atualizado e confira VITE_API_URL.', { cause: erro });
    }
    throw erro;
  }
}

export function buscarCurso(id) {
  return requisitar(`/administracao/cursos/${id}`);
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
