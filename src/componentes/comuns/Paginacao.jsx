import { useState } from 'react';

export default function Paginacao({ itens, tamanho, rotulo, desabilitada = false, children }) {
  const [indice, setIndice] = useState(0);
  const total = Math.max(1, Math.ceil(itens.length / tamanho));
  const pagina = Math.min(indice, total - 1);
  if (pagina !== indice) setIndice(pagina);
  const inicio = pagina * tamanho;

  return <>
    {children(itens.slice(inicio, inicio + tamanho))}
    {total > 1 && <nav className="paginacao-lista" aria-label={rotulo}>
      <button className="btn btn-secondary" type="button" disabled={desabilitada || pagina === 0} onClick={() => setIndice(pagina - 1)}>Anterior</button>
      <span aria-live="polite">Página {pagina + 1} de {total}</span>
      <button className="btn btn-secondary" type="button" disabled={desabilitada || pagina + 1 >= total} onClick={() => setIndice(pagina + 1)}>Próxima</button>
    </nav>}
  </>;
}
