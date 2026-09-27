import { useCallback, useEffect, useMemo, useState } from 'react';
import { requisitar } from '../servicos/api';
import { confirmarCodigo2fa } from '../servicos/servicoAutenticacao';
import { AutenticacaoContexto } from './contextoBaseAutenticacao';

const CHAVE_SESSAO = 'curso-valido-sessao';
const CHAVE_TOKEN = 'token';
const CHAVE_TOKEN_TERMOS = 'curso-valido-token-termos';

function lerSessao() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)) || null;
  } catch {
    return null;
  }
}

function tokenValido(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3) return false;
  try {
    const partePayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadComPadding = partePayload.padEnd(Math.ceil(partePayload.length / 4) * 4, '=');
    const dados = JSON.parse(atob(payloadComPadding));
    return !dados.exp || dados.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AutenticacaoProvedor({ children }) {
  const [sessao, setSessao] = useState(lerSessao);

  const limparSessao = useCallback(() => {
    setSessao(null);
    sessionStorage.removeItem(CHAVE_SESSAO);
    sessionStorage.removeItem(CHAVE_TOKEN);
    sessionStorage.removeItem(CHAVE_TOKEN_TERMOS);
    localStorage.removeItem(CHAVE_TOKEN);
  }, []);

  useEffect(() => {
    function encerrarSessao() { limparSessao(); }
    function guardarTokenDeTermos(evento) {
      limparSessao();
      const token = evento.detail?.token;
      if (token) sessionStorage.setItem(CHAVE_TOKEN_TERMOS, token);
    }
    globalThis.addEventListener?.('curso-valido-sessao-expirada', encerrarSessao);
    globalThis.addEventListener?.('curso-valido-termos-pendentes', guardarTokenDeTermos);
    return () => {
      globalThis.removeEventListener?.('curso-valido-sessao-expirada', encerrarSessao);
      globalThis.removeEventListener?.('curso-valido-termos-pendentes', guardarTokenDeTermos);
    };
  }, [limparSessao]);

  useEffect(() => {
    if (sessao) {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
      sessionStorage.setItem('token', sessao.token);
    } else {
      sessionStorage.removeItem(CHAVE_SESSAO);
      sessionStorage.removeItem('token');
    }
  }, [sessao]);

  const autenticarUsuario = useCallback(async (email, senha) => {
    limparSessao();
    const resposta = await requisitar('/autenticacao/login', {
      method: 'POST',
      semAutenticacao: true,
      body: JSON.stringify({ email, senha })
    });
    if (resposta.requerCodigo2fa) return { requerCodigo2fa: true };
    const novaSessao = {
      token: resposta.token,
      idUsuario: resposta.idUsuario,
      nome: resposta.nome,
      perfil: resposta.perfil
    };
    sessionStorage.removeItem(CHAVE_TOKEN_TERMOS);
    sessionStorage.setItem(CHAVE_TOKEN, novaSessao.token);
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(novaSessao));
    setSessao(novaSessao);
    return novaSessao;
  }, [limparSessao]);

  const sair = useCallback(() => {
    limparSessao();
  }, [limparSessao]);

  const validarCodigo2fa = useCallback(async (email, codigo) => {
    const resposta = await confirmarCodigo2fa(email, codigo);
    const novaSessao = {
      token: resposta.token,
      idUsuario: resposta.idUsuario,
      nome: resposta.nome,
      perfil: resposta.perfil
    };
    sessionStorage.removeItem(CHAVE_TOKEN_TERMOS);
    setSessao(novaSessao);
    return novaSessao;
  }, []);

  const valor = useMemo(() => ({
    sessao,
    autenticado: tokenValido(sessao?.token),
    autenticarUsuario,
    validarCodigo2fa,
    sair
  }), [autenticarUsuario, sair, sessao, validarCodigo2fa]);

  return <AutenticacaoContexto.Provider value={valor}>{children}</AutenticacaoContexto.Provider>;
}

