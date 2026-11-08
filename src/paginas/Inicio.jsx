import { Link, Navigate } from 'react-router-dom';
import lobo from '../assets/hero.png';
import Rodape from '../componentes/comuns/Rodape';
import { useAutenticacao } from '../contextos/useAutenticacao';
import './inicio.css';

const areas = [
  { tipo: 'aulas', titulo: 'Aulas online', texto: 'Cursos de tecnologia e programação organizados em módulos. Assista às aulas e acompanhe seu progresso.', destino: '/cursos', link: 'Ver cursos disponíveis' },
  { tipo: 'forum', titulo: 'Fórum de discussões', texto: 'Um espaço para perguntar, responder e conversar sobre o conteúdo das aulas com alunos e professores.', destino: '/forum', link: 'Consultar discussões' },
  { tipo: 'noticias', titulo: 'Notícias', texto: 'Publicações sobre tecnologia e programação para acompanhar o que acontece na área e complementar os estudos.', destino: '/noticias', link: 'Ler últimas publicações' }
];

function IconeArea({ tipo }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tipo === 'aulas' ? <><path d="M3 5h6a4 4 0 0 1 3 1.5A4 4 0 0 1 15 5h6v15h-6a4 4 0 0 0-3 1 4 4 0 0 0-3-1H3Z" /><path d="M12 7v14" /></> : tipo === 'forum' ? <><path d="M21 11a8 8 0 0 1-8 8H8l-5 3v-7a8 8 0 0 1 8-12h2a8 8 0 0 1 8 8Z" /><path d="M8 10h8M8 14h5" /></> : <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M7 8h10M7 12h4M7 16h4M15 12h2M15 16h2" /></>}
  </svg>;
}

export default function Inicio() {
  const { autenticado } = useAutenticacao();
  if (autenticado) return <Navigate to="/cursos" replace />;

  return <div className="pagina-inicio cv-home">
    <a className="cv-pular" href="#conteudo-inicio">Ir para o conteúdo</a>
    <main id="conteudo-inicio">
      <section className="cv-hero" aria-labelledby="cv-titulo">
        <div className="cv-hero-copy">
          <p className="cv-eyebrow">CursoVálido · Aulas, fórum e notícias</p>
          <h1 id="cv-titulo">Estude tecnologia<br />e programação.</h1>
          <p className="cv-lead">Acesse cursos com videoaulas organizadas em módulos e acompanhe seu progresso. No fórum, converse com alunos e professores sobre suas dúvidas. Nas notícias, acompanhe publicações sobre tecnologia e programação.</p>
          <div className="cv-hero-actions"><Link className="cv-button cv-button-primary" to="/cursos">Conhecer os cursos <span aria-hidden="true">→</span></Link><Link className="cv-button cv-button-outline" to="/forum">Visitar o fórum</Link></div>
          <p className="cv-hero-note">Já tem cadastro? <Link to="/login">Entre para continuar seus estudos</Link></p>
        </div>
        <div className="cv-media">
          <div className="cv-media-heading"><span className="cv-media-dot" aria-hidden="true" />Conteúdo em vídeo<span>YouTube</span></div>
          <div className="cv-video"><iframe src="https://www.youtube.com/embed/e15WSmF2Ams" title="Vídeo sobre aprendizado de tecnologia" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
          <div className="cv-media-footer"><strong>Videoaulas no CursoVálido</strong><span>Vídeos do YouTube integrados às aulas.</span></div>
        </div>
      </section>

      <section className="cv-explore" aria-labelledby="cv-explore-titulo">
        <div className="cv-section-heading"><div><p className="cv-eyebrow">Conheça a plataforma</p><h2 id="cv-explore-titulo">O que você encontra no CursoVálido</h2></div><p>Escolha por onde começar seus estudos.</p></div>
        <div className="cv-area-grid">{areas.map((area) => <article className={'cv-area cv-area-' + area.tipo} key={area.tipo}>
          <div className="cv-area-icon"><IconeArea tipo={area.tipo} /></div><h3>{area.titulo}</h3><p>{area.texto}</p><Link to={area.destino}>{area.link}<span aria-hidden="true">→</span></Link>
        </article>)}</div>
      </section>

      <section className="cv-about" aria-labelledby="cv-about-titulo">
        <div className="cv-about-image"><img src={lobo} alt="Lobo, mascote do CursoVálido" width="250" height="250" /></div>
        <div className="cv-about-copy"><p className="cv-eyebrow">Sobre o CursoVálido</p><h2 id="cv-about-titulo">Conteúdo organizado.<br />Espaço para tirar dúvidas.</h2><p>O CursoVálido é uma plataforma educacional voltada a quem estuda tecnologia e programação. Os cursos reúnem videoaulas em módulos, enquanto o fórum permite discutir os assuntos com outros alunos e professores.</p><p>O projeto foi desenvolvido no curso de Engenharia de Software da Universidade de Mogi das Cruzes, com a proposta de reunir estudo, informação e discussão em um ambiente acessível.</p></div>
        <aside className="cv-start"><h3>Comece a estudar</h3><p>Consulte o catálogo, escolha um curso e crie sua conta para acessar a área do aluno.</p><Link className="cv-button cv-button-primary" to="/cadastro">Fazer meu cadastro</Link><span>Já tem cadastro? <Link to="/login">Entrar</Link></span></aside>
      </section>
    </main>
    <Rodape />
  </div>;
}
