import ModuloExpansivel from './componentes/ModuloExpansivel';
import PesquisaConteudo from './componentes/PesquisaConteudo';
import { correspondeAoNome } from './servicos/pesquisaConteudo';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import useCarregamento from './hooks/useCarregamento';
import * as servico from './servicos/servicoAluno';
import CabecalhoAulas from './componentes/CabecalhoAulas';
import { useAutenticacao } from '../../contextos/useAutenticacao';


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

  return <LayoutAulas>
    <Link className="btn btn-link" to="/aluno/cursos">Voltar aos cursos</Link>
    <EstadoCarregamento carga={carga} />
    {carga.carregando ? null : carga.erro ? null : carga.dados ? <>
      <CabecalhoAulas etiqueta="Área do aluno · Seu curso" titulo={carga.dados.curso.titulo} descricao={carga.dados.curso.descricao}>
        <div className="aulas-indicadores"><span>{carga.dados.modulos.length} módulos</span><span>{carga.dados.modulos.reduce((total, modulo) => total + modulo.aulas.length, 0)} aulas</span></div>
        <div className="aulas-progresso"><div><span>Seu progresso</span><strong>{concluidas} de {aulas.length} aulas concluídas</strong></div><progress max="100" value={percentual} aria-label="Progresso do curso" /><span>{percentual}% concluído</span></div>
      </CabecalhoAulas>
      <section className="catalogo-resultados" aria-labelledby="aulas-modulos-titulo">
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
    </> : null}
  </LayoutAulas>;
}
