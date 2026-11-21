import { useState } from 'react';
import { Link } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { solicitarAlteracaoSenha } from '../servicos/servicoAutenticacao';
import { useAcaoUnica } from '../contextos/useAcaoUnica';
import { LIMITES, validarEmail } from '../servicos/validacoesAutenticacao';

export default function SolicitarAlteracaoSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [executar, carregando] = useAcaoUnica();

  async function enviar(evento) {
    evento.preventDefault();
    const erroEmail = validarEmail(email);
    if (erroEmail) { setErro(erroEmail); setMensagem(''); return; }
    await executar(async () => {
      setErro(''); setMensagem('');
      try {
        await solicitarAlteracaoSenha(email.trim());
        setMensagem('Se a conta existir, enviaremos as instruções. Se o e-mail ainda não foi confirmado, enviaremos um novo link de confirmação.');
      } catch (falha) {
        setErro(falha.message || 'Não foi possível enviar o link para alterar sua senha.');
      }
    });
  }

  return <div className="pagina-publica"><main className="painel-autenticacao"><div className="marca-publica">CURSO VÁLIDO </div><h1>Alterar senha</h1><p className="texto-suave">Informe seu e-mail e enviaremos um link seguro para criar uma nova senha.</p>{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}<form className="formulario-publico" onSubmit={enviar} noValidate><label>E-mail<input required type="email" autoComplete="email" maxLength={LIMITES.email} value={email} onChange={(evento) => setEmail(evento.target.value)} /></label><button className="botao-destaque" disabled={carregando}>{carregando ? 'Enviando...' : 'Enviar instruções'}</button></form><p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
