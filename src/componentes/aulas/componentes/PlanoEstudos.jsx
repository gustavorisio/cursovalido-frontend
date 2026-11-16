import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import useCarregamento from '../hooks/useCarregamento';
import EstadoCarregamento from './EstadoCarregamento';
import { consultarPlano, rotaQuestionario } from '../servicos/servicoAprendizagem';

export default function PlanoEstudos({ idCurso }) {
  const carregar = useCallback(() => consultarPlano(idCurso), [idCurso]);
  const carga = useCarregamento(carregar);
  return <section className="plano-estudos" aria-labelledby="plano-estudos-titulo">
    <div className="catalogo-secao-cabecalho"><div><span className="aulas-etiqueta">Aprenda e confira seu entendimento</span><h2 id="plano-estudos-titulo">Seu plano de estudos</h2><p className="plano-descricao">Acompanhe suas avaliações e pontuações neste curso.</p></div></div>
    <EstadoCarregamento carga={carga} />
    {carga.dados && !carga.carregando && !carga.erro && <div className="plano-avaliacoes">
      {carga.dados.avaliacoes.length === 0 ? <p className="plano-vazio">O professor ainda não publicou avaliações para este curso.</p> : carga.dados.avaliacoes.map((item) => <article key={item.idModulo ?? 'diagnostico'}>
        <div className="plano-avaliacao-cabecalho"><span className="aulas-etiqueta">{item.idModulo ? 'Avaliação' : 'Avaliação do curso'}</span><span className={`plano-status${item.percentual == null ? '' : ' plano-status-respondido'}`}>{item.percentual == null ? 'Pendente' : 'Respondido'}</span></div>
        <h3>{item.titulo}</h3>
        <p className="plano-avaliacao-descricao">{item.idModulo ? 'Já assistiu todos os modulos? Inicie a avaliação que determina o seu conhecimento em pontuações.' : 'Responda às perguntas e confira sua pontuação.'}</p>
        <p className="plano-avaliacao-resultado">{item.percentual == null ? 'Ainda não respondido' : <><strong>{item.percentual}%</strong> de acertos na última tentativa</>}</p>
        <Link className={`btn ${item.percentual == null ? 'btn-primary' : 'btn-secondary'}`} to={rotaQuestionario('aluno', idCurso, item.idModulo)}>{item.percentual == null ? (item.idModulo ? 'Iniciar avaliação' : 'Responder') : 'Ver resultado e refazer'}</Link>
      </article>)}
    </div>}
  </section>;
}
