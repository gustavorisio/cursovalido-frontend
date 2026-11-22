export function textoSimples(conteudo) {
  const documento = new window.DOMParser().parseFromString(String(conteudo ?? ''), 'text/html');
  const blocos = new Set(['p', 'div', 'section', 'article', 'header', 'footer', 'main', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'br', 'hr', 'tr']);
  function extrair(no) {
    if (no.nodeType === 3) return no.textContent;
    if (no.nodeType !== 1 || ['script', 'style', 'iframe', 'object', 'template'].includes(no.localName)) return '';
    const bloco = blocos.has(no.localName);
    const filhos = [...no.childNodes].map(extrair).join('');
    return `${bloco ? '\n' : ''}${filhos}${bloco ? '\n' : ''}`;
  }
  return [...documento.body.childNodes].map(extrair).join('').replace(/[\t\f\v ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export default function ConteudoLegal({ conteudo }) {
  return <div className="conteudo-legal conteudo-legal-texto">{textoSimples(conteudo)}</div>;
}
