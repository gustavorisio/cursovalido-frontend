import { useAutenticacao } from '../../contextos/useAutenticacao';
import Paginacao from '../comuns/Paginacao';
import { correspondeAoNome } from './servicos/pesquisaConteudo';
import { useCallback, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import useCarregamento from './hooks/useCarregamento';
import * as servico from './servicos/servicoAluno';
import FiltroTema from './componentes/FiltroTema';
import CapaCurso from './componentes/CapaCurso';
import { correspondeAoTema } from './servicos/filtroTema';
import PainelNivel from './componentes/PainelNivel';
import BannerCursos from './componentes/BannerCursos';


export default function PaginaCatalogo() {
  const [parametros] = useSearchParams();
  return <Catalogo key={parametros.toString()} parametros={parametros} />;
}

function Catalogo({ parametros }) {
  const { autenticado, sessao } = useAutenticacao();
  const aluno = autenticado && sessao?.perfil === 'ALUNO';
  const carregarCatalogo = useCallback(async () => {
    if (!aluno) return { cursos: await servico.listarCatalogoPublico(), matriculas: [] };
    const [cursos, matriculas] = await Promise.all([servico.listarCatalogo(), servico.listarMatriculas()]);
    return { cursos, matriculas };
  }, [aluno]);
  const carga = useCarregamento(carregarCatalogo);
  const [novasMatriculas, setNovasMatriculas] = useState([]);
  const [somenteMatriculados, setSomenteMatriculados] = useState(false);
  const [processando, setProcessando] = useState(null);
  const matriculaEmAndamento = useRef(false);
  const [busca, setBusca] = useState(() => parametros.get('q') ?? '');
  const [temaSelecionado, setTemaSelecionado] = useState(() => parametros.get('tema') ?? '');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const matriculas = [...(carga.dados?.matriculas ?? []), ...novasMatriculas];
  const catalogo = carga.dados?.cursos ?? [];
  const cursos = catalogo.filter((curso) => {
    if (!correspondeAoNome(curso.titulo, busca)) return false;
    if (!correspondeAoTema(curso, temaSelecionado)) return false;
    if (!somenteMatriculados) return true;
    return matriculas.some((item) => item.idCurso === curso.id);
  });

  function mostrarTodos() {
    setTemaSelecionado('');
    setBusca('');
    setSomenteMatriculados(false);
  }

  async function matricular(curso) {
    if (!aluno || processando !== null || matriculaEmAndamento.current) return;
    matriculaEmAndamento.current = true;
    setProcessando(curso.id);
    setErro('');
    setMensagem('');
    try {
      const matricula = await servico.matricular(curso.id);
      setNovasMatriculas((itens) => [...itens, matricula]);
      setMensagem(`Matrícula em “${curso.titulo}” realizada. Você já pode acessar as aulas.`);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      matriculaEmAndamento.current = false; setProcessando(null);
    }
  }

  return <LayoutAulas className="pagina-catalogo">
    <BannerCursos />
    <header className="!mx-auto flex !w-full !max-w-[720px] !flex-col !items-center !gap-6 !border-0 !pb-0 text-center">
      <h1 className="!m-0 !text-4xl !font-normal !leading-tight !tracking-tight text-slate-800 sm:!text-[44px]">Cursos</h1>
      <div role="search" className="!m-0 !w-full !max-w-[560px]">
        <label className="sr-only" htmlFor="busca-catalogo">Pesquisar por nome</label>
        <input id="busca-catalogo" type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Pesquisar por nome" className="!min-h-14 !w-full !min-w-0 !rounded-md !border !border-slate-400 !bg-white !px-4 !py-3 !text-base !text-slate-800 !shadow-sm !outline-none placeholder:!text-slate-500 focus:!border-blue-600 focus:!ring-2 focus:!ring-blue-100" />
      </div>
    </header>
    {aluno && <div className="!mx-auto !w-full !max-w-[1120px]"><PainelNivel /></div>}
    <section className="!mx-auto !w-full !max-w-[1120px]" id="catalogo-cursos" aria-label="Catálogo de cursos">
      <div className="!mb-6 flex flex-wrap items-end justify-between gap-4">
        {aluno && <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Continue aprendendo</span><h2 id="catalogo-cursos-titulo" className="!mb-0 !mt-1 !text-2xl !font-medium text-slate-800">Explore nossos cursos</h2></div>}
        <div className="flex flex-wrap items-center gap-3">
          {aluno && <div className="catalogo-abas">
            <button type="button" aria-pressed={!somenteMatriculados} onClick={() => setSomenteMatriculados(false)}>Catálogo</button>
            <button type="button" aria-pressed={somenteMatriculados} onClick={() => setSomenteMatriculados(true)}>Minhas matrículas</button>
          </div>}
          <FiltroTema valor={temaSelecionado} onAlterar={setTemaSelecionado} className="!my-0" labelClassName="!sr-only" rowClassName="!flex-nowrap" selectClassName="!min-h-10 !w-[220px] !rounded-md !border !border-slate-300 !bg-white !px-3 !text-slate-700 !shadow-sm" />
        </div>
      </div>
      {erro ? <p className="mensagem-erro" role="alert">{erro}</p> : null}
      {mensagem ? <p className="mensagem-sucesso" role="status">{mensagem}</p> : null}
      {!carga.carregando && !carga.erro && <p className="catalogo-contagem" role="status">{cursos.length} {cursos.length === 1 ? 'curso encontrado' : 'cursos encontrados'}{temaSelecionado && <> neste tema · <button type="button" onClick={() => setTemaSelecionado('')}>Limpar tema</button></>}</p>}
      <EstadoCarregamento carga={carga} />
      {carga.carregando ? null : carga.erro ? null : <>
        {cursos.length === 0 ? <div className="card empty-list">{busca.trim() ? 'Nenhum curso encontrado para esta pesquisa.' : somenteMatriculados ? 'Você ainda não possui matrículas com estes filtros.' : temaSelecionado ? 'Ainda não há cursos disponíveis com estes filtros.' : 'Nenhum curso disponível no momento.'}{(temaSelecionado || busca || somenteMatriculados) && <button className="btn btn-link catalogo-limpar" type="button" onClick={mostrarTodos}>Ver todos os cursos</button>}</div> : null}
        <Paginacao key={JSON.stringify([busca, temaSelecionado, somenteMatriculados])} itens={cursos} tamanho={9} rotulo="Páginas de cursos">
          {(cursosDaPagina) => <div className="!grid !grid-cols-1 !gap-x-6 !gap-y-6 sm:!grid-cols-2 xl:!grid-cols-3">
            {cursosDaPagina.map((curso) => {
              const matriculado = matriculas.some((item) => item.idCurso === curso.id);
              return <article className="!m-0 !flex !w-full !max-w-none !flex-col !gap-0 !overflow-hidden !rounded-2xl !border !border-slate-200 !bg-white !p-0 !shadow-md !transition-shadow hover:!shadow-xl" key={curso.id}>
                <CapaCurso curso={curso} className="!m-0 !aspect-[11/5] !max-h-none !w-full !overflow-hidden !bg-white" />
                <div className="!flex !flex-1 !flex-col !px-5 !pb-0 !pt-4">
                  <div className="!mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{curso.nomeTema || 'Tecnologia'}</span>{matriculado && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">Matriculado</span>}</div>
                  <h2 className="!mb-2 !mt-0 !text-lg !font-semibold !leading-snug text-slate-800">{curso.titulo}</h2>
                  <p className="!mb-0 line-clamp-3 text-sm leading-6 text-slate-600">{curso.descricao}</p>
                </div>
                <footer className="!mt-auto !px-5 !pb-5 !pt-4">
                    {!autenticado ? <Link className="!flex !w-full !min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" to="/login">Entrar para acessar</Link> : !aluno ? <Link className="!flex !w-full !min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" to="/cursos">Ir para meus cursos</Link> : matriculado ? <Link className="!flex !w-full !min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" to={`/aluno/cursos/${curso.id}`}>Acessar curso</Link> : <button className="!flex !w-full !min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60" type="button" disabled={processando !== null} onClick={() => matricular(curso)}>{processando === curso.id ? 'Matriculando...' : 'Matricular-se gratuitamente'}</button>}
                </footer>
              </article>;
            })}
          </div>}
        </Paginacao>
      </>}
    </section>
  </LayoutAulas>;
}
