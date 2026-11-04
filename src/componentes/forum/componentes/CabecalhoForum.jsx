import { Link, NavLink } from 'react-router-dom';
import { useAutenticacao } from '../../../contextos/useAutenticacao';
import { useRestricoes } from '../../../contextos/useRestricoes';

export default function CabecalhoForum() {
  const { sessao, sair } = useAutenticacao();
  const ehAdministrador = sessao?.perfil === 'ADMINISTRADOR';
  const { restricoes } = useRestricoes();
  const nomes = { CONTA: 'Acesso à conta', FORUM: 'Acesso ao fórum', TOPICOS: 'Acesso a tópicos e comentários', COMENTARIOS: 'Acesso a tópicos e comentários' };

  return (
    <header className="header">
      <Link className="brand-link" to="/forum">Curso Válido</Link>
      <nav className="nav-group">
        <NavLink className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to="/forum">Fórum</NavLink>
        {sessao?.perfil === 'PROFESSOR' ? <NavLink className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to="/professor/cursos">Meus cursos</NavLink> : null}
        {sessao?.perfil === 'ALUNO' ? <NavLink className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to="/aluno/cursos">Cursos</NavLink> : null}
        {ehAdministrador ? <Link className="nav-link" to="/administracao">Administração</Link> : null}
        {ehAdministrador ? <NavLink className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to="/administracao/cursos">Cursos e aulas</NavLink> : null}
        <Link className="nav-link" to="/configuracoes">Configurações</Link>
        <span className="identidade-usuario">{sessao?.nome} · {sessao?.perfil}</span>
        <button className="btn btn-secondary btn-small" type="button" onClick={sair}>Sair</button>
      </nav>
      {restricoes.length > 0 ? <div className="mensagem-erro w-full" role="status">
        {restricoes.map((item) => <p key={item.id}>{nomes[item.escopo]} restrito: {item.motivo} · {item.expiraEm ? `Até ${new Date(item.expiraEm).toLocaleString('pt-BR')}` : 'Permanente, até revogação'}</p>)}
      </div> : null}
    </header>
  );
}
