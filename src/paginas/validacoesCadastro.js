export function limparNomeCompleto(valor) {
  return (valor ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}
