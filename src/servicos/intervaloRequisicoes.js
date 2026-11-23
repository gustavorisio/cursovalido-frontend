const CHAVE = 'curso-valido-intervalos-acoes';
const memoria = new Map();

function armazenamento() {
  return globalThis.window?.sessionStorage ?? globalThis.sessionStorage;
}

// Persiste apenas ação e prazo, nunca os dados de formulários ou credenciais.
function ler() {
  try {
    const storage = armazenamento();
    if (!storage) return Object.fromEntries(memoria);
    const dados = JSON.parse(storage.getItem(CHAVE) ?? '{}');
    return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
  } catch { return Object.fromEntries(memoria); }
}

export function prazoDaAcao(chave, segundos = 0) {
  const agora = Date.now();
  const prazos = Object.fromEntries(Object.entries(ler()).filter(([, prazo]) => Number.isFinite(prazo) && prazo > agora));
  const restante = Math.max(0, Math.ceil(((prazos[chave] ?? 0) - agora) / 1000));
  if (segundos > 0) prazos[chave] = Math.max(prazos[chave] ?? 0, agora + segundos * 1000);
  memoria.clear();
  for (const [acao, prazo] of Object.entries(prazos)) memoria.set(acao, prazo);
  try { armazenamento()?.setItem(CHAVE, JSON.stringify(prazos)); } catch { /* backend mantém a proteção */ }
  return restante;
}

export function avisarIntervalo(mensagem, segundos) {
  if (typeof globalThis.CustomEvent !== 'function') return;
  globalThis.dispatchEvent?.(new CustomEvent('curso-valido-intervalo-acao', { detail: { mensagem, segundos } }));
}
