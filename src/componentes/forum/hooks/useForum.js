import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apagarComentario, apagarTopico, atualizarComentario, atualizarTopico, buscarComentarios,
  buscarTopicos, buscarMeusTopicos, buscarUsuarios, criarComentario, criarTopico, fecharTopico, arquivarTopico
} from '../servicos/servicoForum';
import { useAutenticacao } from '../../../contextos/useAutenticacao';
import { useRestricoes } from '../../../contextos/useRestricoes';

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
  if (erro?.status >= 500) return 'O serviço está indisponível. Tente novamente mais tarde.';
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
  const { sessao, autenticado } = useAutenticacao();
  const { bloqueado } = useRestricoes();
  const topicosBloqueados = bloqueado('TOPICOS');
  const comentariosBloqueados = bloqueado('COMENTARIOS');
  const [meusTopicos, setMeusTopicos] = useState(false);
  const buscaAtual = useRef('');
  const consultaAtual = useRef(0);
  const [topicos, setTopicos] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [topicoSelecionado, setTopicoSelecionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const tratarErro = useCallback((erro) => {
    const mensagem = mensagemDoErro(erro);
    setMensagemErro(mensagem);
    return mensagem;
  }, []);

  const carregarTopicos = useCallback(async (numeroPagina = 0, busca = buscaAtual.current) => {
    const consulta = ++consultaAtual.current;
    if (topicosBloqueados) { setTopicos([]); setComentarios([]); setTopicoSelecionado(null); setCarregando(false); return; }
    buscaAtual.current = busca;
    setCarregando(true);
    setMensagemErro('');
    try {
      const buscar = meusTopicos && autenticado ? buscarMeusTopicos : buscarTopicos;
      const resultado = listaDaResposta(await buscar(numeroPagina, TAMANHO_PAGINA, busca));
      if (consulta !== consultaAtual.current) return;
      setTopicos(resultado.itens);
      setPagina(numeroPagina);
      setTotalPaginas(resultado.totalPaginas);
    } catch (erro) {
      if (consulta === consultaAtual.current) { setTopicos([]); tratarErro(erro); }
    } finally { if (consulta === consultaAtual.current) setCarregando(false); }
  }, [tratarErro, topicosBloqueados, meusTopicos, autenticado]);

  useEffect(() => {
    queueMicrotask(() => carregarTopicos(0));
    if (autenticado) buscarUsuarios().then(setUsuarios).catch(tratarErro);
    return undefined;
  }, [autenticado, carregarTopicos, tratarErro]);

  async function carregarComentarios(idTopico) {
    if (comentariosBloqueados) return;
    try { setComentarios(await buscarComentarios(idTopico) || []); } catch (erro) { tratarErro(erro); }
  }

  async function selecionarTopico(topico) {
    if (topicosBloqueados) return;
    setTopicoSelecionado(topico);
    setComentarios([]);
    await carregarComentarios(topico.id);
  }

  async function salvarTopico(titulo, descricao) {
    if (!autenticado || topicosBloqueados) return null;
    try { const novo = await criarTopico({ titulo, descricao }); await carregarTopicos(pagina); return novo; }
    catch (erro) { tratarErro(erro); return null; }
  }

  async function salvarComentario(texto) {
    if (!autenticado || comentariosBloqueados) return false;
    if (!topicoSelecionado || topicoSelecionado.fechado) return false;
    try { await criarComentario(topicoSelecionado.id, texto); await carregarComentarios(topicoSelecionado.id); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  function ehAutor(item) {
    return autenticado && Number(idDoAutor(item)) === Number(sessao?.idUsuario ?? sessao?.id);
  }
  function podeEditarTopico(topico) {
    if (topicosBloqueados) return false;
    return ehAutor(topico);
  }
  function podeEditarComentario(comentario) {
    if (comentariosBloqueados) return false;
    return ehAutor(comentario);
  }
  function ehAdministrador() { return autenticado && ['ADMINISTRADOR', 'ADMIN', 'ROLE_ADMIN'].includes(sessao?.perfil); }
  function ehProfessor() { return autenticado && ['PROFESSOR', 'PROF', 'ROLE_PROFESSOR'].includes(sessao?.perfil); }
  function podeGerenciarTopico(topico) { return !topicosBloqueados && (ehAdministrador() || ehAutor(topico)); }
  function podeArquivarTopico(topico) { return !topicosBloqueados && (ehAdministrador() || (ehProfessor() && ehAutor(topico))); }
  function podeApagarTopico() { return !topicosBloqueados && ehAdministrador(); }
  function podeExcluirComentario(comentario) { return !comentariosBloqueados && (ehAdministrador() || ehAutor(comentario)); }

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
    meusTopicos, setMeusTopicos, topicosBloqueados, comentariosBloqueados,
    autenticado, sessao, topicos, usuarios, pagina, totalPaginas, carregando, topicoSelecionado, comentarios, mensagemErro,
    limparMensagem: () => setMensagemErro(''), carregarTopicos, selecionarTopico, salvarTopico, salvarComentario,
    editarTopico, editarComentario, excluirTopico, fecharTopicoSelecionado, arquivarTopicoSelecionado,
    excluirComentarioSelecionado, podeGerenciarTopico, podeArquivarTopico, podeEditarTopico, podeEditarComentario, podeApagarTopico, podeExcluirComentario
  };
}
