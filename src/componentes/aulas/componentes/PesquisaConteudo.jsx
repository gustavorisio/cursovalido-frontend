import PesquisaPagina from '../../comuns/PesquisaPagina';

export default function PesquisaConteudo({ valor, onAlterar, label = 'Busca de cursos' }) {
  return <PesquisaPagina valor={valor} onAlterar={onAlterar} rotulo={label} placeholder={label} />;
}
