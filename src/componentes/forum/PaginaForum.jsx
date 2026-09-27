import { useState } from 'react';
import CabecalhoForum from './componentes/CabecalhoForum';
import DetalheTopico from './componentes/DetalheTopico';
import FormularioTopico from './componentes/FormularioTopico';
import ListaTopicos from './componentes/ListaTopicos';
import Rodape from '../comuns/Rodape';
import { perfilDoUsuario, useForum } from './hooks/useForum';

export default function PaginaForum() {
  const forum = useForum();
  const [tela, setTela] = useState('lista');
  const [termo, setTermo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [texto, setTexto] = useState('');
  const [comentarioEditando, setComentarioEditando] = useState(null);
  const [erroTela, setErroTela] = useState('');
  const [processando, setProcessando] = useState(false);

  async function pesquisar(evento) {
    evento.preventDefault();
    await forum.carregarTopicos(0, termo);
  }

  async function publicar(evento) {
    evento.preventDefault();
    if (!titulo.trim() || !descricao.trim()) { setErroTela('Preencha o título e a descrição.'); return; }
    setProcessando(true);
    const criado = await forum.salvarTopico(titulo, descricao);
    setProcessando(false);
    if (criado) { setTitulo(''); setDescricao(''); setTela('lista'); }
  }

  async function editarTopico(evento) {
    evento.preventDefault();
    setProcessando(true);
    const atualizado = await forum.editarTopico(forum.topicoSelecionado.id, titulo, descricao);
    setProcessando(false);
    if (atualizado) {
      setTitulo(''); setDescricao(''); setTela('detalhe');
    }
  }

  async function enviarComentario(evento) {
    evento.preventDefault();
    if (!texto.trim()) return;
    setProcessando(true);
    const sucesso = comentarioEditando
      ? await forum.editarComentario(comentarioEditando, texto)
      : await forum.salvarComentario(texto);
    setProcessando(false);
    if (sucesso) { setTexto(''); setComentarioEditando(null); }
  }

  function abrirEdicao() {
    setTitulo(forum.topicoSelecionado.titulo); setDescricao(forum.topicoSelecionado.descricao); setTela('edicao');
  }

  function selecionar(topico) { forum.selecionarTopico(topico); setTela('detalhe'); }

  return <div className="app-container"><CabecalhoForum /><main className="main-content">
    {(forum.mensagemErro || erroTela) && <div className="card aviso-erro" role="alert">{forum.mensagemErro || erroTela}<button className="btn btn-link" type="button" onClick={() => { forum.limparMensagem(); setErroTela(''); }}>Fechar</button></div>}
    {tela === 'lista' && <>
      <div className="page-header"><h1 className="page-title">Fórum de dúvidas</h1><div className="page-actions"><form className="barra-pesquisa" onSubmit={pesquisar}><input className="campo-pesquisa" type="search" aria-label="Pesquisar por título" placeholder="Buscar por título" value={termo} onChange={(evento) => setTermo(evento.target.value)} /></form><button className="btn btn-primary" type="button" onClick={() => setTela('criacao')}>Novo tópico</button></div></div>
      {forum.carregando ? <div className="card empty-list">Carregando tópicos...</div> : <ListaTopicos topicos={forum.topicos} usuarios={forum.usuarios} onSelecionar={selecionar} />}
      {forum.totalPaginas > 1 && <div className="paginacao"><button className="btn btn-secondary" disabled={forum.pagina === 0 || forum.carregando} onClick={() => forum.carregarTopicos(forum.pagina - 1, termo)}>Anterior</button><span>Página {forum.pagina + 1} de {forum.totalPaginas}</span><button className="btn btn-secondary" disabled={forum.pagina + 1 >= forum.totalPaginas || forum.carregando} onClick={() => forum.carregarTopicos(forum.pagina + 1, termo)}>Próxima</button></div>}
    </>}
    {(tela === 'criacao' || tela === 'edicao') && <FormularioTopico titulo={titulo} descricao={descricao} onMudarTitulo={setTitulo} onMudarDescricao={setDescricao} onPublicar={tela === 'criacao' ? publicar : editarTopico} onCancelar={() => setTela(tela === 'edicao' ? 'detalhe' : 'lista')} modoEdicao={tela === 'edicao'} desabilitado={processando} />}
    {tela === 'detalhe' && forum.topicoSelecionado && <DetalheTopico topico={{ ...forum.topicoSelecionado, perfilAutor: forum.topicoSelecionado.perfilAutor ?? perfilDoUsuario(forum.usuarios.find((usuario) => Number(usuario.id) === Number(forum.topicoSelecionado.idAutor))) }} comentarios={forum.comentarios.map((comentario) => ({ ...comentario, perfilAutor: comentario.perfilAutor ?? perfilDoUsuario(forum.usuarios.find((usuario) => Number(usuario.id) === Number(comentario.idAutor))) }))} podeGerenciarTopico={forum.podeGerenciarTopico} podeArquivarTopico={forum.podeArquivarTopico} podeEditarTopico={forum.podeEditarTopico} podeEditarComentario={forum.podeEditarComentario} podeApagarTopico={forum.podeApagarTopico} podeExcluirComentario={forum.podeExcluirComentario} onFechar={forum.fecharTopicoSelecionado} onArquivar={forum.arquivarTopicoSelecionado} onEditarTopico={abrirEdicao} onExcluirTopico={async () => { if (await forum.excluirTopico(forum.topicoSelecionado)) setTela('lista'); }} onExcluirComentario={forum.excluirComentarioSelecionado} onEditarComentario={(comentario) => { setComentarioEditando(comentario); setTexto(comentario.conteudo); }} textoComentario={texto} onMudarComentario={setTexto} onEnviarComentario={enviarComentario} comentarioEditando={comentarioEditando} onCancelarEdicaoComentario={() => { setComentarioEditando(null); setTexto(''); }} onVoltar={() => setTela('lista')} desabilitado={processando} />}
  </main><Rodape /></div>;
}
