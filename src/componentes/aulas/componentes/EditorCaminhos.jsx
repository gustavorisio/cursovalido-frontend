import { useState } from 'react';

function gerarChave(prefixo, itens) {
  let numero = 1;
  while (itens.some((item) => item.chave === `${prefixo}-${numero}`)) numero++;
  return `${prefixo}-${numero}`;
}

export default function EditorCaminhos({ dados, processando, onSalvar, onCancelar }) {
  const [formulario, setFormulario] = useState(dados);
  const [aviso, setAviso] = useState('');
  const { perguntas, resultados } = formulario;
  function campo(nome, valor) { setFormulario((f) => ({ ...f, [nome]: valor })); }
  function alterarPergunta(chave, nome, valor) {
    campo('perguntas', perguntas.map((p) => p.chave === chave ? { ...p, [nome]: valor } : p));
  }
  function alterarOpcao(chave, indice, valores) {
    const pergunta = perguntas.find((p) => p.chave === chave);
    alterarPergunta(chave, 'opcoes', pergunta.opcoes.map((o, i) => i === indice ? { ...o, ...valores } : o));
  }
  function adicionarPergunta() {
    const chave = gerarChave('pergunta', perguntas);
    setFormulario((f) => ({ ...f, perguntaInicial: f.perguntaInicial ?? chave, perguntas: [...f.perguntas, {
      chave, enunciado: '', opcoes: [{ texto: '', proximaPergunta: null, resultado: null }, { texto: '', proximaPergunta: null, resultado: null }],
    }] }));
  }
  function removerPergunta(chave) {
    const restantes = perguntas.filter((p) => p.chave !== chave).map((p) => ({ ...p, opcoes: p.opcoes.map((o) => o.proximaPergunta === chave ? { ...o, proximaPergunta: null } : o) }));
    setFormulario((f) => ({ ...f, perguntas: restantes, perguntaInicial: f.perguntaInicial === chave ? restantes[0]?.chave ?? null : f.perguntaInicial }));
    setAviso('Pergunta removida. Confira os destinos das alternativas antes de publicar.');
  }
  function alterarResultado(chave, nome, valor) {
    campo('resultados', resultados.map((r) => r.chave === chave ? { ...r, [nome]: valor } : r));
  }
  function removerResultado(chave) {
    setFormulario((f) => ({ ...f, resultados: f.resultados.filter((r) => r.chave !== chave), perguntas: f.perguntas.map((p) => ({ ...p, opcoes: p.opcoes.map((o) => o.resultado === chave ? { ...o, resultado: null } : o) })) }));
    setAviso('Resultado removido. Confira os destinos das alternativas antes de publicar.');
  }
  function salvar(e) {
    e.preventDefault();
    onSalvar({ titulo: formulario.titulo, descricao: formulario.descricao, publicado: formulario.publicado,
      versao: formulario.versao, perguntaInicial: formulario.perguntaInicial, perguntas,
      resultados: resultados.map((r) => ({ ...r, temasPesquisa: r.temasPesquisa.map((t) => t.trim()).filter(Boolean) })),
    });
  }

  return <form className="card editor-caminhos" onSubmit={salvar}>
    <h2>{dados.id ? 'Editar questionário' : 'Criar questionário'}</h2>
    <p className="texto-suave">Crie as perguntas e os resultados. Em cada alternativa, escolha a próxima pergunta ou o resultado que será apresentado.</p>
    {aviso && <p className="mensagem-sucesso" role="status">{aviso}</p>}
    <fieldset disabled={processando}>
      <label htmlFor="caminhos-titulo">Título</label><input id="caminhos-titulo" className="input-field" maxLength={255} required value={formulario.titulo} onChange={(e) => campo('titulo', e.target.value)} />
      <label htmlFor="caminhos-descricao">Apresentação do questionário</label><textarea id="caminhos-descricao" className="input-field" maxLength={2000} value={formulario.descricao} onChange={(e) => campo('descricao', e.target.value)} />
      <label htmlFor="caminhos-inicial">Pergunta inicial</label><select id="caminhos-inicial" className="input-field" value={formulario.perguntaInicial ?? ''} onChange={(e) => campo('perguntaInicial', e.target.value || null)}><option value="">Selecione</option>{perguntas.map((p, i) => <option value={p.chave} key={p.chave}>Pergunta {i + 1}: {p.enunciado || 'Sem enunciado'}</option>)}</select>
      <h3>Perguntas e destinos</h3>
      {perguntas.map((p, indice) => <fieldset className="editor-pergunta" key={p.chave}>
        <legend>Pergunta {indice + 1}</legend>
        <label htmlFor={`enunciado-${p.chave}`}>Enunciado</label><textarea className="input-field" id={`enunciado-${p.chave}`} maxLength={1000} required value={p.enunciado} onChange={(e) => alterarPergunta(p.chave, 'enunciado', e.target.value)} />
        {p.opcoes.map((opcao, i) => <div className="editor-caminhos-opcao" key={i}>
          <label htmlFor={`opcao-${p.chave}-${i}`}>Alternativa {i + 1}</label><input id={`opcao-${p.chave}-${i}`} className="input-field" required maxLength={500} value={opcao.texto} onChange={(e) => alterarOpcao(p.chave, i, { texto: e.target.value })} />
          <label htmlFor={`destino-${p.chave}-${i}`}>Ao escolher esta alternativa, ir para</label>
          <select id={`destino-${p.chave}-${i}`} className="input-field" value={opcao.proximaPergunta ? `pergunta:${opcao.proximaPergunta}` : opcao.resultado ? `resultado:${opcao.resultado}` : ''} onChange={(e) => {
            const [tipo, chave] = e.target.value.split(':');
            alterarOpcao(p.chave, i, { proximaPergunta: tipo === 'pergunta' ? chave : null, resultado: tipo === 'resultado' ? chave : null });
          }}>
            <option value="">Sem destino definido</option>
            <optgroup label="Próxima pergunta">{perguntas.filter((q) => q.chave !== p.chave).map((q) => <option key={q.chave} value={`pergunta:${q.chave}`}>Pergunta {perguntas.indexOf(q) + 1}: {q.enunciado || 'Sem enunciado'}</option>)}</optgroup>
            <optgroup label="Resultado final">{resultados.map((r, ri) => <option key={r.chave} value={`resultado:${r.chave}`}>Resultado {ri + 1}: {r.titulo || 'Sem título'}</option>)}</optgroup>
          </select>
          <button className="btn btn-link" type="button" disabled={p.opcoes.length <= 2} onClick={() => alterarPergunta(p.chave, 'opcoes', p.opcoes.filter((_, oi) => oi !== i))}>Remover alternativa {i + 1}</button>
        </div>)}
        <div className="acoes-topico"><button className="btn btn-secondary" type="button" disabled={p.opcoes.length >= 8} onClick={() => alterarPergunta(p.chave, 'opcoes', [...p.opcoes, { texto: '', proximaPergunta: null, resultado: null }])}>Adicionar alternativa</button><button className="btn btn-danger" type="button" onClick={() => removerPergunta(p.chave)}>Remover pergunta</button></div>
      </fieldset>)}
      <button className="btn btn-secondary" type="button" disabled={perguntas.length >= 60} onClick={adicionarPergunta}>Adicionar pergunta</button>
      <h3>Resultados finais</h3>
      {resultados.map((r, i) => <fieldset className="editor-pergunta" key={r.chave}><legend>Resultado {i + 1}</legend>
        <label htmlFor={`resultado-titulo-${r.chave}`}>Título do resultado</label><input className="input-field" id={`resultado-titulo-${r.chave}`} maxLength={255} required value={r.titulo} onChange={(e) => alterarResultado(r.chave, 'titulo', e.target.value)} />
        <label htmlFor={`resultado-texto-${r.chave}`}>Orientação exibida ao usuário</label><textarea className="input-field" id={`resultado-texto-${r.chave}`} required maxLength={5000} value={r.orientacao} onChange={(e) => alterarResultado(r.chave, 'orientacao', e.target.value)} />
        <label htmlFor={`resultado-temas-${r.chave}`}>Assuntos para pesquisar em Aulas online, um por linha</label><textarea className="input-field" id={`resultado-temas-${r.chave}`} required value={r.temasPesquisa.join('\n')} onChange={(e) => alterarResultado(r.chave, 'temasPesquisa', e.target.value.split('\n'))} />
        <button className="btn btn-danger" type="button" onClick={() => removerResultado(r.chave)}>Remover resultado</button>
      </fieldset>)}
      <button className="btn btn-secondary" type="button" disabled={resultados.length >= 40} onClick={() => campo('resultados', [...resultados, { chave: gerarChave('resultado', resultados), titulo: '', orientacao: '', temasPesquisa: [''] }])}>Adicionar resultado</button>
      <label className="editor-publicacao"><input type="checkbox" checked={formulario.publicado} onChange={(e) => campo('publicado', e.target.checked)} />Publicar questionário</label>
      <p className="texto-suave">Rascunhos podem ter destinos incompletos. Para publicar, todos os caminhos devem terminar em um resultado e todas as perguntas devem ser alcançáveis.</p>
    </fieldset>
    <div className="acoes-topico"><button className="btn btn-primary" type="submit" disabled={processando}>{processando ? 'Salvando...' : 'Salvar questionário'}</button><button className="btn btn-secondary" type="button" disabled={processando} onClick={onCancelar}>Cancelar</button></div>
  </form>;
}
