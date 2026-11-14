import CabecalhoPagina from '../comuns/CabecalhoPagina';
import PesquisaPagina from '../comuns/PesquisaPagina';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import './forum.css';
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

  async function pesquisar() {
    await forum.carregarTopicos(0, termo);
  }

  async function publicar(evento) {
    evento.preventDefault();
    if (processando) return;
    forum.limparMensagem(); setErroTela('');
    if (!titulo.trim() || !descricao.trim()) { setErroTela('Preencha o título e a descrição.'); return; }
    setProcessando(true);
    const criado = await forum.salvarTopico(titulo, descricao);
    setProcessando(false);
    if (criado) { setTitulo(''); setDescricao(''); setTela('lista'); }
  }

  async function editarTopico(evento) {
    evento.preventDefault();
    if (processando) return;
    forum.limparMensagem(); setErroTela('');
    if (!titulo.trim() || !descricao.trim()) { setErroTela('Preencha o título e a descrição.'); return; }
    setProcessando(true);
    const atualizado = await forum.editarTopico(forum.topicoSelecionado.id, titulo, descricao);
    setProcessando(false);
    if (atualizado) {
      setTitulo(''); setDescricao(''); setTela('detalhe');
    }
  }

  async function enviarComentario(evento) {
    evento.preventDefault();
    if (processando) return;
    forum.limparMensagem(); setErroTela('');
    if (!texto.trim()) { setErroTela('Preencha o comentário.'); return; }
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

  return <div className="app-container pagina-forum"><main className="main-content">
    {(forum.mensagemErro || erroTela) && <div className="card aviso-erro" role="alert">{forum.mensagemErro || erroTela}<button className="btn btn-link" type="button" onClick={() => { forum.limparMensagem(); setErroTela(''); }}>Fechar</button></div>}
    {tela === 'lista' && <>
      <CabecalhoPagina titulo="Fórum de dúvidas" acoes={<>
        {forum.autenticado ? <button className="btn btn-primary" type="button" disabled={forum.topicosBloqueados} onClick={() => setTela('criacao')}>Novo tópico</button> : <Link className="btn btn-primary" to="/login">Entrar para participar</Link>}
        <PesquisaPagina valor={termo} onAlterar={setTermo} onPesquisar={pesquisar} rotulo="Pesquisar por título" placeholder="Buscar por título" />
      </>} />
      {forum.autenticado && <div className="forum-filtros" role="group" aria-label="Filtrar tópicos">
        <button type="button" className="btn btn-secondary" aria-pressed={!forum.meusTopicos} disabled={forum.carregando} onClick={() => forum.setMeusTopicos(false)}>Todos os tópicos</button>
        <button type="button" className="btn btn-secondary" aria-pressed={forum.meusTopicos} disabled={forum.carregando} onClick={() => forum.setMeusTopicos(true)}>Meus tópicos</button>
      </div>}
      <div className="forum-colunas"><section className="forum-topicos" aria-label="Tópicos do fórum">
        {forum.carregando ? <div className="card empty-list">Carregando tópicos...</div> : <ListaTopicos topicos={forum.topicos} usuarios={forum.usuarios} onSelecionar={selecionar} />}
        {forum.totalPaginas > 1 && <div className="paginacao"><button className="btn btn-secondary" disabled={forum.pagina === 0 || forum.carregando} onClick={() => forum.carregarTopicos(forum.pagina - 1, termo)}>Anterior</button><span>Página {forum.pagina + 1} de {forum.totalPaginas}</span><button className="btn btn-secondary" disabled={forum.pagina + 1 >= forum.totalPaginas || forum.carregando} onClick={() => forum.carregarTopicos(forum.pagina + 1, termo)}>Próxima</button></div>}
      </section><aside className="forum-regras" aria-labelledby="forum-regras-titulo">
          <h2 id="forum-regras-titulo">Regras básicas</h2>
          <ul>
            <li>Respeite as pessoas. Não publique ofensas ou discriminação.</li>
            <li>Busque antes de criar um tópico e use um título claro.</li>
            <li>Mantenha as respostas no assunto e compartilhe fontes.</li>
            <li>Evite spam, publicidade e conteúdo ilegal.</li>
            <li>Proteja seus dados e os de outras pessoas.</li>
          </ul>
          <p>Ajude a manter o fórum útil e acolhedor para todos.</p>
        </aside></div>
    </>}
    {(tela === 'criacao' || tela === 'edicao') && <FormularioTopico titulo={titulo} descricao={descricao} onMudarTitulo={setTitulo} onMudarDescricao={setDescricao} onPublicar={tela === 'criacao' ? publicar : editarTopico} onCancelar={() => setTela(tela === 'edicao' ? 'detalhe' : 'lista')} modoEdicao={tela === 'edicao'} desabilitado={processando ? true : forum.topicosBloqueados} />}
    {tela === 'detalhe' && forum.topicoSelecionado && <DetalheTopico autenticado={forum.autenticado} topico={{ ...forum.topicoSelecionado, perfilAutor: forum.topicoSelecionado.perfilAutor ?? perfilDoUsuario(forum.usuarios.find((usuario) => Number(usuario.id) === Number(forum.topicoSelecionado.idAutor))) }} comentarios={forum.comentarios.map((comentario) => ({ ...comentario, perfilAutor: comentario.perfilAutor ?? perfilDoUsuario(forum.usuarios.find((usuario) => Number(usuario.id) === Number(comentario.idAutor))) }))} podeGerenciarTopico={forum.podeGerenciarTopico} podeArquivarTopico={forum.podeArquivarTopico} podeEditarTopico={forum.podeEditarTopico} podeEditarComentario={forum.podeEditarComentario} podeApagarTopico={forum.podeApagarTopico} podeExcluirComentario={forum.podeExcluirComentario} onFechar={forum.fecharTopicoSelecionado} onArquivar={forum.arquivarTopicoSelecionado} onEditarTopico={abrirEdicao} onExcluirTopico={async () => { if (await forum.excluirTopico(forum.topicoSelecionado)) setTela('lista'); }} onExcluirComentario={forum.excluirComentarioSelecionado} onEditarComentario={(comentario) => { setComentarioEditando(comentario); setTexto(comentario.conteudo); }} textoComentario={texto} onMudarComentario={setTexto} onEnviarComentario={enviarComentario} comentarioEditando={comentarioEditando} onCancelarEdicaoComentario={() => { setComentarioEditando(null); setTexto(''); }} onVoltar={() => setTela('lista')} desabilitado={processando} comentariosBloqueados={forum.comentariosBloqueados} />}
  </main><Rodape /></div>;
}
