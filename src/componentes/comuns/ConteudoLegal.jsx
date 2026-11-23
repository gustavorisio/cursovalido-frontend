import { textoSimples } from '../../servicos/textoSimples';

export default function ConteudoLegal({ conteudo }) {
  return <div className="conteudo-legal conteudo-legal-texto">{textoSimples(conteudo)}</div>;
}
