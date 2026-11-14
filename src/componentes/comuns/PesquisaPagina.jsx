import { useId } from 'react';

export default function PesquisaPagina({ valor, onAlterar, onPesquisar, rotulo = 'Pesquisar', placeholder = rotulo, onLimpar }) {
  const id = useId();
  return <form className="barra-pesquisa" role="search" onSubmit={(evento) => { evento.preventDefault(); onPesquisar?.(); }}>
    <label className="sr-only" htmlFor={id}>{rotulo}</label>
    <input id={id} className="campo-pesquisa" type="search" maxLength={255} placeholder={placeholder} value={valor} onChange={(evento) => onAlterar(evento.target.value)} />
    <button className="btn btn-secondary" type="submit">Buscar</button>
    {onLimpar && <button className="btn btn-secondary" type="button" onClick={onLimpar}>Limpar</button>}
  </form>;
}
