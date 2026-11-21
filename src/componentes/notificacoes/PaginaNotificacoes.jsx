import { useEffect, useRef, useState } from 'react';
import CabecalhoPagina from '../comuns/CabecalhoPagina';
import ControlesPaginacao from '../comuns/ControlesPaginacao';
import Rodape from '../comuns/Rodape';
import VoltarAdministracao from '../administracao/VoltarAdministracao';
import ConfirmacaoModal from '../forum/componentes/ConfirmacaoModal';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import { listarComunicados, publicarComunicado, editarComunicado, excluirComunicado, marcarComunicadoLido, LIMITE_CONTEUDO_COMUNICADO } from '../../servicos/servicoNotificacoes';
import './notificacoes.css';

export default function PaginaNotificacoes({ administrador = false }) {
  const { sessao } = useAutenticacao();
  return <ConteudoNotificacoes key={`${sessao?.idUsuario ?? sessao?.id}-${administrador}`} administrador={administrador} />;
}

function ConteudoNotificacoes({ administrador }) {
  const [pagina, setPagina] = useState(0);
  const [atualizacao, setAtualizacao] = useState(0);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [lendo, setLendo] = useState(null);
  const [abertos, setAbertos] = useState([]);
  const envioEmCurso = useRef(false);
  const leituraEmCurso = useRef(false);
  const montado = useRef(true);
  const campoTitulo = useRef(null);
  const ocupado = publicando || excluindo;

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  useEffect(() => {
    let ativo = true;
    listarComunicados(pagina, administrador)
      .then(resposta => { if (ativo) setDados(resposta); })
      .catch(falha => { if (ativo) setErroCarga(falha.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [pagina, administrador, atualizacao]);

  function carregar(novaPagina = pagina) {
    setCarregando(true); setErroCarga(''); setAbertos([]);
    setPagina(novaPagina); setAtualizacao(valor => valor + 1);
  }

  async function publicar(evento) {
    evento.preventDefault();
    if (envioEmCurso.current) return;
    envioEmCurso.current = true;
    setPublicando(true); setErro(''); setMensagem('');
    try {
      if (editando) await editarComunicado(editando.id, { titulo, conteudo });
      else await publicarComunicado({ titulo, conteudo });
      if (!montado.current) return;
      setTitulo(''); setConteudo(''); setEditando(null);
      setMensagem(editando ? 'Comunicado atualizado.' : 'Comunicado publicado para todos os usuários.');
      carregar(editando ? pagina : 0);
    } catch (falha) { if (montado.current) setErro(falha.message); }
    finally { envioEmCurso.current = false; if (montado.current) setPublicando(false); }
  }

  function iniciarEdicao(item) {
    if (envioEmCurso.current) return;
    setEditando(item); setTitulo(item.titulo); setConteudo(item.conteudo);
    setErro(''); setMensagem('');
    campoTitulo.current?.focus();
    campoTitulo.current?.scrollIntoView?.({ block: 'center' });
  }

  function cancelarEdicao() {
    if (envioEmCurso.current) return;
    setEditando(null); setTitulo(''); setConteudo(''); setErro('');
  }

  async function excluir() {
    if (!confirmacao || envioEmCurso.current) return;
    envioEmCurso.current = true;
    setExcluindo(true); setErro(''); setMensagem('');
    try {
      await excluirComunicado(confirmacao.id);
      if (!montado.current) return;
      if (editando?.id === confirmacao.id) { setEditando(null); setTitulo(''); setConteudo(''); }
      setMensagem('Comunicado excluído.');
      carregar(pagina > 0 && dados.itens.length === 1 ? pagina - 1 : pagina);
    } catch (falha) { if (montado.current) setErro(falha.message); }
    finally {
      envioEmCurso.current = false;
      if (montado.current) { setExcluindo(false); setConfirmacao(null); }
    }
  }

  async function ler(item) {
    if (abertos.includes(item.id)) { setAbertos(itens => itens.filter(id => id !== item.id)); return; }
    if (leituraEmCurso.current) return;
    if (administrador || item.lida) { setAbertos(itens => [...itens, item.id]); return; }
    leituraEmCurso.current = true;
    setLendo(item.id); setErro('');
    try {
      await marcarComunicadoLido(item.id);
      if (!montado.current) return;
      setDados(anterior => ({ ...anterior, naoLidas: Math.max(0, anterior.naoLidas - 1), itens: anterior.itens.map(atual => atual.id === item.id ? { ...atual, lida: true } : atual) }));
      setAbertos(itens => [...itens, item.id]);
    } catch (falha) { if (montado.current) setErro(falha.message); }
    finally { leituraEmCurso.current = false; if (montado.current) setLendo(null); }
  }

  return <div className="app-container"><main className="main-content pagina-notificacoes">
    {administrador && <VoltarAdministracao />}
    <CabecalhoPagina titulo={administrador ? 'Comunicados' : 'Notificações'} descricao={administrador ? 'Publique avisos para todos os usuários da plataforma.' : 'Acompanhe os comunicados publicados pela administração.'} />
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
    {administrador && <section className="card" aria-labelledby="novo-comunicado-titulo">
      <h2 id="novo-comunicado-titulo" className="notificacoes-titulo">{editando ? 'Editar comunicado' : 'Novo comunicado'}</h2>
      <form className="notificacoes-formulario" onSubmit={publicar}>
        <div><label htmlFor="comunicado-titulo">Título</label><input ref={campoTitulo} className="input-field" id="comunicado-titulo" required maxLength={255} value={titulo} onChange={evento => setTitulo(evento.target.value)} disabled={ocupado} /></div>
        <div><label htmlFor="comunicado-conteudo">Conteúdo</label><textarea className="input-field" id="comunicado-conteudo" rows={7} required maxLength={LIMITE_CONTEUDO_COMUNICADO} value={conteudo} onChange={evento => setConteudo(evento.target.value)} disabled={ocupado} aria-describedby="comunicado-limite" /><p id="comunicado-limite" className="texto-suave">{conteudo.length.toLocaleString('pt-BR')} / 5.000 caracteres</p></div>
        <div className="notificacoes-acoes"><button className="btn btn-primary" disabled={ocupado || !titulo.trim() || !conteudo.trim()}>{publicando ? (editando ? 'Salvando...' : 'Publicando...') : editando ? 'Salvar alterações' : 'Publicar comunicado'}</button>{editando && <button type="button" className="btn btn-secondary" onClick={cancelarEdicao} disabled={ocupado}>Cancelar edição</button>}</div>
      </form>
    </section>}
    <section aria-labelledby="lista-comunicados-titulo" aria-busy={carregando}>
      <div className="notificacoes-lista-cabecalho"><h2 id="lista-comunicados-titulo" className="notificacoes-titulo">{administrador ? 'Comunicados publicados' : 'Comunicados da administração'}</h2><button className="btn btn-secondary btn-small" onClick={() => carregar()} disabled={carregando || lendo !== null || ocupado}>Atualizar</button></div>
      {carregando ? <p role="status">Carregando comunicados...</p> : erroCarga ? <div className="mensagem-erro" role="alert">{erroCarga}<div><button className="btn btn-secondary" onClick={() => carregar()}>Tentar novamente</button></div></div> : dados && <>
        {!administrador && <p className="notificacoes-resumo" role="status">{dados.naoLidas ? `${dados.naoLidas} ${dados.naoLidas === 1 ? 'notificação não lida' : 'notificações não lidas'}` : 'Você está em dia com os comunicados.'}</p>}
        {!dados.itens.length && <p className="card texto-suave">Nenhum comunicado {administrador ? 'publicado' : 'disponível'} no momento.</p>}
        <div className="notificacoes-lista">{dados.itens.map(item => <article className={`notificacoes-comunicado${!administrador && !item.lida ? ' notificacoes-nao-lida' : ''}`} key={item.id}>
          <div className="notificacoes-meta"><time dateTime={item.criadoEm}>{new Date(item.criadoEm).toLocaleString('pt-BR')}</time>{!administrador && <span>{item.lida ? 'Lida' : 'Não lida'}</span>}</div>
          <h3>{item.titulo}</h3>
          <p className="notificacoes-conteudo" id={`comunicado-texto-${item.id}`}>{abertos.includes(item.id) ? item.conteudo : `${item.conteudo.slice(0, 180)}${item.conteudo.length > 180 ? '…' : ''}`}</p>
          <div className="notificacoes-acoes"><button className="btn btn-secondary btn-small" aria-expanded={abertos.includes(item.id)} aria-controls={`comunicado-texto-${item.id}`} disabled={lendo !== null || ocupado} onClick={() => ler(item)}>{lendo === item.id ? 'Abrindo...' : abertos.includes(item.id) ? 'Recolher comunicado' : 'Ler comunicado'}</button>{administrador && <><button type="button" className="btn btn-secondary btn-small" onClick={() => iniciarEdicao(item)} disabled={ocupado}>Editar</button><button type="button" className="btn btn-danger btn-small" onClick={() => { setErro(''); setConfirmacao(item); }} disabled={ocupado}>Excluir</button></>}</div>
        </article>)}</div>
        <ControlesPaginacao pagina={pagina} total={dados.totalPaginas} rotulo="Páginas de comunicados" className="notificacoes-paginacao" desabilitada={lendo !== null || ocupado}
          onAnterior={() => carregar(pagina - 1)} onProxima={() => carregar(pagina + 1)} />
      </>}
    </section>
  </main>{confirmacao && <ConfirmacaoModal titulo="Excluir comunicado" mensagem={`Deseja excluir “${confirmacao.titulo}”? O comunicado será removido para todos os usuários. Esta ação não pode ser desfeita.`} processando={excluindo} onConfirmar={excluir} onCancelar={() => { if (!envioEmCurso.current) setConfirmacao(null); }} />}<Rodape /></div>;
}
