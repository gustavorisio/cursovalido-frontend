import { Link } from 'react-router-dom';
import { useAutenticacao } from '../../../contextos/useAutenticacao';

export default function CabecalhoForum() {
  const { sessao, sair } = useAutenticacao();
  const ehAdministrador = sessao?.perfil === 'ADMINISTRADOR';

  return (
    <header className="header">
      <Link className="brand-link" to="/forum">Curso Válido</Link>
      <nav className="nav-group">
        <Link className="nav-link active" to="/forum">Fórum</Link>
        {ehAdministrador && <Link className="nav-link" to="/administracao">Administração</Link>}
        <Link className="nav-link" to="/configuracoes">Configurações</Link>
        <span className="identidade-usuario">{sessao?.nome} · {sessao?.perfil}</span>
        <button className="btn btn-secondary btn-small" type="button" onClick={sair}>Sair</button>
      </nav>
    </header>
  );
}