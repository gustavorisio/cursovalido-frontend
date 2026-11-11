import { useState } from 'react';
import { Link } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { solicitarAlteracaoSenha } from '../servicos/servicoAutenticacao';

export default function SolicitarAlteracaoSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault(); setCarregando(true); setErro(''); setMensagem('');
    try {
      await solicitarAlteracaoSenha(email);
      setMensagem('Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.');
    } catch (falha) {
      setErro(falha.message || 'Não foi possível enviar o link para alterar sua senha.');
    } finally { setCarregando(false); }
  }

  return <div className="pagina-publica"><main className="painel-autenticacao"><div className="marca-publica">CURSO VÁLIDO <span>•</span></div><h1>Alterar senha</h1><p className="texto-suave">Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.</p>{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}<form className="formulario-publico" onSubmit={enviar}><label>E-mail<input required type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} /></label><button className="botao-destaque" disabled={carregando}>{carregando ? 'Enviando...' : 'Enviar instruções'}</button></form><p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
