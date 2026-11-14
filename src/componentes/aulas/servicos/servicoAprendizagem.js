import { requisitar } from '../../../servicos/api';

export function consultarPerguntasInteresses(gestao = false) {
  return requisitar(gestao ? '/administracao/caminhos' : '/catalogo/roadmap', { semAutenticacao: !gestao });
}

export function consultarQuestionarioCaminhos(id, gestao = false) {
  return requisitar(gestao ? `/administracao/caminhos/questionarios/${id}` : `/catalogo/roadmap/questionarios/${id}`, { semAutenticacao: !gestao });
}

export function consultarInteresses(id) {
  return requisitar(`/aluno/roadmap/questionarios/${id}/resultado`);
}

export function calcularInteresses(id, versao, respostas) {
  return requisitar(`/catalogo/roadmap/questionarios/${id}/resultado`, { semAutenticacao: true, method: 'POST', body: JSON.stringify({ versao, respostas }) });
}

export function salvarInteresses(id, versao, respostas) {
  return requisitar(`/aluno/roadmap/questionarios/${id}/resultado`, { method: 'POST', body: JSON.stringify({ versao, respostas }) });
}

export function salvarQuestionarioCaminhos(id, dados) {
  return requisitar(id ? `/administracao/caminhos/questionarios/${id}` : '/administracao/caminhos/questionarios', { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
}

export function excluirQuestionarioCaminhos(id) {
  return requisitar(`/administracao/caminhos/questionarios/${id}`, { method: 'DELETE' });
}

export function salvarSecaoCaminhos(id, dados) {
  return requisitar(id ? `/administracao/caminhos/secoes/${id}` : '/administracao/caminhos/secoes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
}

export function excluirSecaoCaminhos(id) {
  return requisitar(`/administracao/caminhos/secoes/${id}`, { method: 'DELETE' });
}

export function rotaQuestionario(perfil, idCurso, idModulo) {
  const base = `/${perfil}/cursos/${idCurso}`;
  return idModulo ? `${base}/modulos/${idModulo}/questionario` : `${base}/diagnostico`;
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
