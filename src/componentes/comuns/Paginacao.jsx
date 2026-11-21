import { useState } from 'react';
import ControlesPaginacao from './ControlesPaginacao';

export default function Paginacao({ itens, tamanho, rotulo, desabilitada = false, exibirPaginaUnica = false, children }) {
  const [indice, setIndice] = useState(0);
  const total = Math.max(1, Math.ceil(itens.length / tamanho));
  const pagina = Math.min(indice, total - 1);
  if (pagina !== indice) setIndice(pagina);
  const inicio = pagina * tamanho;

  return <>
    {children(itens.slice(inicio, inicio + tamanho))}
    <ControlesPaginacao pagina={pagina} total={total} rotulo={rotulo} desabilitada={desabilitada} exibirPaginaUnica={exibirPaginaUnica}
      onAnterior={() => setIndice(pagina - 1)} onProxima={() => setIndice(pagina + 1)} />
  </>;
}
