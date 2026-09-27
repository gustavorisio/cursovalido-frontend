import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/useAutenticacao';

export default function RotaProtegida({ perfis }) {
  const { autenticado, sessao } = useAutenticacao();
  const localizacao = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ de: localizacao.pathname }} />;
  }

  if (perfis && !perfis.includes(sessao?.perfil)) {
    return <Navigate to="/forum" replace />;
  }

  return <Outlet />;
}
