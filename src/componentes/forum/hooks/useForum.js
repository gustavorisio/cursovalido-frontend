import { useCallback, useEffect, useState } from 'react';
import {
  apagarComentario,
  apagarTopico,
  atualizarComentario,
  atualizarTopico,
  buscarComentarios,
  buscarUsuarios,
  buscarTopicos,
  criarComentario,
  criarTopico,
  fecharTopico
} from '../servicos/servicoForum';
import { USUARIOS_MOCK } from '../dados/usuariosMock';

function erroMsg(erro) {
  if (!erro?.status) return 'Não foi possível conectar à API do fórum.';

  const mensagens = {
    400: 'Os dados enviados são inválidos.',
    403: 'Você não tem permissão para esta operação.',
    404: 'O recurso solicitado não foi encontrado.',
    409: 'A operação não pode ser concluída neste estado.'
  };

  return erro.message || mensagens[erro.status] || 'Não foi possível concluir a operação.';
}

function comNomes(topicos, usuarios) {
  return topicos.map((topico) => {
    const usuario = usuarios.find((item) => Number(item.id) === Number(topico.idAutor));
    return usuario ? { ...topico, nomeAutor: usuario.nome } : topico;
  });
}

export function useForum() {
  const [usuarioAtual, setUsuarioAtual] = useState(USUARIOS_MOCK[0]);
  const [topicos, setTopicos] = useState([]);
  const [topicoSelecionado, setTopicoSelecionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [usuarios, setUsuarios] = useState(USUARIOS_MOCK);
  const [mensagemErro, setMensagemErro] = useState('');

  const mostrarErro = useCallback((erro) => {
    const mensagem = erroMsg(erro);
    setMensagemErro(mensagem);
    return mensagem;
  }, []);

  useEffect(() => {
    async function carregar() {
      const [topicosResult, usuariosResult] = await Promise.allSettled([
        buscarTopicos(0, 10, USUARIOS_MOCK[0]),
        buscarUsuarios(USUARIOS_MOCK[0])
      ]);

      let usuariosAtuais = USUARIOS_MOCK;

      if (usuariosResult.status === 'fulfilled') {
        const dados = usuariosResult.value;
        if (Array.isArray(dados) && dados.length > 0) {
          usuariosAtuais = dados.map((usuario) => {
            const usuarioMock = USUARIOS_MOCK.find((item) => item.id === usuario.id);
            return usuarioMock ? { ...usuario, nome: usuarioMock.nome } : usuario;
          });
          setUsuarios(usuariosAtuais);
          setUsuarioAtual(usuariosAtuais[0]);
        }
      } else {
        mostrarErro(usuariosResult.reason);
      }

      if (topicosResult.status === 'fulfilled') {
        setTopicos(comNomes(topicosResult.value ?? [], usuariosAtuais));
      } else {
        mostrarErro(topicosResult.reason);
      }
    }

    carregar();
  }, [mostrarErro]);

  async function carregarTopicos() {
    try {
      setTopicos(comNomes((await buscarTopicos(0, 10, usuarioAtual)) ?? [], usuarios));
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function carregarComentarios(idTopico) {
    try {
      const dados = await buscarComentarios(idTopico, usuarioAtual);
      const lista = comNomes(dados ?? [], usuarios);
      setComentarios(lista);
      setTopicos((listaAtual) => listaAtual.map((topico) => (
        topico.id === idTopico ? { ...topico, quantidadeRespostas: lista.length } : topico
      )));
      setTopicoSelecionado((topicoAtual) => (
        topicoAtual?.id === idTopico
          ? { ...topicoAtual, quantidadeRespostas: lista.length }
          : topicoAtual
      ));
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function selecionarTopico(topico) {
    setTopicoSelecionado(topico);
    setComentarios([]);
    await carregarComentarios(topico.id);
  }

  async function salvarTopico(titulo, descricao) {
    try {
      const novoTopico = comNomes(
        [await criarTopico({ titulo, descricao }, usuarioAtual)],
        usuarios
      )[0];
      await carregarTopicos();
      setTopicoSelecionado(novoTopico);
      setComentarios([]);
      return novoTopico;
    } catch (erro) {
      mostrarErro(erro);
      return null;
    }
  }

  async function salvarComentario(texto) {
    if (!topicoSelecionado) return false;

    try {
      await criarComentario(topicoSelecionado.id, texto, usuarioAtual);
      await carregarComentarios(topicoSelecionado.id);
      await carregarTopicos();
      return true;
    } catch (erro) {
      mostrarErro(erro);
      return false;
    }
  }

  function podeGerenciarTopico(topico) {
    return usuarioAtual.perfil === 'ADMINISTRADOR' || Number(topico.idAutor) === usuarioAtual.id;
  }

  function podeEditarTopico(topico) {
    return Number(topico.idAutor) === usuarioAtual.id;
  }

  function podeEditarComentario(comentario) {
    return usuarioAtual.perfil === 'ADMINISTRADOR' || Number(comentario.idAutor) === usuarioAtual.id;
  }

  function podeApagarTopico() {
    return usuarioAtual.perfil === 'ADMINISTRADOR';
  }

  function podeExcluirComentario(comentario) {
    return podeEditarComentario(comentario);
  }

  async function editarTopico(idTopico, titulo, descricao) {
    const topicoAtual = topicos.find((item) => item.id === idTopico);
    if (!topicoAtual || !podeEditarTopico(topicoAtual)) return false;

    try {
      const topicoAtualizado = await atualizarTopico(idTopico, { titulo, descricao }, usuarioAtual);
      const atualizado = comNomes([topicoAtualizado], usuarios)[0];
      setTopicos((listaAtual) => listaAtual.map((item) => item.id === idTopico ? atualizado : item));
      setTopicoSelecionado((item) => item?.id === idTopico ? atualizado : item);
      return true;
    } catch (erro) {
      mostrarErro(erro);
      return false;
    }
  }

  async function editarComentario(comentario, conteudo) {
    if (!podeEditarComentario(comentario)) return false;

    try {
      const comentarioAtualizado = await atualizarComentario(comentario.id, { conteudo }, usuarioAtual);
      const atualizado = comNomes([comentarioAtualizado], usuarios)[0];
      setComentarios((listaAtual) => listaAtual.map((item) => item.id === comentario.id ? atualizado : item));
      return true;
    } catch (erro) {
      mostrarErro(erro);
      return false;
    }
  }

  async function excluirTopico(topico) {
    if (!podeApagarTopico() || !window.confirm('Excluir esta postagem?')) return false;

    try {
      await apagarTopico(topico.id, usuarioAtual);
      setTopicos((listaAtual) => listaAtual.filter((item) => item.id !== topico.id));
      if (topicoSelecionado?.id === topico.id) {
        setTopicoSelecionado(null);
        setComentarios([]);
      }
      return true;
    } catch (erro) {
      mostrarErro(erro);
      return false;
    }
  }

  async function fecharTopicoSelecionado(topico) {
    if (!podeGerenciarTopico(topico) || topico.fechado || !window.confirm('Fechar este tópico para novas respostas?')) return;

    try {
      await fecharTopico(topico.id, usuarioAtual);
      const topicoFechado = { ...topico, fechado: true };
      setTopicoSelecionado((atual) => atual?.id === topico.id ? topicoFechado : atual);
      setTopicos((listaAtual) => listaAtual.map((item) => item.id === topico.id ? topicoFechado : item));
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  async function excluirComentarioSelecionado(comentario) {
    if (!podeExcluirComentario(comentario) || !window.confirm('Excluir este comentário?')) return;

    try {
      await apagarComentario(comentario.id, usuarioAtual);
      setComentarios((listaAtual) => listaAtual.map((item) => (
        item.id === comentario.id
          ? { ...item, conteudo: 'mensagem apagada', ativo: false }
          : item
      )));
      await carregarTopicos();
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  return {
    usuarioAtual,
    setUsuarioAtual,
    usuarios,
    topicos,
    topicoSelecionado,
    comentarios,
    mensagemErro,
    limparMensagem: () => setMensagemErro(''),
    selecionarTopico,
    salvarTopico,
    salvarComentario,
    editarTopico,
    editarComentario,
    excluirTopico,
    fecharTopicoSelecionado,
    excluirComentarioSelecionado,
    podeGerenciarTopico,
    podeEditarTopico,
    podeEditarComentario,
    podeApagarTopico,
    podeExcluirComentario
  };
}