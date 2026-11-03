import { requisitar } from '../../../servicos/api';

export function listarCatalogo() {
  return requisitar('/aluno/cursos');
}

export function listarMatriculas() {
  return requisitar('/aluno/matriculas');
}

export function matricular(idCurso) {
  return requisitar(`/aluno/cursos/${idCurso}/matriculas`, { method: 'POST' });
}

export function buscarCurso(idCurso) {
  return requisitar(`/aluno/cursos/${idCurso}`);
}

export function listarModulos(idCurso) {
  return requisitar(`/aluno/cursos/${idCurso}/modulos`);
}

export function listarAulas(idModulo) {
  return requisitar(`/aluno/modulos/${idModulo}/aulas`);
}

export function buscarAula(idAula) {
  return requisitar(`/aluno/aulas/${idAula}`);
}

export function buscarProgresso(idAula) {
  return requisitar(`/aluno/aulas/${idAula}/progresso`);
}

export function salvarPosicao(idAula, posicaoSegundos, opcoes = {}) {
  return requisitar(`/aluno/aulas/${idAula}/progresso`, {
    ...opcoes,
    method: 'PUT',
    body: JSON.stringify({ posicaoSegundos }),
  });
}

export function concluirAula(idAula, opcoes = {}) {
  return requisitar(`/aluno/aulas/${idAula}/conclusao`, { ...opcoes, method: 'POST' });
}
