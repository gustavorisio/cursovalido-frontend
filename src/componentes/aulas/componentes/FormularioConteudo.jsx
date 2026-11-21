import { useRef, useState } from 'react';
import { prepararCapaCurso } from '../servicos/capaCurso';
import { validarUrlYoutube } from '../../../servicos/validacoesFormulario';
import FiltroTema from './FiltroTema';

export default function FormularioConteudo({ tipo, item, processando, onSalvar, onCancelar }) {
  const [titulo, setTitulo] = useState(item?.titulo ?? '');
  const [descricao, setDescricao] = useState(item?.descricao ?? '');
  const [ordem, setOrdem] = useState(item?.ordem ?? 1);
  const [vimeoUrl, setVimeoUrl] = useState(item?.vimeoVideoUrl ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(item?.youtubeVideoId ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}` : '');
  const [erro, setErro] = useState('');
  const [idTema, setIdTema] = useState(String(item?.idTema ?? ''));
  const [capaJpeg, setCapaJpeg] = useState(item?.capaJpeg ?? null);
  const [preparandoCapa, setPreparandoCapa] = useState(false);
  const selecaoCapa = useRef(0);
  const arquivoCapa = useRef(null);

  async function selecionarCapa(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const selecao = ++selecaoCapa.current;
    setPreparandoCapa(true);
    setErro('');
    try {
      const capa = await prepararCapaCurso(arquivo);
      if (selecao === selecaoCapa.current) setCapaJpeg(capa);
    } catch (falha) {
      if (selecao === selecaoCapa.current) setErro(falha.message);
      evento.target.value = '';
    } finally {
      if (selecao === selecaoCapa.current) setPreparandoCapa(false);
    }
  }

  function salvar(evento) {
    evento.preventDefault();
    if (processando || preparandoCapa) return;
    if (!titulo.trim()) { setErro('Preencha o título.'); return; }
    if (!descricao.trim()) { setErro('Preencha a descrição.'); return; }
    const dados = { titulo: titulo.trim(), descricao: descricao.trim() };
    if (tipo === 'curso') {
      dados.idTema = idTema ? Number(idTema) : null;
      dados.idArea = item?.idArea ?? null;
      dados.capaJpeg = capaJpeg;
    }
    if (tipo !== 'curso') {
      if (!Number.isInteger(Number(ordem))) { setErro('A ordem deve ser um inteiro positivo.'); return; }
      if (Number(ordem) < 1) { setErro('A ordem deve ser um inteiro positivo.'); return; }
      dados.ordem = Number(ordem);
    }
    if (tipo === 'aula') {
      if (!vimeoUrl.trim() && !youtubeUrl.trim()) { setErro('Informe o link do Vimeo principal ou um vídeo reserva no YouTube.'); return; }
      if (vimeoUrl.trim()) {
        try {
          const url = new URL(vimeoUrl.trim());
          if (url.protocol !== 'https:' || !['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(url.hostname.toLowerCase()) || !/\/(\d+)(?:\/|$)/.test(url.pathname)) throw new Error();
        } catch { setErro('Informe uma URL HTTPS válida de vídeo do Vimeo.'); return; }
      }
      if (youtubeUrl.trim() && !validarUrlYoutube(youtubeUrl)) { setErro('Informe um link válido do vídeo reserva no YouTube.'); return; }
      dados.vimeoUrl = vimeoUrl.trim();
      dados.youtubeUrl = youtubeUrl.trim() || null;
    }
    setErro('');
    onSalvar(dados);
  }

  return <div className="formulario-container aulas-editor">
    <button className="btn btn-link" type="button" disabled={processando} onClick={onCancelar}>Cancelar</button>
    <form className="card" onSubmit={salvar}>
      <header className="aulas-editor-cabecalho"><div><span className="aulas-etiqueta">Gestão de conteúdo</span><h2 className="titulo-detalhe">{item ? 'Editar' : 'Cadastrar'} {tipo}</h2></div></header>
      <p className="texto-suave">Preencha as informações para organizar o conteúdo de aprendizagem.</p>
      {erro ? <p className="mensagem-erro" role="alert">{erro}</p> : null}
      <fieldset disabled={processando}>
        <label htmlFor="conteudo-titulo">Título</label>
        <input id="conteudo-titulo" className="input-field" value={titulo} onChange={(evento) => setTitulo(evento.target.value)} maxLength={255} required />
        <label htmlFor="conteudo-descricao">Descrição</label>
        <textarea id="conteudo-descricao" className="input-field" value={descricao} onChange={(evento) => setDescricao(evento.target.value)} maxLength={5000} required />
        <div className={`contador ${descricao.length >= 5000 ? 'limite' : ''}`}>{descricao.length}/5000</div>
        {tipo === 'curso' && <>
          <FiltroTema valor={idTema} onAlterar={setIdTema} cadastro gerenciar />
          <div className="curso-capa-editor">
            <label htmlFor="conteudo-capa">Capa do curso (JPEG)</label>
            <input ref={arquivoCapa} id="conteudo-capa" type="file" accept="image/jpeg,.jpg,.jpeg" aria-describedby="curso-capa-ajuda" disabled={preparandoCapa} onChange={selecionarCapa} />
            <p id="curso-capa-ajuda" className="texto-suave">JPEG de até 2 MB e no máximo 550 × 250 px. Imagens menores se ajustam automaticamente, sem recorte.</p>
            {preparandoCapa && <p role="status">Processando imagem...</p>}
            {capaJpeg && <button className="btn btn-link" type="button" disabled={preparandoCapa} onClick={() => { setCapaJpeg(null); arquivoCapa.current.value = ''; }}>Remover capa</button>}
          </div>
        </>}
        {tipo !== 'curso' ? <>
          <label htmlFor="conteudo-ordem">Ordem</label>
          <input id="conteudo-ordem" className="input-field" type="number" min="1" max="2147483647" step="1" value={ordem} onChange={(evento) => setOrdem(evento.target.value)} required />
        </> : null}
        {tipo === 'aula' ? <>
          <label htmlFor="conteudo-vimeo">Vídeo principal · Vimeo</label>
          <input id="conteudo-vimeo" className="input-field" type="url" maxLength={2048} value={vimeoUrl} onChange={(evento) => setVimeoUrl(evento.target.value)} placeholder="https://vimeo.com/123456789" required={!item?.youtubeVideoId} />
          <p className="texto-suave">O player do Vimeo é exibido primeiro. Vídeos não listados podem incluir o hash de privacidade na URL.</p>
          <label htmlFor="conteudo-youtube">Vídeo reserva · YouTube (opcional)</label>
          <input id="conteudo-youtube" className="input-field" type="url" maxLength={2048} value={youtubeUrl} onChange={(evento) => setYoutubeUrl(evento.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          <p className="texto-suave">Se o player do Vimeo falhar, a aula tenta reproduzir este vídeo automaticamente.</p>
          {item ? <p className="texto-suave">Trocar o vídeo remove os progressos anteriores desta aula.</p> : null}
        </> : null}
        <div className="acoes-formulario"><button className="btn btn-primary" type="submit" disabled={preparandoCapa}>{processando ? 'Salvando...' : 'Salvar'}</button></div>
      </fieldset>
    </form>
  </div>;
}
