import PaginaCatalogo from './PaginaCatalogo';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/useAutenticacao';

export default function InicioCursos() {
  const { sessao, autenticado } = useAutenticacao();
  const { search } = useLocation();
  if (!autenticado) return <PaginaCatalogo />;
  const destino = sessao?.perfil === 'ADMINISTRADOR' ? '/administracao/cursos' : sessao?.perfil === 'PROFESSOR' ? '/professor/cursos' : '/aluno/cursos';
  return <Navigate to={`${destino}${search}`} replace />;
}
