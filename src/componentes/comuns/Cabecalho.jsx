import '../../paginas/inicio.css';
import lobo from '../../assets/hero.png';
import { Link, NavLink } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import { useRestricoes } from '../../contextos/useRestricoes';

export default function Cabecalho() {
  const { sessao, sair, autenticado } = useAutenticacao();
  const ehAdministrador = sessao?.perfil === 'ADMINISTRADOR';
  const { restricoes } = useRestricoes();
  const nomes = { CONTA: 'Acesso à conta', FORUM: 'Acesso ao fórum', TOPICOS: 'Acesso a tópicos e comentários', COMENTARIOS: 'Acesso a tópicos e comentários' };

  return (
    <header className="cv-header cv-home">
      <Link className="cv-logo" to="/" aria-label="CursoVálido — início"><img src={lobo} alt="" width="42" height="42" /><span>Curso<span>Válido</span></span></Link>
      <nav className="cv-nav" aria-label="Navegação principal">
        {!autenticado && <NavLink to="/" end>Início</NavLink>}
        <NavLink to={!autenticado ? '/cursos' : ehAdministrador ? '/administracao/cursos' : sessao?.perfil === 'PROFESSOR' ? '/professor/cursos' : '/aluno/cursos'}>Aulas online</NavLink>
        <NavLink to="/forum">Fórum</NavLink><NavLink to="/noticias">Notícias</NavLink>
        <NavLink to="/roadmap">Caminhos na tecnologia</NavLink>
        {ehAdministrador && <NavLink to="/administracao" end>Administração</NavLink>}
      </nav>
      <div className="cv-conta">
        {autenticado ? <><NavLink to="/configuracoes">Configurações</NavLink><button className="cv-button cv-button-primary" type="button" onClick={sair}>Sair</button></> : <><Link to="/login">Entrar</Link><Link className="cv-button cv-button-primary" to="/cadastro">Criar conta</Link></>}
      </div>
      {restricoes.length > 0 ? <div className="mensagem-erro w-full" role="status">
        {restricoes.map((item) => <p key={item.id}>{nomes[item.escopo]} restrito: {item.motivo} · {item.expiraEm ? `Até ${new Date(item.expiraEm).toLocaleString('pt-BR')}` : 'Permanente, até revogação'}</p>)}
      </div> : null}
    </header>
  );
}
