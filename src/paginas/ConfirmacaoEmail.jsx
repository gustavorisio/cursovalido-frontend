import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { confirmarEmail, reenviarConfirmacao } from '../servicos/servicoAutenticacao';

export default function ConfirmacaoEmail() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const token = parametros.get('token') || '';
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(Boolean(token));
  const [carregandoReenvio, setCarregandoReenvio] = useState(false);
  const [mostrarReenvio, setMostrarReenvio] = useState(!token);

  useEffect(() => {
    if (!token) return undefined;
    let ativo = true;
    confirmarEmail(token).then(() => {
      if (!ativo) return;
      setMensagem('E-mail confirmado com sucesso. Agora você pode entrar na sua conta.');
    }).catch((falha) => {
      if (!ativo) return;
      if (falha.codigo === 'TOKEN_EXPIRADO' || /expir/i.test(falha.message || '')) {
        setErro('O link de confirmação expirou.');
        setMostrarReenvio(true);
      } else if (falha.codigo === 'TOKEN_JA_UTILIZADO' || /utiliz/i.test(falha.message || '')) {
        setErro('Este link de confirmação já foi utilizado.');
      } else if (falha.status === 400) {
        setErro('O link de confirmação é inválido.');
      } else setErro(falha.message);
    }).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [navegar, token]);

  async function reenviar(evento) {
    evento.preventDefault();
    setErro(''); setMensagem(''); setCarregandoReenvio(true);
    try {
      await reenviarConfirmacao(email);
      setMensagem('Se o e-mail estiver cadastrado, um novo link de confirmação será enviado.');
      setEmail('');
    } catch (falha) { setErro(falha.status === 429 ? 'Limite de reenvio atingido. Aguarde alguns minutos antes de tentar novamente.' : falha.message); }
    finally { setCarregandoReenvio(false); }
  }

  return <div className="pagina-publica"><main className="painel-autenticacao">
    <div className="marca-publica">CURSO VÁLIDO <span>•</span></div><h1>Confirmação de e-mail</h1>
    {carregando && <p className="texto-suave">Validando seu link de confirmação...</p>}
    {mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}
    {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
    {mostrarReenvio && <><p className="texto-suave">Informe seu e-mail para receber novamente o link de ativação.</p><form className="formulario-publico" onSubmit={reenviar}><label>E-mail<input required type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} /></label><button className="botao-destaque" disabled={carregandoReenvio}>{carregandoReenvio ? 'Enviando...' : 'Reenviar confirmação'}</button></form></>}
    <p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p>
  </main><Rodape /></div>;
}
