import { dadosDoToken } from '../servicos/sessaoNavegador';
import AceiteDocumentos from '../componentes/comuns/AceiteDocumentos';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentoLegal from '../componentes/comuns/DocumentoLegal';
import { aceitarTermosNovamente, buscarPoliticaAtiva } from '../servicos/servicoAutenticacao';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function TermosDeUso() {
  const [versao, setVersao] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [aceitePendente, setAceitePendente] = useState(() => sessionStorage.getItem('curso-valido-token-termos') || '');
  const perfil = dadosDoToken(aceitePendente)?.perfil;
  const perfilValido = ['ALUNO', 'PROFESSOR', 'ADMINISTRADOR'].includes(perfil);
  const [responsabilidade, setResponsabilidade] = useState({});
  const [aceito, setAceito] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoMetadados, setCarregandoMetadados] = useState(true);
  const [revisaoDocumentos, setRevisaoDocumentos] = useState(0);
  const navegar = useNavigate();
  const localizacao = useLocation();
  const { autenticado, sair } = useAutenticacao();

  function voltar() {
    const retorno = localizacao.state?.retornoDocumentos;
    navegar(retorno?.startsWith('/') && !retorno.startsWith('//') && !/termos|politica-privacidade/.test(retorno) ? retorno : autenticado ? '/cursos' : '/', { replace: true });
  }

  async function carregarDocumento() {
    setCarregandoMetadados(true);
    setAceito(false);
    setResponsabilidade({});
    setRevisaoDocumentos((atual) => atual + 1);
    setErro('');
    try {
      const politica = await buscarPoliticaAtiva();
      setVersao(politica.versao);
      setConteudo(politica.conteudo);
      setDataPublicacao(politica.dataPublicacao || '');
    } catch (falha) {
      if (falha.status === 401) {
        navegar('/login', { replace: true });
        return;
      }
      setVersao('');
      setConteudo('');
      setDataPublicacao('');
      setErro('Não foi possível carregar os documentos atuais. Tente novamente.');
    } finally { setCarregandoMetadados(false); }
  }

  useEffect(() => {
    let ativo = true;
    buscarPoliticaAtiva().then((politica) => {
      if (!ativo) return;
      setVersao(politica.versao);
      setConteudo(politica.conteudo);
      setDataPublicacao(politica.dataPublicacao || '');
    }).catch((falha) => {
      if (!ativo) return;
      if (falha.status === 401) {
        navegar('/login', { replace: true });
        return;
      }
      setVersao('');
      setConteudo('');
      setDataPublicacao('');
      setErro('Não foi possível carregar os documentos atuais. Tente novamente.');
    }).finally(() => ativo && setCarregandoMetadados(false));
    return () => { ativo = false; };
  }, [navegar]);

  async function aceitar() {
    if (!aceito || !aceitePendente || !versao || !perfilValido) return;
    if (perfil !== 'ALUNO' && !responsabilidade.aceitouResponsabilidade) return;
    setCarregando(true); setErro('');
    try {
      await aceitarTermosNovamente(aceitePendente, versao, responsabilidade);
      sessionStorage.removeItem('curso-valido-token-termos');
      setAceitePendente('');
      sair();
      setMensagem('Termos aceitos novamente. Faça login para continuar.');
      window.setTimeout(() => navegar('/login', {
        replace: true,
        state: { mensagem: 'Termos aceitos novamente. Faça login para continuar.' }
      }), 1200);
    } catch (falha) {
      if (falha.status === 400) {
        setErro('A versão atual dos documentos não está disponível. Busque novamente os documentos.');
      } else if (falha.status === 401 || falha.status === 403) {
        sessionStorage.removeItem('curso-valido-token-termos');
        sair();
        navegar('/login', { replace: true, state: { mensagem: 'Não foi possível validar o aceite. Faça login novamente.' } });
      } else if (falha.status >= 500) {
        setErro('O serviço está indisponível. Tente novamente mais tarde.');
      } else {
        setErro(falha.message);
      }
    } finally { setCarregando(false); }
  }

  return <DocumentoLegal tipo="termos" versao={versao} dataPublicacao={dataPublicacao} conteudo={conteudo} exibirConteudo={!aceitePendente} carregando={carregandoMetadados} erro={erro} onVoltar={voltar} onRecarregar={carregarDocumento}>
    {mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}
    {aceitePendente && versao && <section className="mensagem-cadastro-concluido"><h2>Aceite necessário</h2>{!perfilValido && <p role="alert">Não foi possível identificar seu perfil. Faça login novamente.</p>}<p>É necessário aceitar os documentos atuais para acessar a conta.</p><AceiteDocumentos key={versao + perfil + revisaoDocumentos} perfil={perfil} onResponsabilidade={setResponsabilidade} versaoTermos={versao} aceito={aceito} onAlterar={setAceito} desabilitado={carregando || carregandoMetadados} /><button className="botao-destaque" type="button" disabled={!aceito || !perfilValido || carregando || carregandoMetadados} onClick={aceitar}>{carregando ? 'Enviando...' : 'Aceitar termos e voltar ao login'}</button></section>}
  </DocumentoLegal>;
}
