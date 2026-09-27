import { useCallback, useEffect, useState } from 'react';
import {
  apagarComentario, apagarTopico, atualizarComentario, atualizarTopico, buscarComentarios,
  buscarTopicos, buscarUsuarios, criarComentario, criarTopico, fecharTopico, arquivarTopico
} from '../servicos/servicoForum';
import { useAutenticacao } from '../../../contextos/useAutenticacao';

const TAMANHO_PAGINA = 5;

function listaDaResposta(resposta) {
  if (Array.isArray(resposta)) return { itens: resposta, totalPaginas: 1 };
  return { itens: resposta?.content || resposta?.itens || [], totalPaginas: resposta?.totalPages ?? 1 };
}

function mensagemDoErro(erro) {
  if (erro?.status === 401) return 'Sua sessão expirou. Faça login novamente.';
  if (erro?.codigo === 'TERMOS_NAO_ACEITOS') return 'É necessário ler e aceitar os termos novamente para acessar sua conta.';
  if (erro?.codigo === 'EMAIL_NAO_CONFIRMADO') return 'Seu e-mail ainda não foi confirmado.';
  if (erro?.status === 403) return erro?.message || 'Você não tem permissão para esta operação.';
  if (erro?.status === 404) return 'O recurso solicitado não foi encontrado.';
  if (erro?.status === 409) return 'Esta operação entrou em conflito com dados existentes.';
  if (erro?.status >= 500) return 'O servidor está indisponível no momento. Tente novamente mais tarde.';
  return erro?.message || 'Não foi possível concluir a operação.';
}

function idDoAutor(item) {
  return item?.idAutor ?? item?.idUsuario ?? item?.autor?.id ?? item?.autor?.idUsuario
    ?? item?.usuario?.id ?? item?.usuario?.idUsuario ?? item?.usuarioId;
}

export function perfilDoUsuario(usuario) {
  const perfil = usuario?.perfil ?? usuario?.tipoPerfil ?? usuario?.role ?? usuario?.tipoUsuario;
  return typeof perfil === 'object' ? perfil.nome ?? perfil.descricao ?? perfil.codigo : perfil;
}

export function useForum() {
  const { sessao, autenticado, sair } = useAutenticacao();
  const [topicos, setTopicos] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [topicoSelecionado, setTopicoSelecionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const tratarErro = useCallback((erro) => {
    if (erro?.status === 401) sair();
    const mensagem = mensagemDoErro(erro);
    setMensagemErro(mensagem);
    return mensagem;
  }, [sair]);

  const carregarTopicos = useCallback(async (numeroPagina = 0, busca = '') => {
    setCarregando(true);
    try {
      const resultado = listaDaResposta(await buscarTopicos(numeroPagina, TAMANHO_PAGINA, busca));
      setTopicos(resultado.itens);
      setPagina(numeroPagina);
      setTotalPaginas(resultado.totalPaginas);
    } catch (erro) { tratarErro(erro); } finally { setCarregando(false); }
  }, [tratarErro]);

  useEffect(() => {
    if (!autenticado) return undefined;
    queueMicrotask(() => carregarTopicos(0));
    buscarUsuarios().then(setUsuarios).catch(tratarErro);
    return undefined;
  }, [autenticado, carregarTopicos, tratarErro]);

  async function carregarComentarios(idTopico) {
    try { setComentarios(await buscarComentarios(idTopico) || []); } catch (erro) { tratarErro(erro); }
  }

  async function selecionarTopico(topico) {
    setTopicoSelecionado(topico);
    setComentarios([]);
    await carregarComentarios(topico.id);
  }

  async function salvarTopico(titulo, descricao) {
    try { const novo = await criarTopico({ titulo, descricao }); await carregarTopicos(pagina); return novo; }
    catch (erro) { tratarErro(erro); return null; }
  }

  async function salvarComentario(texto) {
    if (!topicoSelecionado || topicoSelecionado.fechado) return false;
    try { await criarComentario(topicoSelecionado.id, texto); await carregarComentarios(topicoSelecionado.id); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  function ehAutor(item) {
    return Number(idDoAutor(item)) === Number(sessao?.idUsuario ?? sessao?.id);
  }
  function podeEditarTopico(topico) { return ehAutor(topico); }
  function podeEditarComentario(comentario) { return ehAutor(comentario); }
  function ehAdministrador() { return ['ADMINISTRADOR', 'ADMIN', 'ROLE_ADMIN'].includes(sessao?.perfil); }
  function ehProfessor() { return ['PROFESSOR', 'PROF', 'ROLE_PROFESSOR'].includes(sessao?.perfil); }
  function podeGerenciarTopico(topico) { return ehAdministrador() || ehAutor(topico); }
  function podeArquivarTopico(topico) { return ehAdministrador() || (ehProfessor() && ehAutor(topico)); }
  function podeApagarTopico() { return ehAdministrador(); }
  function podeExcluirComentario(comentario) { return ehAdministrador() || ehAutor(comentario); }

  async function editarTopico(idTopico, titulo, descricao) {
    const atual = topicos.find((item) => Number(item.id) === Number(idTopico));
    if (!podeEditarTopico(atual)) return false;
    try {
      const resposta = await atualizarTopico(idTopico, { titulo, descricao });
      const atualizado = { ...atual, ...(resposta || {}), titulo, descricao };
      setTopicos((itens) => itens.map((item) => Number(item.id) === Number(idTopico) ? atualizado : item));
      setTopicoSelecionado((item) => item && Number(item.id) === Number(idTopico) ? atualizado : item);
      await carregarTopicos(pagina);
      setTopicoSelecionado((item) => item && Number(item.id) === Number(idTopico) ? atualizado : item);
      return true;
    }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function editarComentario(comentario, conteudo) {
    if (!podeEditarComentario(comentario)) return false;
    try { await atualizarComentario(comentario.id, { conteudo }); await carregarComentarios(topicoSelecionado.id); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function excluirTopico(topico) {
    if (!podeApagarTopico(topico)) return false;
    try { await apagarTopico(topico.id); await carregarTopicos(pagina); setTopicoSelecionado(null); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function fecharTopicoSelecionado(topico) {
    if (!podeGerenciarTopico(topico) || topico.fechado) return false;
    try { await fecharTopico(topico.id); setTopicoSelecionado({ ...topico, fechado: true }); await carregarTopicos(pagina); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function arquivarTopicoSelecionado(topico) {
    if (!podeArquivarTopico(topico) || topico.arquivado) return false;
    try { await arquivarTopico(topico.id); await carregarTopicos(pagina); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function excluirComentarioSelecionado(comentario) {
    if (!podeExcluirComentario(comentario)) return false;
    try { await apagarComentario(comentario.id); await carregarComentarios(topicoSelecionado.id); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  return {
    sessao, topicos, usuarios, pagina, totalPaginas, carregando, topicoSelecionado, comentarios, mensagemErro,
    limparMensagem: () => setMensagemErro(''), carregarTopicos, selecionarTopico, salvarTopico, salvarComentario,
    editarTopico, editarComentario, excluirTopico, fecharTopicoSelecionado, arquivarTopicoSelecionado,
    excluirComentarioSelecionado, podeGerenciarTopico, podeArquivarTopico, podeEditarTopico, podeEditarComentario, podeApagarTopico, podeExcluirComentario
  };
}
