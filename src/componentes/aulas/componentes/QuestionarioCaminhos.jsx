import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { calcularInteresses, salvarInteresses } from '../servicos/servicoAprendizagem';

export default function QuestionarioCaminhos({ dados, aluno, catalogo, onRecarregar }) {
  const { questionario } = dados;
  const [passos, setPassos] = useState(dados.resultado?.respostas ?? []);
  const [indice, setIndice] = useState(0);
  const [revisando, setRevisando] = useState(false);
  const [resultado, setResultado] = useState(dados.resultado);
  const [direcao, setDirecao] = useState('avancar');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const titulo = useRef(null);
  const perguntas = new Map(questionario.perguntas.map((p) => [p.chave, p]));
  const anterior = passos[indice - 1];
  const chave = indice === 0 ? questionario.perguntaInicial : perguntas.get(anterior?.pergunta)?.opcoes[anterior?.opcao]?.proximaPergunta;
  const pergunta = perguntas.get(chave);
  const escolhaAtual = passos[indice] && passos[indice].pergunta === chave ? passos[indice].opcao : null;

  useEffect(() => { titulo.current?.focus(); }, [chave, revisando, resultado]);

  function voltar(destino) {
    setIndice(destino); setRevisando(false); setDirecao('voltar'); setErro('');
  }

  function escolher(opcao) {
    if (processando) return;
    if (escolhaAtual !== opcao) setPassos([...passos.slice(0, indice), { pergunta: chave, opcao }]);
    setErro('');
  }

  function continuar() {
    if (processando || escolhaAtual == null) return;
    setIndice(indice + 1);
    setRevisando(Boolean(pergunta.opcoes[escolhaAtual].resultado));
    setDirecao('avancar'); setErro('');
  }

  async function finalizar() {
    if (processando) return;
    setProcessando(true); setErro('');
    try {
      const salvo = aluno ? await salvarInteresses(questionario.id, questionario.versao, passos) : await calcularInteresses(questionario.id, questionario.versao, passos);
      setResultado(salvo);
    } catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }

  if (resultado) return <section className="card caminhos-resultado" aria-labelledby="caminhos-resultado-titulo">
    <span className="aulas-etiqueta">Resultado do questionário</span>
    <h2 id="caminhos-resultado-titulo" tabIndex={-1} ref={titulo}>{resultado.resultado.titulo}</h2>
    <p className="caminhos-conteudo">{resultado.resultado.orientacao}</p>
    <p>Pesquise em Aulas online por: <strong>{resultado.resultado.temasPesquisa.join(', ')}</strong>.</p>
    <div className="acoes-topico"><Link className="btn btn-primary" to={catalogo}>Ir para Aulas online</Link><button type="button" className="btn btn-secondary" onClick={() => { setResultado(null); setIndice(0); setRevisando(false); setErro(''); }}>Refazer questionário</button></div>
  </section>;

  return <section className="card caminhos-etapas" aria-labelledby="caminhos-etapas-titulo">
    <span className="aulas-etiqueta">Questionário de interesses</span><h2 id="caminhos-etapas-titulo">{questionario.titulo}</h2><p className="texto-suave">{questionario.descricao}</p>
    <div className="caminhos-contexto"><strong>{revisando ? 'Confira suas respostas' : `Pergunta ${indice + 1}`}</strong><span>Sem respostas certas ou erradas</span></div>
    <nav aria-label="Etapas do questionário"><ol className="caminhos-passos">{passos.map((passo, i) => <li key={`${i}-${passo.pergunta}`}><button type="button" aria-label={`Voltar à pergunta ${i + 1}`} aria-current={!revisando && i === indice ? 'step' : undefined} disabled={processando || i > indice} onClick={() => voltar(i)}>{i + 1}</button></li>)}{!revisando && indice === passos.length && <li><span aria-current="step">{indice + 1}</span></li>}{revisando && <li><span aria-current="step">Revisão</span></li>}</ol></nav>
    {erro && <p className="mensagem-erro" role="alert">{erro} <button className="btn btn-link" type="button" disabled={processando} onClick={onRecarregar}>Recarregar questionário</button></p>}
    {revisando ? <div className={`caminhos-etapa caminhos-etapa-${direcao}`} key="revisao">
      <h3 tabIndex={-1} ref={titulo}>Revise suas escolhas antes de finalizar</h3>
      <ol className="caminhos-revisao">{passos.map((passo, i) => <li key={i}><div><strong>{perguntas.get(passo.pergunta).enunciado}</strong><p>{perguntas.get(passo.pergunta).opcoes[passo.opcao].texto}</p></div><button className="btn btn-secondary" type="button" disabled={processando} onClick={() => voltar(i)}>Corrigir resposta {i + 1}</button></li>)}</ol>
      <div className="acoes-topico"><button className="btn btn-secondary" type="button" disabled={processando} onClick={() => voltar(passos.length - 1)}>Voltar</button><button className="btn btn-primary" type="button" disabled={processando} onClick={finalizar}>{processando ? 'Finalizando...' : 'Finalizar e ver resultado'}</button></div>
    </div> : pergunta ? <div className={`caminhos-etapa caminhos-etapa-${direcao}`} key={chave}>
      <fieldset disabled={processando} className="avaliacao-pergunta"><legend tabIndex={-1} ref={titulo}>{indice + 1}. {pergunta.enunciado}</legend>
        {pergunta.opcoes.map((opcao, i) => <label className="avaliacao-opcao" key={i}><input type="radio" name={`caminho-${chave}`} value={i} checked={escolhaAtual === i} onChange={() => escolher(i)} /><span>{opcao.texto}</span><span className="caminhos-opcao-marca" aria-hidden="true">{escolhaAtual === i ? '✓' : String.fromCharCode(65 + i)}</span></label>)}
      </fieldset>
      <div className="acoes-topico">{indice > 0 && <button className="btn btn-secondary" type="button" onClick={() => voltar(indice - 1)}>Voltar</button>}<button className="btn btn-primary" type="button" disabled={escolhaAtual == null || processando} onClick={continuar}>{pergunta.opcoes[escolhaAtual]?.resultado ? 'Revisar respostas' : 'Continuar'}</button></div>
      <p className="texto-suave caminhos-ajuda">Selecione uma alternativa e confirme para continuar. Você pode voltar e alterar suas escolhas antes de ver o resultado.</p>
    </div> : <p className="mensagem-erro" role="alert">Não foi possível localizar esta etapa. Recarregue o questionário.</p>}
  </section>;
}
