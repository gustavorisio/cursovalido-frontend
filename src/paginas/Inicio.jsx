import { Link, Navigate } from 'react-router-dom';
import BannerCursos from '../componentes/aulas/componentes/BannerCursos';
import Rodape from '../componentes/comuns/Rodape';
import VideoApresentacaoInicio from '../componentes/comuns/VideoApresentacaoInicio';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function Inicio() {
  const { autenticado, sessao } = useAutenticacao();
  if (autenticado) {
    const destino = sessao?.perfil === 'ADMINISTRADOR' ? '/administracao/cursos' : sessao?.perfil === 'PROFESSOR' ? '/professor/cursos' : '/aluno/cursos';
    return <Navigate to={destino} replace />;
  }

  return <div className="app-container pagina-inicio">
    <a href="#conteudo-inicio" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-blue-700 focus:shadow-lg">Ir para o conteúdo</a>
    <main id="conteudo-inicio" className="main-content inicio-conteudo">
      <BannerCursos mostrarLogin />
      <VideoApresentacaoInicio />
      <section aria-labelledby="sobre-curso-valido" className="mx-auto w-full max-w-[1120px]">
        <div className="mb-5 max-w-3xl">
          <h2 id="sobre-curso-valido" className="m-0 text-2xl font-semibold text-slate-800">Aprenda no seu ritmo, com orientação em cada etapa</h2>
          <p className="mb-0 mt-2 text-base leading-7 text-slate-600">O Curso Válido é uma plataforma gratuita para adultos que estão começando em tecnologia. Encontre um percurso organizado para estudar, praticar e acompanhar seu avanço.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="m-0 text-lg font-semibold text-slate-800">Conteúdo em sequência</h3>
            <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">Cursos organizados em módulos e aulas ajudam você a seguir uma trilha de aprendizagem.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="m-0 text-lg font-semibold text-slate-800">Prática com retorno</h3>
            <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">Faça questionários por módulo e avaliações dos cursos, veja a correção e a explicação de cada questão e tente novamente para revisar o conteúdo.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="m-0 text-lg font-semibold text-slate-800">Progresso acompanhado</h3>
            <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">Retome os vídeos do ponto em que parou e consulte no plano de estudos as avaliações disponíveis e o resultado da tentativa mais recente.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="m-0 text-lg font-semibold text-slate-800">Gamificação para acompanhar sua evolução</h3>
            <p className="mb-0 mt-2 text-sm leading-6 text-slate-600">Ao concluir todas as aulas ativas de um curso, você ganha XP uma vez: 100 pontos mais 10 por aula, até 500 por curso. Acumule pontos para avançar de nível e acompanhar seu percurso; XP não é nota ou certificado.</p>
          </article>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-[1120px] gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div><h2 className="m-0 text-xl font-semibold text-slate-800">Dúvidas também fazem parte do aprendizado</h2><p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-slate-600">Na comunidade do Curso Válido, estudantes podem trocar perguntas e conversar sobre os conteúdos dos cursos.</p></div>
        <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-full border border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-700 no-underline transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Conhecer a plataforma</Link>
      </section>
    </main>
    <Rodape />
  </div>;
}
