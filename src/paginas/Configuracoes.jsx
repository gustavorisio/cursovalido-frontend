import DadosUsuario from '../componentes/autenticacao/DadosUsuario';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { revogarTermos } from '../servicos/servicoAutenticacao';
import ExclusaoConta from '../componentes/autenticacao/ExclusaoConta';
import ConfirmacaoModal from '../componentes/forum/componentes/ConfirmacaoModal';

export default function Configuracoes() {
  const { sessao, sair } = useAutenticacao();
  const navegar = useNavigate();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);

  async function revogarAceite() {
    if (carregando) return;
    setCarregando(true); setErro('');
    try { await revogarTermos(); sair(); navegar('/login', { replace: true, state: { mensagem: 'Os termos foram revogados. Faça login novamente para continuar.' } }); }
    catch (falha) { setErro(falha.message); setCarregando(false); setConfirmacao(null); }
  }

  return <div className="app-container pagina-configuracoes"><main className="main-content"><section className="card configuracoes-conta"><h1 className="page-title">Configurações da conta</h1><DadosUsuario key={sessao?.idUsuario ?? sessao?.id} desabilitado={carregando || excluindo} />{erro && <div className="mensagem-erro" role="alert">{erro}</div>}<div className="acoes-configuracoes"><button className="btn btn-primary" disabled={carregando || excluindo} type="button" onClick={() => navegar('/configuracoes/alterar-senha')}>Alterar senha</button><button className="btn btn-secondary" disabled={carregando || excluindo} type="button" onClick={() => setConfirmacao({ titulo: 'Revogar aceite dos termos', mensagem: 'Revogar o aceite bloqueará seu acesso e encerrará sua sessão. Deseja continuar?', acao: revogarAceite })}>Revogar aceite dos termos</button></div><ExclusaoConta desabilitado={carregando} aoProcessar={setExcluindo} aoExcluir={() => { sair(); navegar('/login', { replace: true, state: { mensagem: 'Conta excluída com sucesso.' } }); }} /></section></main>{confirmacao && <ConfirmacaoModal titulo={confirmacao.titulo} mensagem={confirmacao.mensagem} processando={carregando} onConfirmar={confirmacao.acao} onCancelar={() => setConfirmacao(null)} />}<Rodape /></div>;
}
