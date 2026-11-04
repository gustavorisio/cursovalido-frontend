import { useId } from 'react';

export default function PesquisaConteudo({ valor, onAlterar, label = 'Pesquisar curso por nome' }) {
  const id = useId();
  return <div className="pesquisa-conteudo" role="search">
    <label htmlFor={id}>{label}</label>
    <input id={id} className="campo-pesquisa" type="search" placeholder={label} value={valor} onChange={(evento) => onAlterar(evento.target.value)} />
  </div>;
}
