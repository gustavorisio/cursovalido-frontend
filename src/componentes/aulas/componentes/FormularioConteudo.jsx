import { useState } from 'react';

export default function FormularioConteudo({ tipo, item, processando, onSalvar, onCancelar }) {
  const [titulo, setTitulo] = useState(item?.titulo ?? '');
  const [descricao, setDescricao] = useState(item?.descricao ?? '');
  const [ordem, setOrdem] = useState(item?.ordem ?? 1);
  const [youtubeUrl, setYoutubeUrl] = useState(item?.youtubeVideoId ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}` : '');
  const [erro, setErro] = useState('');

  function salvar(evento) {
    evento.preventDefault();
    if (!titulo.trim()) { setErro('Preencha o título.'); return; }
    if (!descricao.trim()) { setErro('Preencha a descrição.'); return; }
    const dados = { titulo: titulo.trim(), descricao: descricao.trim() };
    if (tipo !== 'curso') {
      if (!Number.isInteger(Number(ordem))) { setErro('A ordem deve ser um inteiro positivo.'); return; }
      if (Number(ordem) < 1) { setErro('A ordem deve ser um inteiro positivo.'); return; }
      dados.ordem = Number(ordem);
    }
    if (tipo === 'aula') {
      if (!youtubeUrl.trim()) { setErro('Informe o link do vídeo no YouTube.'); return; }
      dados.youtubeUrl = youtubeUrl.trim();
    }
    setErro('');
    onSalvar(dados);
  }

  return <div className="formulario-container">
    <button className="btn btn-link" type="button" disabled={processando} onClick={onCancelar}>← Cancelar</button>
    <form className="card" onSubmit={salvar}>
      <h2 className="titulo-detalhe">{item ? 'Editar' : 'Cadastrar'} {tipo}</h2>
      {erro ? <p className="mensagem-erro" role="alert">{erro}</p> : null}
      <fieldset disabled={processando}>
        <label htmlFor="conteudo-titulo">Título</label>
        <input id="conteudo-titulo" className="input-field" value={titulo} onChange={(evento) => setTitulo(evento.target.value)} maxLength={255} required />
        <label htmlFor="conteudo-descricao">Descrição</label>
        <textarea id="conteudo-descricao" className="input-field" value={descricao} onChange={(evento) => setDescricao(evento.target.value)} maxLength={5000} required />
        <div className={`contador ${descricao.length >= 5000 ? 'limite' : ''}`}>{descricao.length}/5000</div>
        {tipo !== 'curso' ? <>
          <label htmlFor="conteudo-ordem">Ordem</label>
          <input id="conteudo-ordem" className="input-field" type="number" min="1" max="2147483647" step="1" value={ordem} onChange={(evento) => setOrdem(evento.target.value)} required />
        </> : null}
        {tipo === 'aula' ? <>
          <label htmlFor="conteudo-youtube">Link do vídeo no YouTube</label>
          <input id="conteudo-youtube" className="input-field" type="url" maxLength={2048} value={youtubeUrl} onChange={(evento) => setYoutubeUrl(evento.target.value)} placeholder="https://www.youtube.com/watch?v=..." required />
          <p className="texto-suave">Use um link HTTPS youtube.com/watch?v= ou youtu.be/. O vídeo será validado ao salvar.</p>
          {item ? <p className="texto-suave">Trocar o vídeo remove os progressos anteriores desta aula.</p> : null}
        </> : null}
        <div className="acoes-formulario"><button className="btn btn-primary" type="submit">{processando ? 'Salvando...' : 'Salvar'}</button></div>
      </fieldset>
    </form>
  </div>;
}
