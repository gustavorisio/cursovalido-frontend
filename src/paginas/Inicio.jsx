import { Link, Navigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import hero from '../assets/hero.png';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function Inicio() {
  const { autenticado } = useAutenticacao();

  if (autenticado) return <Navigate to="/forum" replace />;

  return (
    <div className="pagina-inicio">
      <header className="inicio-header">
        <Link className="brand-link inicio-brand" to="/">Curso Válido</Link>
        <nav className="inicio-nav" aria-label="Navegação principal">
          <Link to="/login">Entrar</Link>
          <Link className="botao-destaque botao-inicio" to="/cadastro">Criar conta</Link>
        </nav>
      </header>
      <main>
        <section className="inicio-hero">
          <div className="inicio-hero-texto">
            <span className="marca-publica">APRENDA. PRATIQUE. EVOLUA.</span>
            <h1>Seu próximo passo em tecnologia começa aqui.</h1>
            <p className="texto-suave">Uma plataforma para aprender, trocar experiências e construir uma trajetória consistente na área de tecnologia.</p>
            <div className="inicio-acoes">
              <Link className="botao-destaque" to="/cadastro">Começar agora</Link>
              <Link className="botao-secundario" to="/login">Já tenho uma conta</Link>
            </div>
          </div>
          <img className="inicio-hero-imagem" src={hero} alt="Ilustração de camadas representando evolução" />
        </section>
        <section className="inicio-video" aria-labelledby="titulo-video">
          <div>
            <span className="marca-publica">CONHEÇA A PLATAFORMA</span>
            <h2 id="titulo-video">Aprenda no seu ritmo</h2>
            <p className="texto-suave">Assista às aulas, acompanhe seu progresso e participe de uma comunidade que também está aprendendo.</p>
          </div>
          <div className="video-wrapper">
            <iframe src="https://www.youtube.com/embed/e15WSmF2Ams" title="Introdução ao aprendizado de tecnologia" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </section>
        <section className="inicio-recursos" aria-label="Recursos da plataforma">
          <article><strong>Conteúdo prático</strong><p>Videoaulas e exercícios para transformar teoria em habilidade.</p></article>
          <article><strong>Comunidade</strong><p>Converse, tire dúvidas e compartilhe conhecimento no fórum.</p></article>
          <article><strong>Seu progresso</strong><p>Acompanhe sua evolução até a conclusão do curso e a certificação.</p></article>
        </section>
      </main>
      <Rodape />
    </div>
  );
}