import { useId, useState } from 'react';
import useCarregamento from '../hooks/useCarregamento';
import { listarTemas } from '../servicos/servicoTemas';
import GerenciarTemas from './GerenciarTemas';

export default function FiltroTema({ valor, onAlterar, gerenciar = false, cadastro = false, onAtualizar }) {
  const id = useId();
  const carga = useCarregamento(listarTemas);
  const [aberto, setAberto] = useState(false);
  return <div className="aulas-filtro-tema">
    <label htmlFor={id}>{cadastro ? 'Tema do curso' : 'Filtrar por tema'}</label>
    <div className="aulas-filtro-tema-linha"><select id={id} className="input-field" value={valor} disabled={carga.carregando || Boolean(carga.erro)} onChange={(e) => onAlterar(e.target.value)}>
      <option value="">{cadastro ? 'Sem tema' : 'Todos os temas'}</option>
      {!cadastro && <option value="sem-tema">Sem tema</option>}
      {(carga.dados ?? []).map((tema) => <option key={tema.id} value={tema.id}>{tema.nome}</option>)}
    </select>{gerenciar && <button className="btn btn-secondary" type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>{aberto ? 'Fechar temas' : 'Gerenciar temas'}</button>}</div>
    {carga.erro && <div className="mensagem-erro" role="alert">{carga.erro} <button className="btn btn-link" type="button" onClick={carga.tentarNovamente}>Tentar novamente</button></div>}
    {gerenciar && aberto && !carga.erro && !carga.carregando && <GerenciarTemas temas={carga.dados ?? []} onAtualizar={(idExcluido) => { if (String(idExcluido) === String(valor)) onAlterar(''); carga.tentarNovamente(); onAtualizar?.(); }} />}
  </div>;
}
