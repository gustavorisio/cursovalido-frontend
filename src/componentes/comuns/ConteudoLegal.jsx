import { createElement, useMemo } from 'react';

const FORMATACAO = new Set(['p', 'div', 'section', 'article', 'header', 'footer', 'main', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sup', 'sub', 'blockquote', 'br', 'hr', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'dl', 'dt', 'dd', 'a']);
const DESCARTAR = new Set(['script', 'style', 'template', 'noscript', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input', 'button', 'select', 'textarea']);

function formatarNo(no, chave) {
  if (no.nodeType === 3) return no.textContent;
  if (no.nodeType !== 1) return null;
  const tag = no.localName;
  if (DESCARTAR.has(tag)) return null;
  const filhos = [...no.childNodes].map((filho, indice) => formatarNo(filho, `${chave}-${indice}`));
  if (!FORMATACAO.has(tag)) return filhos;
  const props = { key: chave };
  // Somente atributos de apresentação textual; HTML publicado não executa código.
  if (tag === 'a') {
    const href = no.getAttribute('href')?.trim();
    if (href && /^(https?:\/\/|mailto:|#)/i.test(href)) props.href = href;
  }
  if (['td', 'th'].includes(tag)) {
    for (const [atributo, prop] of [['colspan', 'colSpan'], ['rowspan', 'rowSpan']]) {
      const valor = Number(no.getAttribute(atributo));
      if (Number.isInteger(valor) && valor > 0 && valor <= 100) props[prop] = valor;
    }
  }
  return ['br', 'hr'].includes(tag) ? createElement(tag, props) : createElement(tag, props, filhos);
}

export default function ConteudoLegal({ conteudo }) {
  const html = /<\/?[a-z][^>]*>/i.test(conteudo);
  const filhos = useMemo(() => {
    if (!html) return conteudo;
    const documento = new window.DOMParser().parseFromString(conteudo, 'text/html');
    return [...documento.body.childNodes].map((no, indice) => formatarNo(no, String(indice)));
  }, [conteudo, html]);
  return <div className={`conteudo-legal${html ? '' : ' conteudo-legal-texto'}`}>{filhos}</div>;
}
