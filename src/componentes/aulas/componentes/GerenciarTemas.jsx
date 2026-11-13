import { useState } from 'react';
import { salvarTema, excluirTema } from '../servicos/servicoTemas';
import ConfirmacaoModal from '../../forum/componentes/ConfirmacaoModal';

export default function GerenciarTemas({ temas, onAtualizar }) {
  const [nome, setNome] = useState('');
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar() {
    if (processando || !nome.trim()) return;
    setProcessando(true); setErro('');
    try {
      await salvarTema(editando, nome.trim());
      setNome(''); setEditando(null); onAtualizar();
    } catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }

  async function excluir() {
    if (processando) return;
    setProcessando(true); setErro('');
    try {
      await excluirTema(excluindo.id);
      if (editando === excluindo.id) { setEditando(null); setNome(''); }
      setExcluindo(null); onAtualizar(excluindo.id);
    } catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }

  return <div className="aulas-gestao-temas">
    <h3>Gerenciar temas</h3>
    <p className="texto-suave">Os temas são compartilhados entre os cursos da plataforma.</p>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    <label htmlFor="tema-nome">{editando ? 'Editar nome do tema' : 'Novo tema'}</label>
    <div className="aulas-tema-novo"><input id="tema-nome" className="input-field" maxLength={100} value={nome} disabled={processando} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); salvar(); } }} /><button className="btn btn-primary" type="button" disabled={processando || !nome.trim()} onClick={salvar}>{editando ? 'Salvar tema' : 'Criar tema'}</button>{editando && <button className="btn btn-secondary" type="button" disabled={processando} onClick={() => { setEditando(null); setNome(''); }}>Cancelar</button>}</div>
    <ul>{temas.map((tema) => <li key={tema.id}><span>{tema.nome}</span><button className="btn btn-link" type="button" disabled={processando} onClick={() => { setEditando(tema.id); setNome(tema.nome); }}>Editar</button><button className="btn btn-link" type="button" disabled={processando} onClick={() => setExcluindo(tema)}>Excluir</button></li>)}</ul>
    {temas.length === 0 && <p className="texto-suave">Nenhum tema cadastrado.</p>}
    {excluindo && <ConfirmacaoModal titulo="Excluir tema" mensagem={`Excluir “${excluindo.nome}”? Os cursos vinculados ficarão sem tema. Nenhum curso será excluído.`} processando={processando} onConfirmar={excluir} onCancelar={() => { if (!processando) setExcluindo(null); }} />}
  </div>;
}
