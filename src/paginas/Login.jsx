import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormularioLogin from '../componentes/autenticacao/FormularioLogin';
import Rodape from '../componentes/comuns/Rodape';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { reenviarCodigo2fa, reenviarConfirmacao } from '../servicos/servicoAutenticacao';

export default function Login() {
  const { autenticado, autenticarUsuario, validarCodigo2fa, sair } = useAutenticacao();
  const navegar = useNavigate();
  const localizacao = useLocation();
  const [dados, setDados] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [mensagemReenvio, setMensagemReenvio] = useState('');
  const [contaNaoConfirmada, setContaNaoConfirmada] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [segundoFator, setSegundoFator] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [exibirReenvio2fa, setExibirReenvio2fa] = useState(false);
  const [reenviando2fa, setReenviando2fa] = useState(false);
  const [segundosReenvio2fa, setSegundosReenvio2fa] = useState(0);

  useEffect(() => {
    if (segundosReenvio2fa <= 0) return undefined;
    const temporizador = window.setInterval(() => {
      setSegundosReenvio2fa((segundos) => Math.max(0, segundos - 1));
    }, 1000);
    return () => window.clearInterval(temporizador);
  }, [segundosReenvio2fa]);

  if (autenticado) return <Navigate to="/forum" replace />;

  function alterar(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setMensagemReenvio('');
    setContaNaoConfirmada(false);
    setCarregando(true);
    try {
      if (!segundoFator) {
        const resposta = await autenticarUsuario(dados.email, dados.senha);
        if (resposta?.requerCodigo2fa) {
          setSegundoFator(true);
          setExibirReenvio2fa(true);
          setSegundosReenvio2fa(0);
          return;
        }
      } else {
        await validarCodigo2fa(dados.email, codigo);
        navegar(localizacao.state?.de || '/forum', { replace: true });
      }
    } catch (falha) {
      if (falha.codigo === 'EMAIL_NAO_CONFIRMADO') {
        setContaNaoConfirmada(true);
        setErro('Seu e-mail ainda não foi confirmado.');
      } else if (falha.codigo === 'TERMOS_NAO_ACEITOS') {
        const tokenPendente = falha.dados?.token || falha.dados?.jwt || falha.dados?.accessToken;
        if (tokenPendente) {
          sair();
          sessionStorage.setItem('curso-valido-token-termos', tokenPendente);
          setErro('É necessário aceitar os Termos de Aceite e a Política de Privacidade para continuar.');
          navegar('/termos-aceite?reativacao=true', { replace: true });
        } else {
          setErro('Não foi possível validar o acesso. Faça login novamente.');
          sair();
        }
      } else if (falha.codigo === 'CREDENCIAIS_INVALIDAS' || falha.status === 401) {
        setErro('E-mail ou senha incorretos.');
      } else if (falha.codigo === 'PENDENTE_APROVACAO') {
        setErro('Seu cadastro está aguardando aprovação do administrador.');
      } else if (falha.codigo === 'ACESSO_REJEITADO') {
        setErro('Seu cadastro foi rejeitado pelo administrador.');
      } else if (segundoFator && falha.codigo === 'CODIGO_2FA_EXPIRADO') {
        setExibirReenvio2fa(true);
        setErro('O código 2FA expirou.');
      } else {
        setErro(falha.message || 'O servidor está indisponível no momento. Tente novamente mais tarde.');
      }
    } finally {
      setCarregando(false);
    }
  }

  async function reenviarCodigo() {
    if (reenviando2fa || segundosReenvio2fa > 0) return;
    setReenviando2fa(true);
    setErro('');
    setMensagemReenvio('');
    try {
      await reenviarCodigo2fa(dados.email);
      setCodigo('');
      setExibirReenvio2fa(true);
      setMensagemReenvio('Um novo código foi enviado para seu e-mail.');
      setSegundosReenvio2fa(60);
    } catch (falha) {
      setErro(falha.message || 'Não foi possível reenviar o código.');
    } finally {
      setReenviando2fa(false);
    }
  }

  async function reenviar() {
    setReenviando(true); setErro('');
    try {
      await reenviarConfirmacao(dados.email);
      setMensagemReenvio('Se o e-mail estiver cadastrado, um novo link de confirmação será enviado.');
      setContaNaoConfirmada(false);
    } catch (falha) {
      setErro(falha.status === 429
        ? 'Limite de reenvio atingido. Aguarde alguns minutos antes de tentar novamente.'
        : falha.message || 'Não foi possível reenviar a confirmação agora.');
    } finally { setReenviando(false); }
  }

  return (
    <div className="pagina-publica">
      <main className="painel-autenticacao">
        <div className="marca-publica">CURSO VÁLIDO <span>•</span></div>
        <h1>Entrar na plataforma</h1>
        <p className="texto-suave">Acesse o fórum e continue sua jornada de aprendizagem.</p>
        <FormularioLogin dados={dados} codigo={codigo} segundoFator={segundoFator} erro={erro} carregando={carregando} mensagem={mensagemReenvio || localizacao.state?.mensagem} onAlterar={alterar} onCodigo={setCodigo} onEnviar={enviar} />
        {contaNaoConfirmada && <button className="botao-destaque" type="button" disabled={reenviando} onClick={reenviar}>{reenviando ? 'Enviando...' : 'Reenviar confirmação'}</button>}
        {segundoFator && exibirReenvio2fa && <button className="botao-destaque botao-reenvio-2fa" type="button" disabled={reenviando2fa || segundosReenvio2fa > 0} onClick={reenviarCodigo}>{reenviando2fa ? 'Reenviando...' : segundosReenvio2fa > 0 ? `Reenviar código novamente em ${segundosReenvio2fa}s` : 'Reenviar código'}</button>}
        <p className="texto-rodape-formulario">Ainda não possui cadastro? <Link to="/cadastro">Criar conta de aluno</Link></p>
      </main>
      <Rodape />
    </div>
  );
}
