import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requisitar } from '../servicos/api';
import { confirmarCodigo2fa } from '../servicos/servicoAutenticacao';
import { CHAVE_CONTROLE_SESSAO, controleSessao, dadosDoToken, tokenValido } from '../servicos/sessaoNavegador';
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
  for (const chave of ['token', 'curso-valido-sessao']) {
    sessionStorage.removeItem(chave);
    localStorage.removeItem(chave);
  }
  return tokenLegado;
}

export function AutenticacaoProvedor({ children }) {
  const [sessao, setSessao] = useState(() => controleSessao.obter());
  const geracao = useRef(0);
  const emailPendente = useRef('');

  const sair = useCallback(() => {
    geracao.current += 1;
    emailPendente.current = '';
    const anterior = controleSessao.encerrar();
    setSessao(null);
    sessionStorage.removeItem(CHAVE_TOKEN_TERMOS);
    const legado = limparArmazenamentoLegado();
    return revogarToken(anterior?.token ?? legado);
  }, []);

  useEffect(() => {
    const legado = limparArmazenamentoLegado();
    revogarToken(legado);

    function encerrarSessao(evento) {
      if (evento.detail?.token !== controleSessao.obter()?.token) return;
      sair();
    }

    function guardarTokenDeTermos(evento) {
      if (evento.detail?.tokenOrigem !== controleSessao.obter()?.token) return;
      sair();
      if (evento.detail?.token) sessionStorage.setItem(CHAVE_TOKEN_TERMOS, evento.detail.token);
    }

    function sincronizarAbas(evento) {
      if (evento.key !== CHAVE_CONTROLE_SESSAO) {
        if (evento.key !== null) return;
      }
      sair();
    }

    function conferirAoVoltar() {
      if (document.visibilityState !== 'visible') return;
      if (!controleSessao.possuiSessao()) return;
      if (!controleSessao.obter()) sair();
    }

    globalThis.addEventListener('curso-valido-sessao-expirada', encerrarSessao);
    globalThis.addEventListener('curso-valido-termos-pendentes', guardarTokenDeTermos);
    window.addEventListener('storage', sincronizarAbas);
    window.addEventListener('pageshow', conferirAoVoltar);
    document.addEventListener('visibilitychange', conferirAoVoltar);
    return () => {
      geracao.current += 1;
      emailPendente.current = '';
      globalThis.removeEventListener('curso-valido-sessao-expirada', encerrarSessao);
      globalThis.removeEventListener('curso-valido-termos-pendentes', guardarTokenDeTermos);
      window.removeEventListener('storage', sincronizarAbas);
      window.removeEventListener('pageshow', conferirAoVoltar);
      document.removeEventListener('visibilitychange', conferirAoVoltar);
    };
  }, [sair]);

  useEffect(() => {
    if (!sessao) return;
    const expiraEm = dadosDoToken(sessao.token)?.exp * 1000;
    const temporizador = window.setTimeout(sair, Math.min(Math.max(0, expiraEm - Date.now()), 2147483647));
    return () => window.clearTimeout(temporizador);
  }, [sessao, sair]);

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

  const valor = useMemo(() => ({
    sessao,
    autenticado: sessao ? controleSessao.obter()?.token === sessao.token : false,
    autenticarUsuario,
    validarCodigo2fa,
    sair,
  }), [autenticarUsuario, sair, sessao, validarCodigo2fa]);

  return <AutenticacaoContexto.Provider value={valor}>{children}</AutenticacaoContexto.Provider>;
}
