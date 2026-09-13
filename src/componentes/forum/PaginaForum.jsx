import { useState } from 'react';
import CabecalhoForum from './componentes/CabecalhoForum';
import DetalheTopico from './componentes/DetalheTopico';
import FormularioTopico from './componentes/FormularioTopico';
import ListaTopicos from './componentes/ListaTopicos';
import { useForum } from './hooks/useForum';
import { buscarTopicosPesquisa } from './servicos/servicoForum';
import './Forum.css';

function TelaLista({ topicos, usuarios, termo, buscando, onTermoChange, onPesquisar, onSelecionar, onNovaPostagem }) {
  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Fórum de Dúvidas</h2>
        <div className="page-actions">
          <div className="barra-pesquisa">
            <input
              className="campo-pesquisa"
              type="search"
              aria-label="Pesquisar tópicos"
              placeholder="Pesquisar tópicos"
              value={termo}
              onChange={onTermoChange}
              onKeyDown={onPesquisar}
            />
            {buscando && <span className="status-pesquisa">Buscando...</span>}
          </div>
          <button className="btn btn-primary" type="button" onClick={onNovaPostagem}>
            Nova Postagem
          </button>
        </div>
      </div>
      <ListaTopicos topicos={topicos} usuarios={usuarios} onSelecionar={onSelecionar} />
    </>
  );
}

function TelaPesquisa({ termo, resultados, usuarios, onVoltar, onSelecionar }) {
  return (
    <section className="pagina-pesquisa">
      <button className="btn btn-link" type="button" onClick={onVoltar}>
        ← Voltar para os tópicos
      </button>
      <div className="cabecalho-pesquisa">
        <h3 className="titulo-pesquisa">Resultados para: <strong>{termo}</strong></h3>
        <p className="resumo-pesquisa">{resultados.length} tópico(s) encontrado(s)</p>
      </div>
      {resultados.length > 0 ? (
        <ListaTopicos topicos={resultados} usuarios={usuarios} onSelecionar={onSelecionar} />
      ) : (
        <div className="card vazio-pesquisa">Não foi encontrado nada com esse nome.</div>
      )}
    </section>
  );
}

function TelaCriacaoEdicao({ titulo, descricao, editando, onMudarTitulo, onMudarDescricao, onSalvar, onCancelar }) {
  return (
    <FormularioTopico
      titulo={titulo}
      descricao={descricao}
      onMudarTitulo={onMudarTitulo}
      onMudarDescricao={onMudarDescricao}
      onPublicar={onSalvar}
      onCancelar={onCancelar}
      modoEdicao={editando}
    />
  );
}

function TelaDetalhe({ topico, forum, texto, comentarioEmEdicao, onEditarTopico, onExcluirTopico, onEditarComentario, onMudarTexto, onEnviarComentario, onCancelarComentario, onFechar, onVoltar }) {
  return (
    <DetalheTopico
      topico={topico}
      comentarios={forum.comentarios}
      podeGerenciarTopico={forum.podeGerenciarTopico}
      podeEditarTopico={forum.podeEditarTopico}
      podeEditarComentario={forum.podeEditarComentario}
      podeApagarTopico={forum.podeApagarTopico}
      podeExcluirComentario={forum.podeExcluirComentario}
      onFechar={onFechar}
      onEditarTopico={onEditarTopico}
      onExcluirTopico={onExcluirTopico}
      onExcluirComentario={forum.excluirComentarioSelecionado}
      onEditarComentario={onEditarComentario}
      textoComentario={texto}
      onMudarComentario={onMudarTexto}
      onEnviarComentario={onEnviarComentario}
      comentarioEditando={comentarioEmEdicao}
      onCancelarEdicaoComentario={onCancelarComentario}
      onVoltar={onVoltar}
    />
  );
}

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
  const [erroTela, setErroTela] = useState('');
  const forum = useForum();

  function trocarUsuario(id) {
    const usuario = forum.usuarios.find((item) => item.id === id);
    if (usuario) forum.setUsuarioAtual(usuario);
  }

  async function publicar() {
    if (!titulo.trim() || !descricao.trim()) {
      setErroTela('Preencha o título e a descrição.');
      return;
    }

    setErroTela('');
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
    if (!titulo.trim() || !descricao.trim()) {
      setErroTela('Preencha o título e a descrição.');
      return;
    }

    setErroTela('');
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
    if (!textoBusca) {
      setErroTela('Digite um termo para pesquisar.');
      return;
    }

    setErroTela('');
    setBuscando(true);
    try {
      const topicos = await buscarTopicosPesquisa(forum.usuarioAtual, textoBusca);
      setBusca(topicos);
      setTela('search');
    } catch (erro) {
      setErroTela(erro.message || 'Não foi possível pesquisar os tópicos.');
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
        {erroTela && (
          <div className="card aviso-erro" role="alert">
            <span>{erroTela}</span>
            <button className="btn btn-link" type="button" onClick={() => setErroTela('')}>Fechar</button>
          </div>
        )}

        {tela === 'list' && (
          <TelaLista
            topicos={forum.topicos}
            usuarios={forum.usuarios}
            termo={termo}
            buscando={buscando}
            onTermoChange={(evento) => setTermo(evento.target.value)}
            onPesquisar={pesquisar}
            onNovaPostagem={() => setTela('create')}
            onSelecionar={(topico) => {
              forum.selecionarTopico(topico);
              setTela('detail');
            }}
          />
        )}

        {tela === 'search' && (
          <TelaPesquisa
            termo={termo}
            resultados={busca}
            usuarios={forum.usuarios}
            onVoltar={() => setTela('list')}
            onSelecionar={(topico) => {
              forum.selecionarTopico(topico);
              setTela('detail');
            }}
          />
        )}

        {(tela === 'create' || (tela === 'detail' && editando)) && (
          <TelaCriacaoEdicao
            titulo={titulo}
            descricao={descricao}
            editando={editando}
            onMudarTitulo={setTitulo}
            onMudarDescricao={setDescricao}
            onSalvar={tela === 'create' ? publicar : salvarEdicao}
            onCancelar={() => {
              if (editando) {
                setEditando(false);
                return;
              }
              setTela('list');
            }}
          />
        )}

        {tela === 'detail' && forum.topicoSelecionado && !editando && (
          <TelaDetalhe
            topico={forum.topicoSelecionado}
            forum={forum}
            texto={texto}
            comentarioEmEdicao={comentarioEmEdicao}
            onFechar={forum.fecharTopicoSelecionado}
            onEditarTopico={editarTopico}
            onExcluirTopico={excluir}
            onEditarComentario={editarComentario}
            onMudarTexto={setTexto}
            onEnviarComentario={comentarioEmEdicao ? salvarComentarioEditado : enviar}
            onCancelarComentario={() => {
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