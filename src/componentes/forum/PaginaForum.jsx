import { useState } from 'react';
import CabecalhoForum from './componentes/CabecalhoForum';
import DetalheTopico from './componentes/DetalheTopico';
import FormularioTopico from './componentes/FormularioTopico';
import ListaTopicos from './componentes/ListaTopicos';
import { useForum } from './hooks/useForum';
import { buscarTopicosPesquisa } from './servicos/servicoForum';
import './Forum.css';

export default function PaginaForum() {
  const [tela, setTela] = useState('list');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [texto, setTexto] = useState('');
  const [termo, setTermo] = useState('');
  const [busca, setBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [comentarioEmEdicao, setComentarioEmEdicao] = useState(null);
  const forum = useForum();

  function trocarUsuario(id) {
    const usuario = forum.usuarios.find((item) => item.id === id);
    if (usuario) forum.setUsuarioAtual(usuario);
  }

  async function publicar() {
    if (!titulo.trim() || !descricao.trim()) {
      alert('Preencha o título e a descrição!');
      return;
    }

    const topico = await forum.salvarTopico(titulo, descricao);
    if (topico) {
      setTitulo('');
      setDescricao('');
      setTela('detail');
    }
  }

  async function enviar() {
    if (!texto.trim()) return;

    const salvou = await forum.salvarComentario(texto);
    if (salvou) setTexto('');
  }

  async function excluir() {
    const excluiu = await forum.excluirTopico(forum.topicoSelecionado);
    if (excluiu) setTela('list');
  }

  function editarTopico() {
    setTitulo(forum.topicoSelecionado.titulo);
    setDescricao(forum.topicoSelecionado.descricao);
    setEditando(true);
  }

  async function salvarEdicao() {
    if (!titulo.trim() || !descricao.trim()) return;

    const salvou = await forum.editarTopico(forum.topicoSelecionado.id, titulo, descricao);
    if (salvou) {
      setEditando(false);
      setTitulo('');
      setDescricao('');
    }
  }

  function editarComentario(comentario) {
    setComentarioEmEdicao(comentario);
    setTexto(comentario.conteudo);
  }

  async function salvarComentarioEditado() {
    if (!comentarioEmEdicao || !texto.trim()) return;

    const salvou = await forum.editarComentario(comentarioEmEdicao, texto);
    if (salvou) {
      setComentarioEmEdicao(null);
      setTexto('');
    }
  }

  async function pesquisar(evento) {
    if (evento.key !== 'Enter') return;

    evento.preventDefault();
    const textoBusca = termo.trim();
    if (!textoBusca) return;

    setBuscando(true);
    try {
      const topicos = await buscarTopicosPesquisa(forum.usuarioAtual);
      const palavra = textoBusca.toLocaleLowerCase();
      const encontrados = topicos.filter((topico) => {
        const usuario = forum.usuarios.find((item) => Number(item.id) === Number(topico.idAutor));
        const texto = [topico.titulo, topico.descricao, topico.nomeAutor, usuario?.nome]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();
        return texto.includes(palavra);
      });
      setBusca(encontrados);
      setTela('search');
    } catch (erro) {
      alert(erro.message || 'Não foi possível pesquisar os tópicos.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="app-container">
      <CabecalhoForum
        usuarios={forum.usuarios}
        usuarioAtual={forum.usuarioAtual}
        onMudarUsuario={trocarUsuario}
      />

      <main className="main-content">
        {forum.mensagemErro && (
          <div className="card aviso-erro" role="alert">
            <span>{forum.mensagemErro}</span>
            <button className="btn btn-link" type="button" onClick={forum.limparMensagem}>Fechar</button>
          </div>
        )}
        <div className="page-header">
          <h2 className="page-title">Fórum de Dúvidas</h2>
          {tela === 'list' && (
            <div className="page-actions">
              <div className="barra-pesquisa">
                <input
                  className="campo-pesquisa"
                  type="search"
                  aria-label="Pesquisar tópicos"
                  placeholder="Pesquisar tópicos"
                  value={termo}
                  onChange={(evento) => setTermo(evento.target.value)}
                  onKeyDown={pesquisar}
                />
                {buscando && <span className="status-pesquisa">Buscando...</span>}
              </div>
              <button className="btn btn-primary" type="button" onClick={() => setTela('create')}>
                Nova Postagem
              </button>
            </div>
          )}
        </div>

        {tela === 'search' && (
          <section className="pagina-pesquisa">
            <button className="btn btn-link" type="button" onClick={() => setTela('list')}>
              ← Voltar para os tópicos
            </button>
            <div className="cabecalho-pesquisa">
              <h3 className="titulo-pesquisa">Resultados para: <strong>{termo}</strong></h3>
              <p className="resumo-pesquisa">{busca.length} tópico(s) encontrado(s)</p>
            </div>
            {busca.length > 0 ? (
              <ListaTopicos topicos={busca} usuarios={forum.usuarios} onSelecionar={(topico) => {
                forum.selecionarTopico(topico);
                setTela('detail');
              }} />
            ) : (
              <div className="card vazio-pesquisa">Não foi encontrado nada com esse nome.</div>
            )}
          </section>
        )}

        {tela === 'create' && (
          <FormularioTopico
            titulo={titulo}
            descricao={descricao}
            onMudarTitulo={setTitulo}
            onMudarDescricao={setDescricao}
            onPublicar={publicar}
            onCancelar={() => setTela('list')}
          />
        )}

        {tela === 'list' && (
          <ListaTopicos topicos={forum.topicos} usuarios={forum.usuarios} onSelecionar={(topico) => {
            forum.selecionarTopico(topico);
            setTela('detail');
          }} />
        )}

        {tela === 'detail' && forum.topicoSelecionado && (
          editando ? (
            <FormularioTopico
              titulo={titulo}
              descricao={descricao}
              onMudarTitulo={setTitulo}
              onMudarDescricao={setDescricao}
              onPublicar={salvarEdicao}
              onCancelar={() => setEditando(false)}
              modoEdicao
            />
          ) : <DetalheTopico
            topico={forum.topicoSelecionado}
            comentarios={forum.comentarios}
            podeGerenciarTopico={forum.podeGerenciarTopico}
            podeEditarTopico={forum.podeEditarTopico}
            podeEditarComentario={forum.podeEditarComentario}
            podeApagarTopico={forum.podeApagarTopico}
            podeExcluirComentario={forum.podeExcluirComentario}
            onFechar={forum.fecharTopicoSelecionado}
            onEditarTopico={editarTopico}
            onExcluirTopico={excluir}
            onExcluirComentario={forum.excluirComentarioSelecionado}
            onEditarComentario={editarComentario}
            textoComentario={texto}
            onMudarComentario={setTexto}
            onEnviarComentario={comentarioEmEdicao ? salvarComentarioEditado : enviar}
            comentarioEditando={comentarioEmEdicao}
            onCancelarEdicaoComentario={() => {
              setComentarioEmEdicao(null);
              setTexto('');
            }}
            onVoltar={() => setTela('list')}
          />
        )}
      </main>

      <footer className="footer">
        <span>Termos de Uso</span>
        <span>Contato</span>
        <span>Sobre o curso_valido.dev</span>
      </footer>
    </div>
  );
}