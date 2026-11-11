import Cabecalho from './componentes/comuns/Cabecalho';
import PaginaSuporte from './componentes/suporte/PaginaSuporte';
import InicioCursos from './componentes/aulas/InicioCursos';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, matchPath } from 'react-router-dom';
import PaginaForum from './componentes/forum/PaginaForum';
import PaginaGestaoCursos from './componentes/aulas/PaginaGestaoCursos';
import PaginaCatalogo from './componentes/aulas/PaginaCatalogo';
import PaginaCursoAluno from './componentes/aulas/PaginaCursoAluno';
import PaginaAulaAluno from './componentes/aulas/PaginaAulaAluno';
import PaginaAulasAdministrador from './componentes/aulas/PaginaAulasAdministrador';
import Inicio from './paginas/Inicio';
import Login from './paginas/Login';
import Cadastro from './paginas/Cadastro';
import TermosDeUso from './paginas/TermosDeUso';
import PoliticaDePrivacidade from './paginas/PoliticaDePrivacidade';
import ConfirmacaoEmail from './paginas/ConfirmacaoEmail';
import SolicitarAlteracaoSenha from './paginas/SolicitarAlteracaoSenha';
import AlterarSenha from './paginas/AlterarSenha';
import Configuracoes from './paginas/Configuracoes';
import Administracao from './paginas/Administracao';
import CadastroConvite from './paginas/CadastroConvite';
import RotaProtegida from './componentes/autenticacao/RotaProtegida';
import { AutenticacaoProvedor } from './contextos/ContextoAutenticacao';

const Dashboard = lazy(() => import('./paginas/Dashboard'));
const Noticias = lazy(() => import('./paginas/Noticias'));
const Noticia = lazy(() => import('./paginas/Noticia'));
const EditorNoticia = lazy(() => import('./paginas/EditorNoticia'));

const titulosPaginas = [
  ['/', 'Início'],
  ['/login', 'Login'],
  ['/cadastro', 'Cadastro'],
  ['/convites/cadastro', 'Cadastro por convite'],
  ['/confirmacao-email', 'Confirmação de email'],
  ['/solicitar-alteracao-senha', 'Recuperar senha'],
  ['/redefinir-senha', 'Redefinir senha'],
  ['/termos', 'Termos de uso'],
  ['/termos-aceite', 'Aceite dos termos'],
  ['/termos-aceite.html', 'Aceite dos termos'],
  ['/privacidade', 'Política de privacidade'],
  ['/politica-privacidade.html', 'Política de privacidade'],
  ['/configuracoes', 'Configurações'],
  ['/administracao', 'Administração'],
  ['/administracao/dashboard', 'Dashboard'],
  ['/administracao/termos', 'Administrar termos'],
  ['/administracao/privacidade', 'Administrar privacidade'],
  ['/administracao/usuarios', 'Usuários'],
  ['/administracao/convites', 'Convites'],
  ['/administracao/cursos/:idCurso/aulas/:idAula', 'Administrar aula'],
  ['/administracao/cursos/*', 'Administrar cursos'],
  ['/professor/cursos/:idCurso/modulos/:idModulo/aulas', 'Gerenciar aulas'],
  ['/professor/cursos/:idCurso/modulos', 'Gerenciar módulos'],
  ['/professor/cursos', 'Gerenciar cursos'],
  ['/aluno/cursos/:idCurso/aulas/:idAula', 'Aula'],
  ['/aluno/cursos/:idCurso', 'Curso'],
  ['/aluno/cursos', 'Catálogo de cursos'],
  ['/cursos', 'Cursos'],
  ['/suporte', 'Suporte'],
  ['/forum', 'Fórum'],
  ['/noticias/nova', 'Publicar notícia'],
  ['/noticias/:id/editar', 'Editar notícia'],
  ['/noticias/:id', 'Notícia'],
  ['/noticias', 'Notícias'],
];

function TituloPagina() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pagina = titulosPaginas.find(([caminho]) => matchPath(caminho, pathname))?.[1] ?? 'Início';
    document.title = `Curso Valido - ${pagina}`;
  }, [pathname]);

  return null;
}

function RedirecionarTermosPendentes() {
  const navegar = useNavigate();

  useEffect(() => {
    function redirecionar() {
      navegar('/termos-aceite?reativacao=true', { replace: true });
    }
    globalThis.addEventListener?.('curso-valido-termos-pendentes', redirecionar);
    return () => globalThis.removeEventListener?.('curso-valido-termos-pendentes', redirecionar);
  }, [navegar]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <TituloPagina />
      <div className="min-h-screen bg-page">
        <AutenticacaoProvedor><Cabecalho /><RedirecionarTermosPendentes /><Suspense fallback={<p role="status" className="main-content">Carregando página...</p>}><Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/convites/cadastro" element={<CadastroConvite />} />
          <Route path="/confirmacao-email" element={<ConfirmacaoEmail />} />
          <Route path="/solicitar-alteracao-senha" element={<SolicitarAlteracaoSenha />} />
          <Route path="/redefinir-senha" element={<AlterarSenha />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/termos-aceite" element={<TermosDeUso />} />
          <Route path="/termos-aceite.html" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="/politica-privacidade.html" element={<PoliticaDePrivacidade />} />
          <Route element={<RotaProtegida />}><Route path="/configuracoes" element={<Configuracoes />} /></Route>
          <Route element={<RotaProtegida perfis={['ADMINISTRADOR']} />}>
            <Route path="/administracao/dashboard" element={<Dashboard />} />
            <Route path="/noticias/nova" element={<EditorNoticia />} />
            <Route path="/noticias/:id/editar" element={<EditorNoticia />} />
            <Route path="/administracao" element={<Administracao key="geral" />} />
            <Route path="/administracao/termos" element={<Administracao key="termos" tela="termos" />} />
            <Route path="/administracao/privacidade" element={<Administracao key="privacidade" tela="privacidade" />} />
            <Route path="/administracao/usuarios" element={<Administracao key="usuarios" tela="usuarios" />} />
            <Route path="/administracao/convites" element={<Administracao key="convites" tela="convites" />} />
            <Route path="/administracao/cursos" element={<PaginaAulasAdministrador />} />
            <Route path="/administracao/cursos/:idCurso" element={<PaginaAulasAdministrador />} />
            <Route path="/administracao/cursos/:idCurso/aulas/:idAula" element={<PaginaAulasAdministrador />} />
          </Route>
          <Route element={<RotaProtegida perfis={['PROFESSOR']} />}>
            <Route path="/professor/cursos" element={<PaginaGestaoCursos />} />
            <Route path="/professor/cursos/:idCurso/modulos" element={<PaginaGestaoCursos />} />
            <Route path="/professor/cursos/:idCurso/modulos/:idModulo/aulas" element={<PaginaGestaoCursos />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route element={<RotaProtegida perfis={['ALUNO']} />}>
            <Route path="/aluno/cursos" element={<PaginaCatalogo />} />
            <Route path="/aluno/cursos/:idCurso" element={<PaginaCursoAluno />} />
            <Route path="/aluno/cursos/:idCurso/aulas/:idAula" element={<PaginaAulaAluno />} />
          </Route>
          <Route path="/cursos" element={<InicioCursos />} />
          <Route path="/suporte" element={<PaginaSuporte />} />
          <Route path="/forum" element={<PaginaForum />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/noticias/:id" element={<Noticia />} />
        </Routes></Suspense></AutenticacaoProvedor>
      </div>
    </BrowserRouter>
  );
}
