import AceiteDocumentos from '../componentes/comuns/AceiteDocumentos';
import CampoSenha from '../componentes/autenticacao/CampoSenha';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { buscarPoliticaAtiva, completarCadastroConvite, confirmarEmailConvite } from '../servicos/servicoAutenticacao';
import { validarIdade } from './validacoesCadastro';

const INICIAL = { nomeCompleto: '', email: '', senha: '', dataNascimento: '', declarouMaiorIdade: false, aceitouTermosLgpd: false, versaoTermos: '' };
const CAMPOS = ['nomeCompleto', 'email', 'senha', 'dataNascimento'];

export default function CadastroConvite() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') || '';
  return <ConfirmarConvite key={token} token={token} />;
}

function ConfirmarConvite({ token }) {
  const [dados, setDados] = useState(INICIAL);
  const [confirmado, setConfirmado] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState(token ? '' : 'O link do convite é inválido. Solicite um novo convite.');
  const emConfirmacao = useRef(false);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const idade = validarIdade(dados.dataNascimento);
  const valido = useMemo(() => CAMPOS.every((campo) => String(dados[campo]).trim()) && dados.senha.length >= 8 && idade >= 18 && dados.declarouMaiorIdade && dados.aceitouTermosLgpd && Boolean(dados.versaoTermos), [dados, idade]);

  useEffect(() => {
    let ativo = true;
    buscarPoliticaAtiva().then((politica) => {
      if (ativo) setDados((atual) => ({ ...atual, versaoTermos: politica.versao }));
    }).catch(() => ativo && setErro('Não foi possível carregar os documentos atuais. Tente novamente.'));
    return () => { ativo = false; };
  }, [token]);

  async function confirmarConvite() {
    if (!token || confirmado || emConfirmacao.current) return;
    emConfirmacao.current = true;
    setCarregando(true); setErro('');
    try {
      await confirmarEmailConvite(token);
      setConfirmado(true);
      setMensagem('E-mail confirmado. Complete seus dados para enviar o cadastro.');
    } catch (falha) { setErro(falha.message || 'O link do convite é inválido ou expirou.'); }
    finally { setCarregando(false); emConfirmacao.current = false; }
  }

  function alterar(campo, valor) { setDados((atual) => ({ ...atual, [campo]: valor })); setErro(''); }
  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    if (!valido) { setErro('Preencha os campos obrigatórios e aceite os termos.'); return; }
    setEnviando(true); setErro('');
    try { await completarCadastroConvite(token, dados); setConcluido(true); setMensagem('Cadastro enviado para análise do administrador.'); }
    catch (falha) { setErro(falha.message); } finally { setEnviando(false); }
  }

  return <div className="pagina-publica"><main className="painel-cadastro"><div className="marca-publica">CURSO VÁLIDO <span>•</span></div><h1>Cadastro por convite</h1>{token && !confirmado && <><p className="texto-suave">Confirme seu e-mail para continuar o cadastro por convite.</p><button className="botao-destaque" type="button" disabled={carregando} onClick={confirmarConvite}>{carregando ? 'Confirmando...' : 'Confirmar meu e-mail'}</button></>}{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}{concluido ? <p>Não faça login até a aprovação do administrador.</p> : confirmado && <form className="formulario-publico" onSubmit={enviar}><label>Nome completo<input required value={dados.nomeCompleto} onChange={(evento) => alterar('nomeCompleto', evento.target.value)} /></label><label>E-mail<input required type="email" value={dados.email} onChange={(evento) => alterar('email', evento.target.value)} /></label><CampoSenha required minLength={8} value={dados.senha} onChange={(evento) => alterar('senha', evento.target.value)} /><label>Data de nascimento<input required type="date" value={dados.dataNascimento} onChange={(evento) => alterar('dataNascimento', evento.target.value)} /></label><p className="texto-suave">O cadastro é permitido apenas para pessoas com 18 anos ou mais.</p><label className="checkbox"><input type="checkbox" checked={dados.declarouMaiorIdade} onChange={(evento) => alterar('declarouMaiorIdade', evento.target.checked)} />Declaro que possuo 18 anos ou mais.</label><AceiteDocumentos key={dados.versaoTermos} versaoTermos={dados.versaoTermos} aceito={dados.aceitouTermosLgpd} desabilitado={enviando} onAlterar={(valor) => alterar('aceitouTermosLgpd', valor)} /><button className="botao-destaque" disabled={!valido || enviando}>{enviando ? 'Enviando cadastro...' : 'Enviar cadastro'}</button></form>}<p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
