export const CHAVE_SESSAO_ABA = 'curso-valido-sessao-aba';

export const CHAVE_CONTROLE_SESSAO = 'curso-valido-controle-sessao';

export function dadosDoToken(token) {
  if (typeof token !== 'string') return null;
  if (token.split('.').length !== 3) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
  } catch {
    return null;
  }
}

export function tokenValido(token) {
  const dados = dadosDoToken(token);
  if (!Number.isFinite(dados?.exp)) return false;
  return dados.exp * 1000 > Date.now();
}

// A sessao persiste somente na aba; o armazenamento compartilhado recebe
// apenas o identificador usado para invalidar a conta anterior em outras abas.
export function criarControleSessao(armazenamento, armazenamentoAba = null) {
  let sessao = null;

  function obter() {
    if (!sessao && armazenamentoAba) {
      try { sessao = JSON.parse(armazenamentoAba.getItem(CHAVE_SESSAO_ABA)); } catch { sessao = null; }
    }
    if (!sessao) return null;
    if (!tokenValido(sessao.token)) return null;
    if (armazenamento.getItem(CHAVE_CONTROLE_SESSAO) !== sessao.controle) return null;
    return sessao;
  }

  function encerrar() {
    obter();
    const anterior = sessao;
    sessao = null;
    armazenamentoAba?.removeItem(CHAVE_SESSAO_ABA);
    if (anterior) {
      if (armazenamento.getItem(CHAVE_CONTROLE_SESSAO) === anterior.controle) {
        armazenamento.removeItem(CHAVE_CONTROLE_SESSAO);
      }
    }
    return anterior;
  }

  function iniciar(dados) {
    if (!tokenValido(dados?.token)) throw new Error('A resposta de autenticação não contém uma sessão válida.');
    const nova = { ...dados, controle: crypto.randomUUID() };
    armazenamento.setItem(CHAVE_CONTROLE_SESSAO, nova.controle);
    armazenamentoAba?.setItem(CHAVE_SESSAO_ABA, JSON.stringify(nova));
    sessao = nova;
    return nova;
  }

  return { obter, iniciar, encerrar, possuiSessao: () => obter() !== null };
}

export const controleSessao = criarControleSessao({
  getItem: (chave) => localStorage.getItem(chave),
  setItem: (chave, valor) => localStorage.setItem(chave, valor),
  removeItem: (chave) => localStorage.removeItem(chave),
}, {
  getItem: (chave) => sessionStorage.getItem(chave),
  setItem: (chave, valor) => sessionStorage.setItem(chave, valor),
  removeItem: (chave) => sessionStorage.removeItem(chave),
});

export function obterTokenSessao() {
  return controleSessao.obter()?.token ?? null;
}
