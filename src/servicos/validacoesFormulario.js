export function validarDocumento(nome, versao, conteudo) {
  if (!nome.trim()) return 'Preencha o nome do documento.';
  if (!versao.trim()) return 'Preencha a nova versão.';
  if (!conteudo.trim()) return 'Preencha o conteúdo do documento.';
  return '';
}

export function validarUrlYoutube(valor) {
  try {
    const url = new URL(valor.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const idValido = (id) => /^[A-Za-z0-9_-]{11}$/.test(id ?? '');
    if (url.hostname === 'youtu.be') return idValido(url.pathname.slice(1));
    return ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)
      && url.pathname === '/watch' && idValido(url.searchParams.get('v'));
  } catch {
    return false;
  }
}
