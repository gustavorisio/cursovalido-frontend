
import CabecalhoPagina from '../../comuns/CabecalhoPagina';

export default function CabecalhoAulas({ etiqueta, titulo, descricao, acao, children, className = '' }) {
  return <CabecalhoPagina className={className} etiqueta={etiqueta} titulo={titulo} descricao={descricao} acoes={acao}>{children}</CabecalhoPagina>;
}
