export function limparNomeCompleto(valor) {
  return (valor ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, 120);
}
