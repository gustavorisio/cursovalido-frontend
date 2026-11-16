import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requisitar } from '../servicos/api';
import { aceitarTermosNovamente, confirmarCodigo2fa, decidirTermos } from '../servicos/servicoAutenticacao';
import { CHAVE_SESSAO, controleSessao, dadosDoToken, tokenValido } from '../servicos/sessaoNavegador';
import { AutenticacaoContexto } from './contextoBaseAutenticacao';

const CHAVE_TOKEN_TERMOS = 'curso-valido-token-termos';

async function revogarToken(token) {
  if (!tokenValido(token)) return;
  try {
    await requisitar('/autenticacao/logout', { method: 'POST', tokenAutenticacao: token, keepalive: true });
  } catch {
    // A conta ja foi removida da interface. Tokens expirados/revogados retornam 401;
    // uma falha de rede nao pode restaurar a sessao local.
  }
}

function limparArmazenamentoLegado() {
  const tokenLegado = sessionStorage.getItem('token') ?? localStorage.getItem('token');
  for (const chave of ['token', 'curso-valido-sessao', 'curso-valido-sessao-aba', 'curso-valido-controle-sessao']) {
    sessionStorage.removeItem(chave);
    localStorage.removeItem(chave);
  }
  return tokenLegado;
}

function recuperarSessao() {
  const persistente = controleSessao.obter();
  if (persistente) return persistente;
  try {
    const anterior = JSON.parse(sessionStorage.getItem('curso-valido-sessao-aba'));
    if (anterior?.controle === localStorage.getItem('curso-valido-controle-sessao') && tokenValido(anterior.token)) {
      const { token, idUsuario, nome, perfil } = anterior;
      return controleSessao.iniciar({ token, idUsuario, nome, perfil });
    }
  } catch {
    // Uma sessão anterior inválida será removida na inicialização.
  }
  return null;
}

export function AutenticacaoProvedor({ children }) {
  const [sessao, setSessao] = useState(recuperarSessao);
  const geracao = useRef(0);
  const emailPendente = useRef('');

  const encerrarSessaoLocal = useCallback(() => {
    geracao.current += 1;
    emailPendente.current = '';
    const anterior = controleSessao.encerrar();
    setSessao(null);
    sessionStorage.removeItem(CHAVE_TOKEN_TERMOS);
    const legado = limparArmazenamentoLegado();
    return anterior?.token ?? legado;
  }, []);

  const sair = useCallback(() => revogarToken(encerrarSessaoLocal()), [encerrarSessaoLocal]);

  useEffect(() => {
    const legado = limparArmazenamentoLegado();
    revogarToken(legado);

    function encerrarSessao(evento) {
      if (evento.detail?.token !== controleSessao.obter()?.token) return;
      sair();
    }

    function sincronizarAbas(evento) {
      if (evento.key !== CHAVE_SESSAO && evento.key !== null) return;
      geracao.current += 1;
      emailPendente.current = '';
      setSessao(controleSessao.obter());
    }

    function conferirAoVoltar() {
      if (document.visibilityState !== 'visible') return;
      setSessao(controleSessao.obter());
    }

    globalThis.addEventListener('curso-valido-sessao-expirada', encerrarSessao);
    window.addEventListener('storage', sincronizarAbas);
    window.addEventListener('pageshow', conferirAoVoltar);
    document.addEventListener('visibilitychange', conferirAoVoltar);
    return () => {
      geracao.current += 1;
      emailPendente.current = '';
      globalThis.removeEventListener('curso-valido-sessao-expirada', encerrarSessao);
      window.removeEventListener('storage', sincronizarAbas);
      window.removeEventListener('pageshow', conferirAoVoltar);
      document.removeEventListener('visibilitychange', conferirAoVoltar);
    };
  }, [sair]);

  useEffect(() => {
    if (!sessao) return;
    const expiraEm = dadosDoToken(sessao.token)?.exp * 1000;
    const temporizador = window.setTimeout(() => setSessao(controleSessao.obter()), Math.min(Math.max(0, expiraEm - Date.now()), 2147483647));
    return () => window.clearTimeout(temporizador);
  }, [sessao]);

  const guardarResposta = useCallback(async (resposta, tentativa) => {
    if (geracao.current !== tentativa) {
      await revogarToken(resposta.token);
      throw new Error('A tentativa de login foi encerrada. Entre novamente.');
    }
    geracao.current += 1;
    let nova;
    try {
      nova = controleSessao.iniciar({ token: resposta.token, idUsuario: resposta.idUsuario, nome: resposta.nome, perfil: resposta.perfil });
    } catch (erro) {
      await revogarToken(resposta.token);
      throw erro;
    }
    emailPendente.current = '';
    sessionStorage.removeItem(CHAVE_TOKEN_TERMOS);
    setSessao(nova);
    return nova;
  }, []);

  const autenticarUsuario = useCallback(async (email, senha) => {
    const encerramento = sair();
    const tentativa = geracao.current;
    await encerramento;
    if (geracao.current !== tentativa) throw new Error('A tentativa de login foi encerrada. Entre novamente.');
    const resposta = await requisitar('/autenticacao/login', { method: 'POST', semAutenticacao: true, body: JSON.stringify({ email, senha }) });
    if (geracao.current !== tentativa) throw new Error('A tentativa de login foi encerrada. Entre novamente.');
    if (resposta.requerCodigo2fa) {
      emailPendente.current = email.trim().toLowerCase();
      return { requerCodigo2fa: true };
    }
    return guardarResposta(resposta, tentativa);
  }, [sair, guardarResposta]);

  const validarCodigo2fa = useCallback(async (email, codigo) => {
    if (emailPendente.current !== email.trim().toLowerCase()) throw new Error('Inicie o login novamente antes de informar o código.');
    const tentativa = geracao.current;
    const resposta = await confirmarCodigo2fa(email, codigo);
    return guardarResposta(resposta, tentativa);
  }, [guardarResposta]);

  const confirmarAceiteTermos = useCallback(async (token, versao, responsabilidade) => {
    const tentativa = geracao.current;
    const resposta = await aceitarTermosNovamente(token, versao, responsabilidade);
    return guardarResposta(resposta, tentativa);
  }, [guardarResposta]);

  const encerrarPorDecisaoTermos = useCallback(async (token, aceitou) => {
    const tentativa = geracao.current;
    await decidirTermos(token, aceitou);
    const tokenAtual = controleSessao.obter()?.token ?? sessionStorage.getItem(CHAVE_TOKEN_TERMOS);
    if (geracao.current !== tentativa || (tokenAtual && tokenAtual !== token)) {
      throw new Error('A sessão mudou. Abra a tela de termos novamente.');
    }
    encerrarSessaoLocal();
  }, [encerrarSessaoLocal]);

  const valor = useMemo(() => ({
    sessao,
    autenticado: sessao ? controleSessao.obter()?.token === sessao.token : false,
    autenticarUsuario,
    validarCodigo2fa,
    confirmarAceiteTermos,
    encerrarPorDecisaoTermos,
    sair,
  }), [autenticarUsuario, confirmarAceiteTermos, encerrarPorDecisaoTermos, sair, sessao, validarCodigo2fa]);

  return <AutenticacaoContexto.Provider value={valor}>{children}</AutenticacaoContexto.Provider>;
}
