import { Link } from 'react-router-dom';
import useCarregamento from '../hooks/useCarregamento';
import { listarTemas } from '../servicos/servicoTemas';
import Paginacao from '../../comuns/Paginacao';

export default function GradeTemas({ titulo = 'Navegue por tema', descricao, exibirTodos = true }) {
  const carga = useCarregamento(listarTemas);
  return <section aria-labelledby="temas-titulo" className="mx-auto w-full max-w-[1120px]">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><h2 id="temas-titulo" className="m-0 text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl">{titulo}</h2>{descricao && <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-slate-600">{descricao}</p>}</div>
      {exibirTodos && <Link to="/cursos" className="inline-flex min-h-10 items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Todos os cursos</Link>}
    </div>
    {carga.carregando && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Carregando temas...</p>}
    {carga.erro && <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">Não foi possível carregar os temas. <button className="ml-2 font-semibold underline" type="button" onClick={carga.tentarNovamente}>Tentar novamente</button></div>}
    {!carga.carregando && !carga.erro && (carga.dados ?? []).length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Ainda não há temas publicados. Eles aparecerão aqui assim que forem cadastrados.</p>}
    {(carga.dados ?? []).length > 0 && <Paginacao key={(carga.dados ?? []).map((tema) => tema.id).join(',')} itens={carga.dados} tamanho={6} rotulo="Páginas de temas">
      {(temasDaPagina) => <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {temasDaPagina.map((tema) => <Link key={tema.id} to={`/cursos?tema=${encodeURIComponent(tema.id)}`} className="group flex min-h-40 flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-7 text-center text-slate-800 no-underline shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          <span className="max-w-[28ch] text-base font-medium leading-snug">{tema.nome}</span>
          <span className="text-sm font-medium text-blue-700 underline decoration-transparent underline-offset-4 transition group-hover:decoration-blue-700 group-focus-visible:decoration-blue-700">Ver cursos neste tema</span>
        </Link>)}
      </div>}
    </Paginacao>}
  </section>;
}
