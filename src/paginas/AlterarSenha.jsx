import CampoSenha from '../componentes/autenticacao/CampoSenha';
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { alterarSenha } from '../servicos/servicoAutenticacao';
import { useAcaoUnica } from '../contextos/useAcaoUnica';
import { validarNovaSenha } from '../servicos/validacoesAutenticacao';

export default function AlterarSenha() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const token = parametros.get('token') || '';
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [executar, carregando] = useAcaoUnica();

  async function enviar(evento) {
    evento.preventDefault();
    if (mensagem) return;
    setErro('');
    if (!token) { setErro('O link de alteração de senha é inválido. Solicite um novo link.'); return; }
    const problema = validarNovaSenha(novaSenha, confirmacaoSenha, { rotulo: 'a nova senha', rotuloConfirmacao: 'Confirme a nova senha.' });
    if (problema) { setErro(problema === 'A confirmação deve ser igual à senha.' ? 'A confirmação deve ser igual à nova senha.' : problema); return; }
    await executar(async () => {
      try { await alterarSenha(token, novaSenha, confirmacaoSenha); setMensagem('Senha alterada com sucesso.'); setTimeout(() => navegar('/login', { replace: true }), 1800); }
      catch (falha) { setErro(falha.message || 'Este link é inválido, expirou ou já foi utilizado. Solicite um novo link.'); }
    });
  }

  return <div className="pagina-publica"><main className="painel-autenticacao"><div className="marca-publica">CURSO VÁLIDO </div><h1>Definir nova senha</h1>{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}<form className="formulario-publico" onSubmit={enviar} noValidate><CampoSenha rotulo="Nova senha" required value={novaSenha} onChange={(evento) => setNovaSenha(evento.target.value)} /><CampoSenha rotulo="Confirmar nova senha" required validarPolitica={false} maxLength={72} value={confirmacaoSenha} onChange={(evento) => setConfirmacaoSenha(evento.target.value)} /><button className="botao-destaque" disabled={carregando || Boolean(mensagem)}>{carregando ? 'Salvando...' : 'Alterar senha'}</button></form><p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
