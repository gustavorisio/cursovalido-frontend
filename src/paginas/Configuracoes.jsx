import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import CabecalhoForum from '../componentes/forum/componentes/CabecalhoForum';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { excluirConta, revogarTermos } from '../servicos/servicoAutenticacao';
import ConfirmacaoModal from '../componentes/forum/componentes/ConfirmacaoModal';

export default function Configuracoes() {
  const { sessao, sair } = useAutenticacao();
  const navegar = useNavigate();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);

  async function revogarAceite() {
    if (carregando) return;
    setCarregando(true); setErro('');
    try { await revogarTermos(); sair(); navegar('/login', { replace: true, state: { mensagem: 'Os termos foram revogados. Faça login novamente para continuar.' } }); }
    catch (falha) { setErro(falha.message); setCarregando(false); setConfirmacao(null); }
  }

  async function excluirMinhaConta() {
    if (carregando) return;
    setCarregando(true); setErro('');
    try {
      await excluirConta();
      sair();
      navegar('/cadastro', { replace: true, state: { mensagem: 'Conta excluída com sucesso. Para utilizar a plataforma novamente, realize um novo cadastro.' } });
    }
    catch (falha) { setErro(falha.message); setCarregando(false); setConfirmacao(null); }
  }

  return <div className="app-container"><CabecalhoForum /><main className="main-content"><section className="card configuracoes-conta"><h1 className="page-title">Configurações da conta</h1><p className="texto-suave">Usuário: {sessao?.nome}</p><p className="texto-suave">Perfil: {sessao?.perfil}</p>{erro && <div className="mensagem-erro" role="alert">{erro}</div>}<div className="acoes-configuracoes"><button className="btn btn-secondary" disabled={carregando} type="button" onClick={() => setConfirmacao({ titulo: 'Revogar aceite dos termos', mensagem: 'Revogar o aceite bloqueará seu acesso e encerrará sua sessão. Deseja continuar?', acao: revogarAceite })}>Revogar aceite dos termos</button><button className="btn btn-danger" disabled={carregando} type="button" onClick={() => setConfirmacao({ titulo: 'Excluir minha conta', mensagem: 'Esta ação é permanente. Seus dados pessoais, tópicos, comentários, tokens e registros relacionados serão removidos conforme a regra do sistema. Deseja continuar?', acao: excluirMinhaConta })}>Excluir minha conta</button></div></section></main>{confirmacao && <ConfirmacaoModal titulo={confirmacao.titulo} mensagem={confirmacao.mensagem} processando={carregando} onConfirmar={confirmacao.acao} onCancelar={() => setConfirmacao(null)} />}<Rodape /></div>;
}
