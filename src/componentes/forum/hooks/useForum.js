import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apagarComentario, atualizarComentario, atualizarTopico, buscarComentarios,
  buscarTopicos, buscarMeusTopicos, buscarUsuarios, criarComentario, criarTopico, fecharTopico, arquivarTopico
} from '../servicos/servicoForum';
import { useAutenticacao } from '../../../contextos/useAutenticacao';
import { useRestricoes } from '../../../contextos/useRestricoes';

const TAMANHO_PAGINA = 10;

function listaDaResposta(resposta, pagina) {
  if (Array.isArray(resposta)) return { itens: resposta, totalPaginas: pagina + (resposta.length === TAMANHO_PAGINA ? 2 : 1) };
  return { itens: resposta?.content || resposta?.itens || [], totalPaginas: resposta?.totalPages ?? 1 };
}

function mensagemDoErro(erro) {
  return erro?.message || 'Não foi possível concluir esta ação. Tente novamente.';
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
  const [mensagemSucesso, setMensagemSucesso] = useState('');
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
      const resultado = listaDaResposta(await buscar(numeroPagina, TAMANHO_PAGINA, busca), numeroPagina);
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

  function limparMensagem() {
    setMensagemErro('');
    setMensagemSucesso('');
  }

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
    limparMensagem();
    if (!autenticado || topicosBloqueados) { setMensagemErro(!autenticado ? 'Entre na sua conta para publicar um tópico.' : 'Sua conta está impedida de publicar tópicos. Consulte o aviso de restrição ou fale com o Suporte.'); return null; }
    try { const novo = await criarTopico({ titulo, descricao }); setMensagemSucesso('Tópico publicado.'); await carregarTopicos(0); return novo; }
    catch (erro) { tratarErro(erro); return null; }
  }

  async function salvarComentario(texto) {
    limparMensagem();
    if (!autenticado || comentariosBloqueados) { setMensagemErro(!autenticado ? 'Entre na sua conta para comentar.' : 'Sua conta está impedida de comentar. Consulte o aviso de restrição ou fale com o Suporte.'); return false; }
    if (!topicoSelecionado || topicoSelecionado.fechado) { setMensagemErro('Este tópico não está disponível para novos comentários. Escolha outro tópico.'); return false; }
    try { await criarComentario(topicoSelecionado.id, texto); setMensagemSucesso('Comentário publicado.'); await carregarComentarios(topicoSelecionado.id); return true; }
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
  function podeGerenciarTopico(topico) { return !topicosBloqueados && (ehAdministrador() || ehAutor(topico)); }
  function podeExcluirComentario(comentario) { return !comentariosBloqueados && (ehAdministrador() || ehAutor(comentario)); }

  async function editarTopico(idTopico, titulo, descricao) {
    limparMensagem();
    const atual = topicos.find((item) => Number(item.id) === Number(idTopico));
    if (!podeEditarTopico(atual)) { setMensagemErro('Você só pode editar os seus tópicos quando sua conta tem permissão para participar.'); return false; }
    try {
      const resposta = await atualizarTopico(idTopico, { titulo, descricao });
      setMensagemSucesso('Tópico atualizado.');
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
    limparMensagem();
    if (!podeEditarComentario(comentario)) { setMensagemErro('Você só pode editar os seus comentários quando sua conta tem permissão para participar.'); return false; }
    try { await atualizarComentario(comentario.id, { conteudo }); setMensagemSucesso('Comentário atualizado.'); await carregarComentarios(topicoSelecionado.id); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function fecharTopicoSelecionado(topico) {
    limparMensagem();
    if (!podeGerenciarTopico(topico) || topico.fechado) { setMensagemErro('Você não pode fechar este tópico ou ele já está fechado.'); return false; }
    try { await fecharTopico(topico.id); setMensagemSucesso('Tópico fechado. Novos comentários não serão aceitos.'); setTopicoSelecionado({ ...topico, fechado: true }); await carregarTopicos(pagina); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function arquivarTopicoSelecionado(topico) {
    limparMensagem();
    if (!podeGerenciarTopico(topico) || topico.arquivado) { setMensagemErro('Você não tem permissão para arquivar este tópico ou ele já foi arquivado.'); return false; }
    try { await arquivarTopico(topico.id); setMensagemSucesso('Tópico arquivado e removido da lista.'); await carregarTopicos(pagina); setTopicoSelecionado(null); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  async function excluirComentarioSelecionado(comentario) {
    limparMensagem();
    if (!podeExcluirComentario(comentario)) { setMensagemErro('Você não tem permissão para excluir este comentário.'); return false; }
    try { await apagarComentario(comentario.id); setMensagemSucesso('Comentário excluído.'); await carregarComentarios(topicoSelecionado.id); return true; }
    catch (erro) { tratarErro(erro); return false; }
  }

  return {
    meusTopicos, setMeusTopicos, topicosBloqueados, comentariosBloqueados,
    autenticado, sessao, topicos, usuarios, pagina, totalPaginas, carregando, topicoSelecionado, comentarios, mensagemErro, mensagemSucesso,
    limparMensagem, carregarTopicos, selecionarTopico, salvarTopico, salvarComentario,
    editarTopico, editarComentario, fecharTopicoSelecionado, arquivarTopicoSelecionado,
    excluirComentarioSelecionado, podeGerenciarTopico, podeEditarTopico, podeEditarComentario, podeExcluirComentario
  };
}
