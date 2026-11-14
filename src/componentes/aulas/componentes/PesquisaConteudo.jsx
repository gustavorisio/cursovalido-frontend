import PesquisaPagina from '../../comuns/PesquisaPagina';

export default function PesquisaConteudo({ valor, onAlterar, label = 'Pesquisar curso por nome' }) {
  return <PesquisaPagina valor={valor} onAlterar={onAlterar} rotulo={label} />;
}
