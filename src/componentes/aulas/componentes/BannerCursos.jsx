import { Link } from 'react-router-dom';

export default function BannerCursos({ className = '', mostrarLogin = false }) {
  return <section aria-labelledby="banner-cursos-titulo" className={`mx-auto flex w-full max-w-[1280px] flex-col items-start rounded-2xl border border-slate-200 bg-white px-7 py-9 shadow-sm sm:px-10 sm:py-12 lg:px-14 ${className}`}>
    <span className="mb-3 text-xs font-semibold uppercase tracking-[.12em] text-blue-700">Aprendizagem gratuita em tecnologia</span>
    <h1 id="banner-cursos-titulo" className="m-0 max-w-[24ch] text-3xl font-normal leading-tight tracking-tight text-slate-800 sm:text-4xl">Aprenda tecnologia com um percurso claro</h1>
    <p className="mb-0 mt-4 max-w-[68ch] text-base leading-7 text-slate-600">O Curso Válido apoia adultos iniciantes com cursos organizados em módulos e aulas para estudar no seu ritmo.</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link to="/cursos" className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Acessar cursos</Link>
      {mostrarLogin && <Link to="/login" className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Entrar na plataforma</Link>}
    </div>
  </section>;
}
