import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import CabecalhoForum from '../componentes/forum/componentes/CabecalhoForum';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { excluirConta, revogarTermos } from '../servicos/servicoAutenticacao';

export default function Configuracoes() {
  const { sessao, sair } = useAutenticacao();
  const navegar = useNavigate();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function revogarAceite() {
    if (!window.confirm('Revogar o aceite bloqueará seu acesso e encerrará sua sessão. Deseja continuar?')) return;
    setCarregando(true); setErro('');
    try { await revogarTermos(); sair(); navegar('/login', { replace: true, state: { mensagem: 'Os termos foram revogados. Faça login novamente para continuar.' } }); }
    catch (falha) { setErro(falha.message); setCarregando(false); }
  }

  async function excluirMinhaConta() {
    const confirmado = window.confirm('Excluir minha conta é uma ação permanente. Seus dados pessoais, acesso ao fórum, tópicos, comentários, tokens e registros relacionados serão removidos conforme a regra do sistema. Deseja continuar?');
    if (!confirmado) return;
    setCarregando(true); setErro('');
    try {
      await excluirConta();
      sair();
      localStorage.clear();
      sessionStorage.clear();
      navegar('/cadastro', { replace: true, state: { mensagem: 'Conta excluída com sucesso. Para utilizar a plataforma novamente, realize um novo cadastro.' } });
    }
    catch (falha) { setErro(falha.message); setCarregando(false); }
  }

  return <div className="app-container"><CabecalhoForum /><main className="main-content"><section className="card configuracoes-conta"><h1 className="page-title">Configurações da conta</h1><p className="texto-suave">Usuário: {sessao?.nome}</p><p className="texto-suave">Perfil: {sessao?.perfil}</p>{erro && <div className="mensagem-erro" role="alert">{erro}</div>}<div className="acoes-configuracoes"><button className="btn btn-secondary" disabled={carregando} type="button" onClick={revogarAceite}>Revogar aceite dos termos</button><button className="btn btn-danger" disabled={carregando} type="button" onClick={excluirMinhaConta}>Excluir minha conta</button></div></section></main><Rodape /></div>;
}
