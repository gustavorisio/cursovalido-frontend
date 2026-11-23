import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormularioCadastro from '../componentes/autenticacao/FormularioCadastro';
import Rodape from '../componentes/comuns/Rodape';
import { buscarPoliticaAtiva, cadastrarUsuario } from '../servicos/servicoAutenticacao';
import { validarCadastro } from '../servicos/validacoesAutenticacao';
import { useAcaoUnica } from '../contextos/useAcaoUnica';

const VALOR_PADRAO = {
  nomeCompleto: '', email: '', senha: '', confirmacaoSenha: '',
  declarouMaiorIdade: false,
  aceitouTermosLgpd: false, versaoTermos: ''
};

export default function Cadastro() {
  const navegar = useNavigate();
  const localizacao = useLocation();
  const [dados, setDados] = useState(VALOR_PADRAO);
  const [erro, setErro] = useState('');
  const [executar, carregando] = useAcaoUnica();
  const [carregandoPolitica, setCarregandoPolitica] = useState(true);
  const [erroPolitica, setErroPolitica] = useState('');
  const [politica, setPolitica] = useState(null);
  const problema = useMemo(() => validarCadastro(dados), [dados]);
  const formularioValido = !problema && !carregandoPolitica;

  async function carregarPolitica() {
    setCarregandoPolitica(true);
    setDados((atuais) => ({ ...atuais, aceitouTermosLgpd: false }));
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


  function alterar(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setErro('');
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (carregando) return;
    if (problema) { setErro(problema); return; }
    if (!politica?.versao || carregandoPolitica) { setErro('A versão atual dos documentos ainda não foi carregada.'); return; }
    await executar(async () => {
      setErro('');
      try {
        await cadastrarUsuario(dados);
        navegar('/login', { replace: true, state: { mensagem: 'Cadastro realizado. Autentique-se para acessar a plataforma.' } });
      } catch (falha) { setErro(falha.message); }
    });
  }

  return (
    <div className="pagina-publica">
      <main className="painel-cadastro">
        <div className="marca-publica">CURSO VÁLIDO </div>
        <h1>Cadastro de aluno</h1>
        <p className="texto-suave">Crie seu acesso gratuito para participar da comunidade acadêmica.</p>
        {localizacao.state?.mensagem && <div className="mensagem-sucesso" role="status">{localizacao.state.mensagem}</div>}
        {carregandoPolitica && <p className="texto-suave">Carregando os documentos atuais...</p>}
        {erroPolitica && <><div className="mensagem-erro" role="alert">{erroPolitica}</div><button className="btn btn-secondary" type="button" onClick={carregarPolitica} disabled={carregandoPolitica}>Buscar novamente</button></>}
        <FormularioCadastro dados={dados} carregando={carregando} formularioValido={formularioValido} onAlterar={alterar} onEnviar={enviar} erro={erro} />
        <p className="texto-rodape-formulario">Já possui uma conta? <Link to="/login">Entrar</Link></p>
      </main><Rodape />
    </div>
  );
}
