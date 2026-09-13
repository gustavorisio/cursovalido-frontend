import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PaginaForum from './componentes/forum/PaginaForum';
import CabecalhoForum from './componentes/forum/componentes/CabecalhoForum';
import { USUARIOS_MOCK } from './componentes/forum/dados/usuariosMock';
import './componentes/forum/Forum.css';

function Home() {
  return (
    <div className="app-container">
      <CabecalhoForum
        usuarios={USUARIOS_MOCK}
        usuarioAtual={USUARIOS_MOCK[0]}
        onMudarUsuario={() => {}}
      />

      <main className="main-content home-content">
        <section className="home-intro">
          <p className="home-eyebrow">Curso válido</p>
          <h1 className="home-title">Aprenda no seu ritmo</h1>
          <p className="home-description">
            Conteúdos, aulas e discussões para evoluir na área de tecnologia.
          </p>
        </section>

        <section className="video-section" aria-label="Vídeo em destaque">
          <div className="video-frame">
            <iframe
              src="https://www.youtube.com/embed/e15WSmF2Ams"
              title="Vídeo em destaque do Curso Válido"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Termos de Uso</span>
        <span>Contato</span>
        <span>Sobre o curso_valido.dev</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forum" element={<PaginaForum />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}