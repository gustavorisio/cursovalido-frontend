import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import LayoutAulas from './componentes/LayoutAulas';
import CabecalhoAulas from './componentes/CabecalhoAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import useCarregamento from './hooks/useCarregamento';
import { consultarQuestionario, responderQuestionario } from './servicos/servicoAprendizagem';
import './estilos/aprendizagem.css';

export default function PaginaQuestionarioAluno() {
  const { idCurso, idModulo } = useParams();
  const { sessao } = useAutenticacao();
  return <Questionario key={`${sessao?.idUsuario}-${idCurso}-${idModulo}`} idCurso={idCurso} idModulo={idModulo} />;
}

function Questionario({ idCurso, idModulo }) {
  const carregar = useCallback(() => consultarQuestionario('aluno', idCurso, idModulo), [idCurso, idModulo]);
  const carga = useCarregamento(carregar);
  return <LayoutAulas>
    <Link className="btn btn-link" to={`/aluno/cursos/${idCurso}`}>Voltar ao curso</Link>
    <CabecalhoAulas etiqueta="Confira seu entendimento" titulo={carga.dados?.titulo ?? 'Questionário do módulo'} descricao="Responda às perguntas e tente novamente até acertar todas. A porcentagem de acertos será exibida a cada tentativa." />
    <EstadoCarregamento carga={carga} />
    {!carga.carregando && !carga.erro && (carga.dados ? <ResponderQuestionario dados={carga.dados} idCurso={idCurso} idModulo={idModulo} onRecarregar={carga.tentarNovamente} /> : <p className="card empty-list">Esta avaliação ainda não está disponível. Continue explorando as aulas do curso.</p>)}
  </LayoutAulas>;
}

function ResponderQuestionario({ dados, idCurso, idModulo, onRecarregar }) {
  const [respostas, setRespostas] = useState(dados.perguntas.map(() => null));
  const [resultado, setResultado] = useState(dados.resultado);
  const [processando, setProcessando] = useState(false);
  // Trava sincrona: barra o segundo clique antes de o botao ser desabilitado na tela.
  const acaoEmAndamento = useRef(false);
  const [erro, setErro] = useState('');

  async function enviar(e) {
    e.preventDefault();
    if (processando || acaoEmAndamento.current) return;
    if (respostas.some((r) => r == null)) { setErro('Responda todas as perguntas antes de enviar.'); return; }
    acaoEmAndamento.current = true; setProcessando(true); setErro('');
    try { setResultado(await responderQuestionario(idCurso, idModulo, dados.versao, respostas)); }
    catch (falha) { setErro(falha.message); }
    finally { acaoEmAndamento.current = false; setProcessando(false); }
  }

  if (resultado?.percentual === 100) return <section className="card avaliacao-resultado" aria-labelledby="resultado-titulo">
    <span className="aulas-etiqueta">Resultado da avaliação</span><h2 id="resultado-titulo">{resultado.acertos} de {resultado.total} respostas corretas</h2>
    <p className="avaliacao-percentual">{resultado.percentual}%</p>
    <h3>Entenda suas respostas</h3>
    <ol className="avaliacao-correcoes">{resultado.correcoes.map((item) => <li key={item.pergunta}><strong>{dados.perguntas[item.pergunta].enunciado}</strong><span className={item.acertou ? 'avaliacao-acerto' : 'avaliacao-revisar'}>{item.acertou ? 'Resposta correta' : 'Resposta incorreta'}</span><p>Resposta: {dados.perguntas[item.pergunta].alternativas[item.alternativaCorreta]}</p></li>)}</ol>
    <div className="acoes-topico"><Link className="btn btn-primary" to={`/aluno/cursos/${idCurso}`}>Ver meu plano de estudos</Link><button className="btn btn-secondary" type="button" onClick={() => { setResultado(null); setRespostas(dados.perguntas.map(() => null)); }}>Refazer avaliação</button></div>
  </section>;

  return <form className="card avaliacao-formulario" onSubmit={enviar}>
    {resultado && <section className="avaliacao-tentativa" aria-label="Revisão da tentativa">
      <p className="avaliacao-percentual" role="status">{resultado.percentual}%</p>
      <p className="mensagem-erro" role="alert">Você ainda não acertou todas as perguntas. Leia as explicações e tente novamente.</p>
      <ol className="avaliacao-correcoes">{resultado.correcoes.filter((item) => !item.acertou).map((item) => <li key={item.pergunta}>
        <strong>{dados.perguntas[item.pergunta].enunciado}</strong>
        <p>Explicação da resposta incorreta</p><p className="texto-suave">{item.explicacao}</p>
      </li>)}</ol>
      <button className="btn btn-secondary" type="button" disabled={processando} onClick={() => {
        setRespostas((anteriores) => anteriores.map((resposta, indice) => resultado.correcoes.find((item) => item.pergunta === indice)?.acertou ? resposta : null));
        setResultado(null);
      }}>Refazer avaliação</button>
    </section>}
    {erro && <div className="mensagem-erro" role="alert">{erro} <button className="btn btn-link" type="button" onClick={onRecarregar}>Recarregar avaliação</button></div>}
    <fieldset disabled={processando}><legend>{dados.perguntas.length} perguntas · escolha uma resposta em cada uma</legend>
      {dados.perguntas.map((pergunta, indice) => <fieldset className="avaliacao-pergunta" key={indice}><legend>{indice + 1}. {pergunta.enunciado}</legend>{pergunta.alternativas.map((texto, opcao) => <label className="avaliacao-opcao" key={opcao}><input type="radio" name={`pergunta-${indice}`} value={opcao} checked={respostas[indice] === opcao} onChange={() => setRespostas((anteriores) => anteriores.map((r, i) => i === indice ? opcao : r))} required /><span>{texto}</span></label>)}</fieldset>)}
    </fieldset>
    <button className="btn btn-primary" type="submit" disabled={processando}>{processando ? 'Enviando...' : 'Conferir respostas'}</button>
  </form>;
}
