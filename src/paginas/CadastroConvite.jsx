import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { buscarPoliticaAtiva, completarCadastroConvite, confirmarEmailConvite, consultarEndereco } from '../servicos/servicoAutenticacao';
import { validarIdade } from './validacoesCadastro';

const INICIAL = { nomeCompleto: '', email: '', senha: '', cpf: '', dataNascimento: '', telefone: '', cep: '', logradouro: '', bairro: '', cidade: '', estado: '', declarouMaiorIdade: false, aceitouTermosLgpd: false, versaoTermos: '' };
const CAMPOS = ['nomeCompleto', 'email', 'senha', 'cpf', 'dataNascimento', 'telefone', 'cep', 'logradouro', 'bairro', 'cidade', 'estado'];

export default function CadastroConvite() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') || '';
  const [dados, setDados] = useState(INICIAL);
  const [confirmado, setConfirmado] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(Boolean(token));
  const [enviando, setEnviando] = useState(false);
  const idade = validarIdade(dados.dataNascimento);
  const valido = useMemo(() => CAMPOS.every((campo) => String(dados[campo]).trim()) && dados.senha.length >= 8 && idade >= 18 && dados.declarouMaiorIdade && dados.aceitouTermosLgpd && Boolean(dados.versaoTermos), [dados, idade]);

  useEffect(() => {
    let ativo = true;
    buscarPoliticaAtiva().then((politica) => {
      if (ativo) setDados((atual) => ({ ...atual, versaoTermos: politica.versao }));
    }).catch(() => ativo && setErro('Não foi possível carregar os documentos atuais. Tente novamente.'));
    if (!token) { queueMicrotask(() => { setCarregando(false); setErro('O link do convite não possui um token válido.'); }); return () => { ativo = false; }; }
    confirmarEmailConvite(token).then(() => { if (ativo) { setConfirmado(true); setMensagem('E-mail confirmado. Complete seus dados para enviar o cadastro.'); } }).catch((falha) => ativo && setErro(falha.message || 'O link do convite é inválido ou expirou.')).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [token]);

  function alterar(campo, valor) { setDados((atual) => ({ ...atual, [campo]: valor })); setErro(''); }
  function consultarCep(valor) {
    const cep = valor.replace(/\D/g, '');
    alterar('cep', valor);
    if (cep.length !== 8) return;
    consultarEndereco(cep).then((endereco) => endereco && setDados((atual) => ({ ...atual, logradouro: endereco.logradouro || '', bairro: endereco.bairro || '', cidade: endereco.cidade || endereco.localidade || '', estado: endereco.estado || endereco.uf || '' }))).catch(() => { });
  }
  async function enviar(evento) {
    evento.preventDefault();
    if (!valido) { setErro('Preencha os campos obrigatórios e aceite os termos.'); return; }
    setEnviando(true); setErro('');
    try { await completarCadastroConvite(token, { ...dados, cpf: dados.cpf.replace(/\D/g, ''), cep: dados.cep.replace(/\D/g, '') }); setConcluido(true); setMensagem('Cadastro enviado para análise do administrador.'); }
    catch (falha) { setErro(falha.message); } finally { setEnviando(false); }
  }

  return <div className="pagina-publica"><main className="painel-cadastro"><div className="marca-publica">CURSO VÁLIDO <span>•</span></div><h1>Cadastro por convite</h1>{carregando && <p className="texto-suave">Confirmando convite...</p>}{erro && <div className="mensagem-erro" role="alert">{erro}</div>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}{concluido ? <p>Não faça login até a aprovação do administrador.</p> : confirmado && <form className="formulario-publico" onSubmit={enviar}><label>Nome completo<input required value={dados.nomeCompleto} onChange={(evento) => alterar('nomeCompleto', evento.target.value)} /></label><label>E-mail<input required type="email" value={dados.email} onChange={(evento) => alterar('email', evento.target.value)} /></label><label>Senha<input required minLength={8} type="password" value={dados.senha} onChange={(evento) => alterar('senha', evento.target.value)} /></label><label>CPF<input required value={dados.cpf} onChange={(evento) => alterar('cpf', evento.target.value)} /></label><label>Data de nascimento<input required type="date" value={dados.dataNascimento} onChange={(evento) => alterar('dataNascimento', evento.target.value)} /></label><label>Telefone<input required value={dados.telefone} onChange={(evento) => alterar('telefone', evento.target.value)} /></label><label>CEP<input required value={dados.cep} onChange={(evento) => consultarCep(evento.target.value)} /></label><label>Logradouro<input required value={dados.logradouro} onChange={(evento) => alterar('logradouro', evento.target.value)} /></label><label>Bairro<input required value={dados.bairro} onChange={(evento) => alterar('bairro', evento.target.value)} /></label><label>Cidade<input required value={dados.cidade} onChange={(evento) => alterar('cidade', evento.target.value)} /></label><label>Estado<input required maxLength={2} value={dados.estado} onChange={(evento) => alterar('estado', evento.target.value.toUpperCase())} /></label><label className="checkbox"><input type="checkbox" checked={dados.declarouMaiorIdade} onChange={(evento) => alterar('declarouMaiorIdade', evento.target.checked)} />Declaro que possuo 18 anos ou mais.</label><label className="checkbox"><input type="checkbox" checked={dados.aceitouTermosLgpd} onChange={(evento) => alterar('aceitouTermosLgpd', evento.target.checked)} />Li e aceito os termos e a política de privacidade.</label><button className="botao-destaque" disabled={!valido || enviando}>{enviando ? 'Enviando...' : 'Enviar cadastro'}</button></form>}<p className="texto-rodape-formulario"><Link to="/login">Voltar para o login</Link></p></main><Rodape /></div>;
}
