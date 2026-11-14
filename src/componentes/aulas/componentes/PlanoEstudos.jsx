import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import useCarregamento from '../hooks/useCarregamento';
import EstadoCarregamento from './EstadoCarregamento';
import { consultarPlano, rotaQuestionario } from '../servicos/servicoAprendizagem';

export default function PlanoEstudos({ idCurso }) {
  const carregar = useCallback(() => consultarPlano(idCurso), [idCurso]);
  const carga = useCarregamento(carregar);
  return <section className="card plano-estudos" aria-labelledby="plano-estudos-titulo">
    <div className="catalogo-secao-cabecalho"><div><span className="aulas-etiqueta">Aprenda e confira seu entendimento</span><h2 id="plano-estudos-titulo">Seu plano de estudos</h2></div></div>
    <EstadoCarregamento carga={carga} />
    {carga.dados && !carga.carregando && !carga.erro && <>
      {carga.dados.avaliacoes.length === 0 ? <p className="texto-suave">O professor ainda não publicou avaliações para este curso.</p> : <div className="plano-avaliacoes">{carga.dados.avaliacoes.map((item) => <article key={item.idModulo ?? 'diagnostico'}><span className="aulas-etiqueta">{item.idModulo ? 'Questionário do módulo' : 'Diagnóstico inicial'}</span><h3>{item.titulo}</h3><p className="texto-suave">{item.percentual == null ? 'Ainda não respondido' : `${item.percentual}% de acertos na última tentativa`}</p><Link className="btn btn-secondary" to={rotaQuestionario('aluno', idCurso, item.idModulo)}>{item.percentual == null ? 'Responder' : 'Ver resultado e refazer'}</Link></article>)}</div>}
      <h3 className="plano-revisoes-titulo">Aulas para revisar</h3>
      {carga.dados.revisoes.length ? <ul className="plano-revisoes">{carga.dados.revisoes.map((aula) => <li key={aula.idAula}><Link to={`/aluno/cursos/${idCurso}/aulas/${aula.idAula}`}>{aula.titulo}</Link></li>)}</ul> : <p className="texto-suave">{carga.dados.avaliacoes.some((a) => a.percentual != null) ? 'Nenhuma revisão indicada pelas suas respostas mais recentes.' : 'Responda ao diagnóstico ou a um questionário para receber indicações de revisão.'}</p>}
    </>}
  </section>;
}
