import CampoSenha from '../componentes/autenticacao/CampoSenha';
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { alterarSenha } from '../servicos/servicoAutenticacao';

export default function AlterarSenha() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const token = parametros.get('token') || '';
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault(); setErro('');
    if (!token) { setErro('O link de alteração de senha é inválido. Solicite um novo link.'); return; }
    if (novaSenha.length < 8) { setErro('Informe uma senha válida.'); return; }
    if (novaSenha !== confirmacaoSenha) { setErro('A confirmação deve ser igual à nova senha.'); return; }
    setCarregando(true);
    try { await alterarSenha(token, novaSenha, confirmacaoSenha); setMensagem('Senha alterada com sucesso.'); setTimeout(() => navegar('/login', { replace: true }), 1800); }
    catch (falha) { setErro(falha.message || 'Este link é inválido, expirou ou já foi utilizado. Solicite um novo link.'); }
    finally { setCarregando(false); }
  }

  return <div className="pagina-publica"><main className="painel-autenticacao"><div className="marca-publica">CURSO VÁLIDO </div><h1>Definir nova senha</h1>{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}<form className="formulario-publico" onSubmit={enviar}><CampoSenha rotulo="Nova senha" required minLength={8} value={novaSenha} onChange={(evento) => setNovaSenha(evento.target.value)} /><CampoSenha rotulo="Confirmar nova senha" required minLength={8} value={confirmacaoSenha} onChange={(evento) => setConfirmacaoSenha(evento.target.value)} /><button className="botao-destaque" disabled={carregando || Boolean(mensagem)}>{carregando ? 'Salvando...' : 'Alterar senha'}</button></form><p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
