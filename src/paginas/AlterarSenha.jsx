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
    if (!token) { setErro('O link de alteração de senha não possui um token válido.'); return; }
    if (novaSenha.length < 8) { setErro('A nova senha deve ter no mínimo 8 caracteres.'); return; }
    if (novaSenha !== confirmacaoSenha) { setErro('A confirmação deve ser igual à nova senha.'); return; }
    setCarregando(true);
    try { await alterarSenha(token, novaSenha, confirmacaoSenha); setMensagem('Senha alterada com sucesso.'); setTimeout(() => navegar('/login', { replace: true }), 1800); }
    catch (falha) { setErro(falha.message || 'O token é inválido, expirou ou já foi utilizado.'); }
    finally { setCarregando(false); }
  }

  return <div className="pagina-publica"><main className="painel-autenticacao"><div className="marca-publica">CURSO VÁLIDO <span>•</span></div><h1>Definir nova senha</h1>{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}<form className="formulario-publico" onSubmit={enviar}><label>Nova senha<input required minLength={8} type="password" value={novaSenha} onChange={(evento) => setNovaSenha(evento.target.value)} /></label><label>Confirmar nova senha<input required minLength={8} type="password" value={confirmacaoSenha} onChange={(evento) => setConfirmacaoSenha(evento.target.value)} /></label><button className="botao-destaque" disabled={carregando || Boolean(mensagem)}>{carregando ? 'Salvando...' : 'Alterar senha'}</button></form><p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
