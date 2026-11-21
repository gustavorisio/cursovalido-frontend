import { requisitar } from './api';

export const buscarGamificacao = () => requisitar('/aluno/gamificacao', { cache: 'no-store' });
export const buscarRankingAlunos = () => requisitar('/ranking/alunos', { cache: 'no-store' });
