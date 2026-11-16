export const CHAVE_SESSAO = 'curso-valido-sessao-persistente';

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

export function criarControleSessao(armazenamento) {
  function obter() {
    const registro = armazenamento.getItem(CHAVE_SESSAO);
    if (!registro) return null;
    let sessao;
    try { sessao = JSON.parse(registro); } catch { sessao = null; }
    if (tokenValido(sessao?.token)) return sessao;
    if (armazenamento.getItem(CHAVE_SESSAO) === registro) armazenamento.removeItem(CHAVE_SESSAO);
    return null;
  }

  function iniciar(dados) {
    if (!tokenValido(dados?.token)) throw new Error('A resposta de autenticação não contém uma sessão válida.');
    armazenamento.setItem(CHAVE_SESSAO, JSON.stringify(dados));
    return dados;
  }

  function encerrar() {
    const anterior = obter();
    if (anterior) armazenamento.removeItem(CHAVE_SESSAO);
    return anterior;
  }

  return { obter, iniciar, encerrar };
}

export const controleSessao = criarControleSessao({
  getItem: (chave) => (globalThis.window?.localStorage ?? globalThis.localStorage)?.getItem(chave) ?? null,
  setItem: (chave, valor) => localStorage.setItem(chave, valor),
  removeItem: (chave) => localStorage.removeItem(chave),
});

export function obterTokenSessao() {
  return controleSessao.obter()?.token ?? null;
}
