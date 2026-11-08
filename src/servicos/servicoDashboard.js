import { requisitar } from './api';

const base = '/administracao/dashboard';

export const buscarResumoDashboard = () => requisitar(`${base}/resumo`);
export const buscarCursosMaisProcurados = () => requisitar(`${base}/cursos-mais-procurados`);
export const buscarUsuariosPorPerfil = () => requisitar(`${base}/usuarios-por-perfil`);
export function buscarMatriculasPorMes(meses = 12) {
  if (!Number.isInteger(meses) || meses < 1 || meses > 24) {
    throw new RangeError('O período deve ser um número inteiro entre 1 e 24 meses.');
  }
  return requisitar(`${base}/matriculas-por-mes?meses=${meses}`);
}
