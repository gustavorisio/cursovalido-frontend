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
  return <LayoutAulas className="pagina-questionario">
    <Link className="btn btn-link questionario-voltar" to={`/aluno/cursos/${idCurso}`}>Voltar ao curso</Link>
    <CabecalhoAulas className="questionario-apresentacao" etiqueta="Questionário do módulo" titulo={carga.dados?.titulo ?? 'Questionário do módulo'} descricao="Responda no seu ritmo. Ao finalizar, confira seu resultado e entenda cada resposta." />
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

  const total = dados.perguntas.length;
  const respondidas = respostas.filter((resposta) => resposta != null).length;
  const faltam = total - respondidas;

  function refazer() {
    setRespostas((anteriores) => anteriores.map((resposta, indice) => resultado.correcoes.find((item) => item.pergunta === indice)?.acertou ? resposta : null));
    setResultado(null);
    setErro('');
  }

  if (resultado?.percentual === 100) return <section className="avaliacao-resultado" aria-labelledby="resultado-titulo">
    <div className="avaliacao-resumo avaliacao-resumo-sucesso">
      <div className="avaliacao-nota"><p className="avaliacao-percentual" role="status">{resultado.percentual}%</p><span>de acertos</span></div>
      <div><span className="avaliacao-estado">✓ Questionário concluído</span><h2 id="resultado-titulo">Você acertou todas!</h2><p>{resultado.acertos} de {resultado.total} {resultado.total === 1 ? 'resposta correta' : 'respostas corretas'}. Revise o que aprendeu ou continue seus estudos.</p></div>
    </div>
    <h3 className="avaliacao-revisao-titulo">Suas respostas, em detalhes</h3>
    <ol className="avaliacao-correcoes">{resultado.correcoes.map((item) => <li key={item.pergunta}>
      <div className="avaliacao-correcao-cabecalho"><span className="avaliacao-numero">Pergunta {item.pergunta + 1}</span><span className="avaliacao-acerto">✓ Resposta correta</span></div>
      <h4>{dados.perguntas[item.pergunta].enunciado}</h4><p className="avaliacao-resposta-certa">{dados.perguntas[item.pergunta].alternativas[item.alternativaCorreta]}</p>
    </li>)}</ol>
    <div className="avaliacao-acoes"><Link className="btn btn-primary" to={`/aluno/cursos/${idCurso}`}>Ver meu plano de estudos</Link><button className="btn btn-secondary" type="button" onClick={() => { setResultado(null); setRespostas(dados.perguntas.map(() => null)); }}>Refazer avaliação</button></div>
  </section>;

  return <form className="avaliacao-formulario" onSubmit={enviar} aria-busy={processando}>
    {resultado ? <section className="avaliacao-tentativa" aria-label="Revisão da tentativa">
      <div className="avaliacao-resumo avaliacao-resumo-revisao">
        <div className="avaliacao-nota"><p className="avaliacao-percentual" role="status">{resultado.percentual}%</p><span>de acertos</span></div>
        <div><span className="avaliacao-estado">Mais uma oportunidade de aprender</span><h2>Vamos revisar?</h2><p>Você acertou {resultado.acertos} de {resultado.total} {resultado.total === 1 ? 'pergunta' : 'perguntas'}. Leia as explicações abaixo e tente novamente.</p></div>
      </div>
      <h3 className="avaliacao-revisao-titulo">O que merece uma nova leitura</h3>
      <ol className="avaliacao-correcoes">{resultado.correcoes.filter((item) => !item.acertou).map((item) => <li key={item.pergunta}>
        <div className="avaliacao-correcao-cabecalho"><span className="avaliacao-numero">Pergunta {item.pergunta + 1}</span><span className="avaliacao-revisar">Resposta incorreta</span></div>
        <h4>{dados.perguntas[item.pergunta].enunciado}</h4>
        {respostas[item.pergunta] != null && <div className="avaliacao-opcao avaliacao-opcao-incorreta" role="group" aria-label="Resposta incorreta selecionada">
          <span className="avaliacao-letra" aria-hidden="true">{String.fromCharCode(65 + respostas[item.pergunta])}</span>
          <span className="avaliacao-opcao-texto">{dados.perguntas[item.pergunta].alternativas[respostas[item.pergunta]]}</span>
        </div>}
        <div className="avaliacao-explicacao"><strong>Explicação da resposta incorreta</strong><p>{item.explicacao}</p></div>
      </li>)}</ol>
      <div className="avaliacao-acoes"><button className="btn btn-primary" type="button" disabled={processando} onClick={refazer}>Refazer avaliação</button><p>Use as explicações para preparar sua próxima tentativa.</p></div>
    </section> : <>
    <section className="avaliacao-progresso" aria-label="Progresso do questionário">
      <div><span className="avaliacao-numero">Seu progresso</span><p role="status">{respondidas} de {total} {total === 1 ? 'pergunta respondida' : 'perguntas respondidas'}</p></div>
      <progress max={total} value={respondidas} aria-label="Perguntas respondidas" />
    </section>
    {erro && <div className="mensagem-erro" role="alert">{erro} <button className="btn btn-link" type="button" onClick={onRecarregar}>Recarregar avaliação</button></div>}
    <fieldset className="avaliacao-perguntas" disabled={processando}><legend className="sr-only">Escolha uma resposta em cada pergunta</legend>
      {dados.perguntas.map((pergunta, indice) => <div className="avaliacao-pergunta-cartao" key={indice}><fieldset className="avaliacao-pergunta"><legend><span className="avaliacao-numero">Pergunta {String(indice + 1).padStart(2, '0')}</span>{pergunta.enunciado}</legend>
        <div className="avaliacao-alternativas">{pergunta.alternativas.map((texto, opcao) => <label className="avaliacao-opcao" key={opcao}>
          <input type="radio" name={`pergunta-${indice}`} value={opcao} checked={respostas[indice] === opcao} onChange={() => setRespostas((anteriores) => anteriores.map((r, i) => i === indice ? opcao : r))} required />
          <span className="avaliacao-letra" aria-hidden="true">{String.fromCharCode(65 + opcao)}</span><span className="avaliacao-opcao-texto">{texto}</span>
        </label>)}</div>
      </fieldset></div>)}
    </fieldset>
    <div className="avaliacao-envio"><p>{faltam > 0 ? `Falta${faltam === 1 ? '' : 'm'} responder ${faltam} pergunta${faltam === 1 ? '' : 's'}.` : 'Tudo pronto! Confira suas respostas.'}<span>Você poderá tentar novamente depois.</span></p><button className="btn btn-primary" type="submit" disabled={processando}>{processando ? 'Enviando...' : 'Conferir respostas'}</button></div>
    </>}
  </form>;
}
