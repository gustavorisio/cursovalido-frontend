import AceiteDocumentos from '../componentes/comuns/AceiteDocumentos';
import CampoSenha from '../componentes/autenticacao/CampoSenha';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { buscarPoliticaAtiva, completarCadastroConvite, consultarConvite } from '../servicos/servicoAutenticacao';
import { limparNomeCompleto } from './validacoesCadastro';
import { LIMITES, validarCadastro } from '../servicos/validacoesAutenticacao';

const INICIAL = { nomeCompleto: '', email: '', senha: '', confirmacaoSenha: '', declarouMaiorIdade: false, aceitouTermosLgpd: false, versaoTermos: '', aceitouResponsabilidade: false, versaoResponsabilidade: '' };

export default function CadastroConvite() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') || '';
  return <ConfirmarConvite key={token} token={token} />;
}

function ConfirmarConvite({ token }) {
  const navegar = useNavigate();
  const [dados, setDados] = useState(INICIAL);
  const [perfil, setPerfil] = useState('');
  const [conviteValido, setConviteValido] = useState(false);
  const [erro, setErro] = useState(token ? '' : 'O link do convite é inválido. Solicite um novo convite.');
  const [carregando, setCarregando] = useState(Boolean(token));
  const [enviando, setEnviando] = useState(false);
  const emEnvio = useRef(false);
  const problema = useMemo(() => {
    const erroCadastro = validarCadastro(dados);
    if (erroCadastro) return erroCadastro;
    if (!perfil) return 'O convite ainda está sendo verificado.';
    if (!dados.aceitouResponsabilidade || !dados.versaoResponsabilidade) return 'Aceite o Termo de Responsabilidade para continuar.';
    return '';
  }, [dados, perfil]);
  const valido = !problema;

  useEffect(() => {
    let ativo = true;
    buscarPoliticaAtiva().then((politica) => {
      if (ativo) setDados((atual) => ({ ...atual, versaoTermos: politica.versao }));
    }).catch(() => ativo && setErro('Não foi possível carregar os documentos atuais. Tente novamente.'));
    return () => { ativo = false; };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let ativo = true;
    consultarConvite(token).then((convite) => {
      if (!ativo) return;
      setPerfil(convite.perfil);
      setDados((atual) => ({ ...atual, email: convite.email }));
      setConviteValido(true);
    }).catch((falha) => {
      if (ativo) setErro(falha.message || 'O link do convite é inválido ou expirou. Peça um novo convite à administração.');
    }).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [token]);

  function alterar(campo, valor) { setDados((atual) => ({ ...atual, [campo]: valor })); setErro(''); }
  async function enviar(evento) {
    evento.preventDefault();
    if (emEnvio.current) return;
    if (problema) { setErro(problema); return; }
    emEnvio.current = true;
    setEnviando(true); setErro('');
    try {
      await completarCadastroConvite(token, dados);
      navegar('/login', { replace: true, state: { mensagem: 'Conta criada. Entre com seu e-mail e senha.' } });
    } catch (falha) {
      setErro(falha.message);
      emEnvio.current = false;
      setEnviando(false);
    }
  }

  return <div className="pagina-publica"><main className="painel-cadastro"><div className="marca-publica">CURSO VÁLIDO </div><h1>Cadastro por convite</h1>{carregando && <p className="texto-suave" role="status">Verificando o convite...</p>}{conviteValido && <p className="texto-suave">Preencha seus dados para criar a conta de {perfil === 'ADMINISTRADOR' ? 'administrador' : 'professor'}. O link vale para um único cadastro.</p>}{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{conviteValido && <form className="formulario-publico" onSubmit={enviar} noValidate><label>Nome completo<input required autoComplete="name" maxLength={LIMITES.nome} value={dados.nomeCompleto} onChange={(evento) => alterar('nomeCompleto', limparNomeCompleto(evento.target.value))} /></label><label>E-mail<input required type="email" readOnly value={dados.email} onChange={(evento) => alterar('email', evento.target.value)} /></label><CampoSenha required value={dados.senha} onChange={(evento) => alterar('senha', evento.target.value)} />
    <CampoSenha rotulo="Confirmar senha" required validarPolitica={false} maxLength={72} value={dados.confirmacaoSenha} onChange={(evento) => alterar('confirmacaoSenha', evento.target.value)} />
    {dados.confirmacaoSenha && dados.senha !== dados.confirmacaoSenha && <p className="erro-campo" role="status">As senhas devem coincidir.</p>}
    <label className="checkbox"><input type="checkbox" checked={dados.declarouMaiorIdade} onChange={(evento) => alterar('declarouMaiorIdade', evento.target.checked)} />Declaro que possuo 18 anos ou mais.</label><AceiteDocumentos key={dados.versaoTermos + perfil} perfil={perfil} onResponsabilidade={(valor) => setDados((atual) => ({ ...atual, ...valor }))} versaoTermos={dados.versaoTermos} aceito={dados.aceitouTermosLgpd} desabilitado={enviando} onAlterar={(valor) => alterar('aceitouTermosLgpd', valor)} /><button className="botao-destaque" disabled={enviando} aria-disabled={!valido}>{enviando ? 'Criando conta...' : 'Criar conta'}</button></form>}<p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
