import ModuloExpansivel from './componentes/ModuloExpansivel';
import PesquisaConteudo from './componentes/PesquisaConteudo';
import { correspondeAoNome } from './servicos/pesquisaConteudo';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import useCarregamento from './hooks/useCarregamento';
import * as servico from './servicos/servicoAluno';
import PlanoEstudos from './componentes/PlanoEstudos';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import CapaCurso from './componentes/CapaCurso';


export default function PaginaCursoAluno() {
  const { idCurso } = useParams();
  const { sessao } = useAutenticacao();
  return <CursoAluno key={`${sessao?.idUsuario}-${idCurso}`} idCurso={idCurso} />;
}

function CursoAluno({ idCurso }) {
  const carregar = useCallback(async () => {
    const [curso, modulos] = await Promise.all([servico.buscarCurso(idCurso), servico.listarModulos(idCurso)]);
    const conteudo = await Promise.all(modulos.map(async (modulo) => {
      const aulas = await servico.listarAulas(modulo.id);
      const aulasComProgresso = await Promise.all(aulas.map(async (aula) => ({
        ...aula,
        progresso: await servico.buscarProgresso(aula.id),
      })));
      return { ...modulo, aulas: aulasComProgresso };
    }));
    return { curso, modulos: conteudo };
  }, [idCurso]);
  const carga = useCarregamento(carregar);
  const [busca, setBusca] = useState('');
  const modulos = carga.dados?.modulos.map((modulo) => ({ ...modulo, aulas: modulo.aulas.filter((aula) => correspondeAoNome(aula.titulo, busca)) })).filter((modulo) => !busca.trim() || modulo.aulas.length > 0) ?? [];
  const aulas = carga.dados?.modulos.flatMap((modulo) => modulo.aulas) ?? [];
  const concluidas = aulas.filter((aula) => aula.progresso.concluida).length;
  const percentual = aulas.length ? Math.round(concluidas / aulas.length * 100) : 0;

  return <LayoutAulas className="pagina-detalhe-curso">
    <EstadoCarregamento carga={carga} />
    {carga.carregando ? null : carga.erro ? null : carga.dados ? <>
      <section className="card curso-visao-geral mx-auto mb-8 mt-0 w-full max-w-[1240px] bg-white p-6 sm:p-8" aria-labelledby="curso-titulo">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <h1 className="!mb-8 !mt-0 !text-3xl !font-normal !leading-tight text-slate-800 sm:!text-[42px]">Informações do curso</h1>
            <p className="!mb-2 text-sm text-slate-600">Curso online</p>
            <h2 id="curso-titulo" className="!mb-5 !mt-0 !text-2xl !font-normal !leading-snug text-slate-800 sm:!text-[32px]">{carga.dados.curso.titulo}</h2>
            <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-700"><span>{carga.dados.modulos.length} módulos</span><span>{aulas.length} aulas</span><span>{percentual}% concluído</span></div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600"><span className="font-medium text-blue-700">Seu progresso</span><strong className="font-medium text-slate-700">{concluidas} de {aulas.length} aulas concluídas</strong></div>
            <progress className="mt-3 h-2 w-full max-w-xl overflow-hidden rounded-full accent-blue-600" max="100" value={percentual} aria-label="Progresso do curso" />
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg"><CapaCurso curso={carga.dados.curso} className="!m-0 !aspect-[11/5] !max-h-none !w-full !overflow-hidden" /></div>
        </div>
      </section>
      <section className="catalogo-resultados card curso-conteudo" aria-labelledby="aulas-modulos-titulo">
        <nav aria-label="Seções do curso" className="mb-8 flex flex-wrap gap-x-7 gap-y-3 border-b border-slate-300 pb-4 text-sm font-medium">
          <a className="text-blue-700 no-underline hover:text-blue-800" href="#curso-progresso">Visão geral</a><a className="text-blue-700 no-underline hover:text-blue-800" href="#aulas-modulos-titulo">Conteúdo do curso</a><a className="text-blue-700 no-underline hover:text-blue-800" href="#curso-avaliacoes">Avaliações</a>
        </nav>
        <span id="curso-progresso" className="sr-only">Progresso: {percentual}%</span>
        <div className="catalogo-secao-cabecalho"><div><span className="aulas-etiqueta">Sua jornada de aprendizagem</span><h2 id="aulas-modulos-titulo">Módulos e aulas</h2></div></div>
        <PesquisaConteudo valor={busca} onAlterar={setBusca} label="Pesquisar aula por nome" />
        {busca.trim() && modulos.length === 0 && <p className="card empty-list" role="status">Nenhuma aula encontrada para esta pesquisa.</p>}
        {carga.dados.modulos.length === 0 ? <div className="card empty-list">Este curso ainda não possui módulos disponíveis.</div> : null}
        {modulos.map((modulo) => <ModuloExpansivel key={modulo.id} modulo={modulo} expandido={Boolean(busca.trim())}>
          <p className="content-text">{modulo.descricao}</p>
          {modulo.aulas.length === 0 ? <p className="texto-suave">Nenhuma aula disponível neste módulo.</p> : null}
          {modulo.aulas.map((aula) => <div className="aulas-linha" key={aula.id}>

            <div>
              <span className="aulas-etiqueta">Aula {aula.ordem}</span><h3>{aula.titulo}</h3>
              <p className="texto-suave">{aula.progresso.concluida ? 'Concluída' : aula.progresso.posicaoSegundos > 0 ? `Em andamento · posição salva: ${aula.progresso.posicaoSegundos}s` : 'Não iniciada'}</p>
            </div>
            <Link className="btn btn-secondary" to={`/aluno/cursos/${idCurso}/aulas/${aula.id}`}>{aula.progresso.posicaoSegundos > 0 ? 'Continuar aula' : 'Abrir aula'}</Link>
          </div>)}
        </ModuloExpansivel>)}
      </section>
      <div id="curso-avaliacoes"><PlanoEstudos idCurso={idCurso} /></div>
    </> : null}
  </LayoutAulas>;
}
