import { Link, Navigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import VideoApresentacaoInicio from '../componentes/comuns/VideoApresentacaoInicio';
import { useAutenticacao } from '../contextos/useAutenticacao';
import './inicio.css';

const areas = [
  { tipo: 'aulas', titulo: 'Aulas online', texto: 'Cursos organizados em módulos e videoaulas. Continue de onde parou e, quando disponíveis, responda à avaliação do curso e aos questionários dos módulos.', destino: '/cursos', link: 'Ver cursos disponíveis' },
  { tipo: 'forum', titulo: 'Fórum de discussões', texto: 'Um espaço para tirar dúvidas, compartilhar experiências e conversar sobre tecnologia e programação em geral, incluindo assuntos das aulas. Entre na sua conta para consultar as discussões e participar.', destino: '/forum', link: 'Consultar discussões' }
];

export default function Inicio() {
  const { autenticado } = useAutenticacao();
  if (autenticado) return <Navigate to="/cursos" replace />;

  return <div className="pagina-inicio cv-home">
    <a className="cv-pular" href="#conteudo-inicio">Ir para o conteúdo</a>
    <main id="conteudo-inicio">
      <section className="cv-hero" aria-labelledby="cv-titulo">
        <div className="cv-hero-copy">
          <p className="cv-eyebrow">Aprender. Praticar. Compartilhar.</p>
          <h1 id="cv-titulo">Aprenda e compartilhe conhecimento em <span>tecnologia.</span></h1>
          <p className="cv-lead">Explore cursos gratuitos, acompanhe seu progresso e revise conteúdos com apoio de questionários. Participe do fórum para tirar dúvidas e trocar experiências sobre tecnologia e programação.</p>
          <div className="cv-hero-actions"><Link className="cv-button cv-button-primary" to="/cursos">Conhecer os cursos</Link><Link className="cv-button cv-button-outline" to="/forum">Visitar o fórum</Link></div>
          <p className="cv-hero-note">Já tem cadastro? <Link to="/login">Entre para continuar seus estudos</Link></p>
        </div>
      </section>
      <VideoApresentacaoInicio />

      <section className="cv-explore" aria-labelledby="cv-explore-titulo">
        <div className="cv-section-heading"><h2 id="cv-explore-titulo">Conheça o CursoVálido</h2><p>Estude com as aulas online e participe da comunidade no fórum de discussões.</p></div>
        <div className="cv-area-grid">{areas.map((area) => <article className={'cv-area cv-area-' + area.tipo} key={area.tipo}>
          <span className="cv-area-kicker">{area.tipo === 'aulas' ? 'ESTUDE' : 'CONVERSE'}</span><h3>{area.titulo}</h3><p>{area.texto}</p><Link to={area.destino}>{area.link}</Link>
        </article>)}</div>
      </section>

      <section className="cv-about" aria-labelledby="cv-about-titulo">
        <div className="cv-about-copy"><h2 id="cv-about-titulo">Sobre o CursoVálido</h2><p>O CursoVálido reúne cursos, acompanhamento de progresso, questionários e um fórum de discussões em uma plataforma de aprendizagem em tecnologia. Você pode estudar no seu ritmo, consultar indicações de revisão e trocar conhecimentos com a comunidade.</p><p>Desenvolvido como Projeto Final de Curso de Engenharia de Software da Universidade de Mogi das Cruzes, o projeto integra recursos de estudo e participação entre usuários.</p></div>
        <aside className="cv-start"><h3>Comece pelo que desperta seu interesse</h3><p>Crie sua conta para se matricular gratuitamente nos cursos, acompanhar seu progresso e participar do fórum.</p><Link className="cv-button cv-button-primary" to="/cadastro">Fazer meu cadastro</Link><span>Já tem cadastro? <Link to="/login">Entrar</Link></span></aside>
      </section>
    </main>
    <Rodape />
  </div>;
}
