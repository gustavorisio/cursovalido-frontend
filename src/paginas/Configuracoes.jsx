import CabecalhoPagina from '../componentes/comuns/CabecalhoPagina';
import DadosUsuario from '../componentes/autenticacao/DadosUsuario';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { revogarTermos } from '../servicos/servicoAutenticacao';
import ExclusaoConta from '../componentes/autenticacao/ExclusaoConta';
import ConfirmacaoModal from '../componentes/forum/componentes/ConfirmacaoModal';
import { useAcaoUnica } from '../contextos/useAcaoUnica';

export default function Configuracoes() {
  const { sessao, sair } = useAutenticacao();
  const navegar = useNavigate();
  const [erro, setErro] = useState('');
  const [executar, carregando] = useAcaoUnica();
  const [excluindo, setExcluindo] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);

  async function revogarAceite() {
    await executar(async () => {
      setErro('');
      try { await revogarTermos(); await sair(); navegar('/login', { replace: true, state: { mensagem: 'Os termos foram revogados. Faça login novamente para continuar.' } }); }
      catch (falha) { setErro(falha.message); setConfirmacao(null); }
    });
  }

  return <div className="app-container pagina-configuracoes"><main className="main-content"><CabecalhoPagina titulo="Configurações da conta" /><section className="card configuracoes-conta"><DadosUsuario key={sessao?.idUsuario ?? sessao?.id} desabilitado={carregando || excluindo} />{erro && <div className="mensagem-erro" role="alert">{erro}</div>}<div className="acoes-configuracoes"><button className="btn btn-primary" disabled={carregando || excluindo} type="button" onClick={() => navegar('/configuracoes/alterar-senha')}>Alterar senha</button><button className="btn btn-secondary" disabled={carregando || excluindo} type="button" onClick={() => setConfirmacao({ titulo: 'Revogar aceite dos termos', mensagem: 'Revogar o aceite bloqueará seu acesso e encerrará sua sessão. Deseja continuar?', acao: revogarAceite })}>Revogar aceite dos termos</button></div>{sessao?.perfil === 'ADMINISTRADOR' ? <p className="texto-suave">Contas administrativas não podem ser removidas por autoexclusão. O root gerencia a remoção de administradores.</p> : <ExclusaoConta desabilitado={carregando} aoProcessar={setExcluindo} aoExcluir={() => { sair(); navegar('/login', { replace: true, state: { mensagem: 'Conta excluída com sucesso.' } }); }} />}</section></main>{confirmacao && <ConfirmacaoModal titulo={confirmacao.titulo} mensagem={confirmacao.mensagem} processando={carregando} onConfirmar={confirmacao.acao} onCancelar={() => setConfirmacao(null)} />}<Rodape /></div>;
}
