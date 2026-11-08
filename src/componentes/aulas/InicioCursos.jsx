import PaginaCatalogo from './PaginaCatalogo';
import { Navigate } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/useAutenticacao';

export default function InicioCursos() {
  const { sessao, autenticado } = useAutenticacao();
  if (!autenticado) return <PaginaCatalogo />;
  const destino = sessao?.perfil === 'ADMINISTRADOR' ? '/administracao/cursos' : sessao?.perfil === 'PROFESSOR' ? '/professor/cursos' : '/aluno/cursos';
  return <Navigate to={destino} replace />;
}
