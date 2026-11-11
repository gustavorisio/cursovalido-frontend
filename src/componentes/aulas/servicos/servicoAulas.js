import { requisitar } from '../../../servicos/api';

export function listarCursos() {
  return requisitar('/cursos');
}

export function buscarCurso(id) {
  return requisitar(`/cursos/${id}`);
}

export function listarModulos(idCurso) {
  return requisitar(`/cursos/${idCurso}/modulos`);
}

export function buscarModulo(id) {
  return requisitar(`/modulos/${id}`);
}

export function listarAulas(idModulo) {
  return requisitar(`/modulos/${idModulo}/aulas`);
}

export function salvarCurso(id, dados) {
  const caminho = id ? `/cursos/${id}` : '/cursos';
  return requisitar(caminho, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
}

export function salvarModulo(id, idCurso, dados) {
  const caminho = id ? `/modulos/${id}` : `/cursos/${idCurso}/modulos`;
  return requisitar(caminho, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
}

export function salvarAula(id, idModulo, dados) {
  const caminho = id ? `/aulas/${id}` : `/modulos/${idModulo}/aulas`;
  return requisitar(caminho, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
}

export function excluirCurso(id) {
  return requisitar(`/cursos/${id}`, { method: 'DELETE' });
}

export function excluirModulo(id) {
  return requisitar(`/modulos/${id}`, { method: 'DELETE' });
}

export function excluirAula(id) {
  return requisitar(`/aulas/${id}`, { method: 'DELETE' });
}
