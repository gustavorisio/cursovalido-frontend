import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormularioCadastro from '../componentes/autenticacao/FormularioCadastro';
import Rodape from '../componentes/comuns/Rodape';
import { buscarPoliticaAtiva, cadastrarUsuario, consultarEndereco } from '../servicos/servicoAutenticacao';
import { validarIdade } from './validacoesCadastro';

const VALOR_PADRAO = {
  nomeCompleto: '', email: '', senha: '', cpf: '', dataNascimento: '', telefone: '',
  cep: '', logradouro: '', bairro: '', cidade: '', estado: '', declarouMaiorIdade: false,
  aceitouTermosLgpd: false, versaoTermos: ''
};
const CAMPOS_OBRIGATORIOS = ['nomeCompleto', 'email', 'senha', 'cpf', 'dataNascimento', 'telefone', 'cep', 'logradouro', 'bairro', 'cidade', 'estado'];

export default function Cadastro() {
  const navegar = useNavigate();
  const localizacao = useLocation();
  const [dados, setDados] = useState(VALOR_PADRAO);
  const [erro, setErro] = useState('');
  const [mensagemCep, setMensagemCep] = useState('');
  const [carregandoCep, setCarregandoCep] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoPolitica, setCarregandoPolitica] = useState(true);
  const [erroPolitica, setErroPolitica] = useState('');
  const [politica, setPolitica] = useState(null);
  const [cadastroConcluido, setCadastroConcluido] = useState(false);
  const idade = validarIdade(dados.dataNascimento);
  const formularioValido = useMemo(() => CAMPOS_OBRIGATORIOS.every((campo) => String(dados[campo]).trim())
    && dados.senha.length >= 8 && idade >= 18 && dados.declarouMaiorIdade && dados.aceitouTermosLgpd && Boolean(dados.versaoTermos) && !carregandoPolitica, [dados, idade, carregandoPolitica]);

  async function carregarPolitica() {
    setCarregandoPolitica(true);
    setErroPolitica('');
    try {
      const documento = await buscarPoliticaAtiva();
      setPolitica(documento);
      setDados((atuais) => ({ ...atuais, versaoTermos: documento.versao }));
    } catch {
      setPolitica(null);
      setDados((atuais) => ({ ...atuais, versaoTermos: '' }));
      setErroPolitica('Não foi possível carregar os Termos de Aceite e a Política de Privacidade. Tente novamente.');
    } finally { setCarregandoPolitica(false); }
  }

  useEffect(() => {
    let ativo = true;
    buscarPoliticaAtiva().then((documento) => {
      if (!ativo) return;
      setPolitica(documento);
      setDados((atuais) => ({ ...atuais, versaoTermos: documento.versao }));
      setErroPolitica('');
    }).catch(() => {
      if (ativo) setErroPolitica('Não foi possível carregar os Termos de Aceite e a Política de Privacidade. Tente novamente.');
    }).finally(() => ativo && setCarregandoPolitica(false));
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    const cep = dados.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      queueMicrotask(() => setMensagemCep(cep ? 'Informe um CEP com oito números.' : ''));
      return undefined;
    }
    let ativo = true;
    queueMicrotask(() => { setCarregandoCep(true); setMensagemCep('Consultando endereço...'); });
    consultarEndereco(cep).then((endereco) => {
      if (!ativo) return;
      if (!endereco) { setMensagemCep('CEP não encontrado.'); return; }
      setDados((atuais) => ({ ...atuais, logradouro: endereco.logradouro || '', bairro: endereco.bairro || '', cidade: endereco.cidade || endereco.localidade || '', estado: endereco.estado || endereco.uf || '' }));
      setMensagemCep('Endereço preenchido.');
    }).catch((falha) => {
      if (ativo) setMensagemCep(falha.status === 404 ? 'CEP não encontrado.' : 'Falha temporária na consulta do CEP.');
    }).finally(() => ativo && setCarregandoCep(false));
    return () => { ativo = false; };
  }, [dados.cep]);

  function alterar(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setErro('');
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (idade < 18) { setErro('A plataforma Curso Válido é exclusiva para maiores de 18 anos.'); return; }
    if (!politica?.versao) { setErro('A versão atual dos documentos ainda não foi carregada.'); return; }
    if (!formularioValido) { setErro('Preencha todos os campos obrigatórios e aceite os termos.'); return; }
    setCarregando(true); setErro('');
    try {
      await cadastrarUsuario({ ...dados, cpf: dados.cpf.replace(/\D/g, ''), cep: dados.cep.replace(/\D/g, '') });
      setCadastroConcluido(true);
    } catch (falha) { setErro(falha.message); } finally { setCarregando(false); }
  }

  return (
    <div className="pagina-publica">
      <main className="painel-cadastro">
        <div className="marca-publica">CURSO VÁLIDO <span>•</span></div>
        <h1>Cadastro de aluno</h1>
        <p className="texto-suave">Crie seu acesso gratuito para participar da comunidade acadêmica.</p>
        {localizacao.state?.mensagem && <div className="mensagem-sucesso" role="status">{localizacao.state.mensagem}</div>}
        {carregandoPolitica && <p className="texto-suave">Carregando os documentos atuais...</p>}
        {erroPolitica && <><div className="mensagem-erro" role="alert">{erroPolitica}</div><button className="btn btn-secondary" type="button" onClick={carregarPolitica} disabled={carregandoPolitica}>Buscar novamente</button></>}
        {cadastroConcluido ? (
          <section className="mensagem-cadastro-concluido" role="status">
            <h2>Cadastro realizado</h2>
            <p>Cadastro realizado. Verifique seu e-mail para confirmar a conta.</p>
            <p>O R.A. será gerado automaticamente pelo sistema após a ativação.</p>
            <button className="botao-destaque" type="button" onClick={() => navegar('/login')}>Ir para o login</button>
          </section>
        ) : <FormularioCadastro dados={dados} idade={idade} mensagemCep={mensagemCep} carregandoCep={carregandoCep} carregando={carregando} formularioValido={formularioValido} onAlterar={alterar} onEnviar={enviar} erro={erro} />}
        <p className="texto-rodape-formulario">Já possui uma conta? <Link to="/login">Entrar</Link></p>
      </main><Rodape />
    </div>
  );
}
