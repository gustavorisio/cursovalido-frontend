import { requisitar } from '../../../servicos/api';

export function rotaQuestionario(perfil, idCurso, idModulo) {
  const base = `/${perfil}/cursos/${idCurso}`;
  if (!idModulo) throw new Error("Selecione um módulo para o questionário.");
  return `${base}/modulos/${idModulo}/questionario`;
}

export function consultarQuestionario(perfil, idCurso, idModulo) {
  return requisitar(rotaQuestionario(perfil, idCurso, idModulo));
}

export function salvarQuestionario(perfil, idCurso, idModulo, dados) {
  return requisitar(rotaQuestionario(perfil, idCurso, idModulo), { method: 'PUT', body: JSON.stringify(dados) });
}

export function responderQuestionario(idCurso, idModulo, versao, respostas) {
  return requisitar(`${rotaQuestionario('aluno', idCurso, idModulo)}/respostas`, { method: 'POST', body: JSON.stringify({ versao, respostas }) });
}

export function consultarPlano(idCurso) {
  return requisitar(`/aluno/cursos/${idCurso}/plano`);
}
