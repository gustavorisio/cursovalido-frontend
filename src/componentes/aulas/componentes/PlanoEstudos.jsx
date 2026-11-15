import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import useCarregamento from '../hooks/useCarregamento';
import EstadoCarregamento from './EstadoCarregamento';
import { consultarPlano, rotaQuestionario } from '../servicos/servicoAprendizagem';

export default function PlanoEstudos({ idCurso }) {
  const carregar = useCallback(() => consultarPlano(idCurso), [idCurso]);
  const carga = useCarregamento(carregar);
  return <section className="plano-estudos" aria-labelledby="plano-estudos-titulo">
    <div className="catalogo-secao-cabecalho"><div><span className="aulas-etiqueta">Aprenda e confira seu entendimento</span><h2 id="plano-estudos-titulo">Seu plano de estudos</h2><p className="plano-descricao">Confira o que você já sabe e encontre as aulas que precisam de uma nova revisão.</p></div></div>
    <EstadoCarregamento carga={carga} />
    {carga.dados && !carga.carregando && !carga.erro && <>
      {carga.dados.avaliacoes.length === 0 ? <p className="plano-vazio">O professor ainda não publicou avaliações para este curso.</p> : <div className="plano-avaliacoes">{carga.dados.avaliacoes.map((item) => <article key={item.idModulo ?? 'diagnostico'}>
        <div className="plano-avaliacao-cabecalho"><span className="aulas-etiqueta">{item.idModulo ? 'Questionário do módulo' : 'Diagnóstico inicial'}</span><span className={`plano-status${item.percentual == null ? '' : ' plano-status-respondido'}`}>{item.percentual == null ? 'Pendente' : 'Respondido'}</span></div>
        <h3>{item.titulo}</h3>
        <p className="plano-avaliacao-descricao">{item.idModulo ? 'Confira seu entendimento sobre as aulas deste módulo.' : 'Descubra seu ponto de partida e receba indicações para estudar.'}</p>
        <p className="plano-avaliacao-resultado">{item.percentual == null ? 'Ainda não respondido' : <><strong>{item.percentual}%</strong> de acertos na última tentativa</>}</p>
        <Link className={`btn ${item.percentual == null ? 'btn-primary' : 'btn-secondary'}`} to={rotaQuestionario('aluno', idCurso, item.idModulo)}>{item.percentual == null ? 'Responder' : 'Ver resultado e refazer'}</Link>
      </article>)}</div>}
      <div className="plano-revisoes-painel">
        <h3 className="plano-revisoes-titulo">Aulas para revisar</h3>
        {carga.dados.revisoes.length ? <><p className="plano-descricao">Retome estas aulas com base nas suas respostas mais recentes.</p><ul className="plano-revisoes">{carga.dados.revisoes.map((aula) => <li key={aula.idAula}><Link to={`/aluno/cursos/${idCurso}/aulas/${aula.idAula}`}><span>{aula.titulo}</span><span className="plano-revisao-acao">Revisar aula <span aria-hidden="true">→</span></span></Link></li>)}</ul></> : <p className="plano-descricao">{carga.dados.avaliacoes.some((a) => a.percentual != null) ? 'Nenhuma revisão indicada pelas suas respostas mais recentes.' : 'Responda ao diagnóstico ou a um questionário para receber indicações de revisão.'}</p>}
      </div>
    </>}
  </section>;
}
