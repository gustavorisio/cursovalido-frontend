import { Link, Navigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { useAutenticacao } from '../contextos/useAutenticacao';
import './inicio.css';

const areas = [
  { tipo: 'aulas', titulo: 'Aulas online', texto: 'Cursos de tecnologia e programação organizados em módulos. Assista às aulas e acompanhe seu progresso.', destino: '/cursos', link: 'Ver cursos disponíveis' },
  { tipo: 'forum', titulo: 'Fórum de discussões', texto: 'Um espaço para perguntar, responder e conversar sobre o conteúdo das aulas com alunos e professores.', destino: '/forum', link: 'Consultar discussões' },
  { tipo: 'noticias', titulo: 'Notícias', texto: 'Publicações sobre tecnologia e programação para acompanhar o que acontece na área e complementar os estudos.', destino: '/noticias', link: 'Ler últimas publicações' }
];

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
          <div className="cv-hero-actions"><Link className="cv-button cv-button-primary" to="/cursos">Conhecer os cursos</Link><Link className="cv-button cv-button-outline" to="/forum">Visitar o fórum</Link></div>
          <p className="cv-hero-note">Já tem cadastro? <Link to="/login">Entre para continuar seus estudos</Link></p>
        </div>
        <div className="cv-media">
          <div className="cv-media-heading">Conteúdo em vídeo<span>YouTube</span></div>
          <div className="cv-video"><iframe src="https://www.youtube.com/embed/e15WSmF2Ams" title="Vídeo sobre aprendizado de tecnologia" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
          <div className="cv-media-footer"><strong>Videoaulas no CursoVálido</strong><span>Vídeos do YouTube integrados às aulas.</span></div>
        </div>
      </section>

      <section className="cv-explore" aria-labelledby="cv-explore-titulo">
        <div className="cv-section-heading"><div><p className="cv-eyebrow">Conheça a plataforma</p><h2 id="cv-explore-titulo">O que você encontra no CursoVálido</h2></div><p>Escolha por onde começar seus estudos.</p></div>
        <div className="cv-area-grid">{areas.map((area) => <article className={'cv-area cv-area-' + area.tipo} key={area.tipo}>
          <h3>{area.titulo}</h3><p>{area.texto}</p><Link to={area.destino}>{area.link}</Link>
        </article>)}</div>
      </section>

      <section className="cv-about" aria-labelledby="cv-about-titulo">
        <div className="cv-about-copy"><p className="cv-eyebrow">Sobre o CursoVálido</p><h2 id="cv-about-titulo">Conteúdo organizado.<br />Espaço para tirar dúvidas.</h2><p>O CursoVálido é uma plataforma educacional voltada a quem estuda tecnologia e programação. Os cursos reúnem videoaulas em módulos, enquanto o fórum permite discutir os assuntos com outros alunos e professores.</p><p>O projeto foi desenvolvido no curso de Engenharia de Software da Universidade de Mogi das Cruzes, com a proposta de reunir estudo, informação e discussão em um ambiente acessível.</p></div>
        <aside className="cv-start"><h3>Comece a estudar</h3><p>Consulte o catálogo, escolha um curso e crie sua conta para acessar a área do aluno.</p><Link className="cv-button cv-button-primary" to="/cadastro">Fazer meu cadastro</Link><span>Já tem cadastro? <Link to="/login">Entrar</Link></span></aside>
      </section>
    </main>
    <Rodape />
  </div>;
}
