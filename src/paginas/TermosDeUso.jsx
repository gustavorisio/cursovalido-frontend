import { dadosDoToken } from '../servicos/sessaoNavegador';
import AceiteDocumentos from '../componentes/comuns/AceiteDocumentos';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentoLegal from '../componentes/comuns/DocumentoLegal';
import { buscarPoliticaAtiva } from '../servicos/servicoAutenticacao';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function TermosDeUso() {
  const { search } = useLocation();
  return <TelaTermos key={search} />;
}

function TelaTermos() {
  const [versao, setVersao] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [aceitePendente, setAceitePendente] = useState(() => sessionStorage.getItem('curso-valido-token-termos') || '');
  const perfil = dadosDoToken(aceitePendente)?.perfil;
  const perfilValido = ['ALUNO', 'PROFESSOR', 'ADMINISTRADOR'].includes(perfil);
  const [aceito, setAceito] = useState(false);
  const [erro, setErro] = useState('');
  const enviando = useRef(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoMetadados, setCarregandoMetadados] = useState(true);
  const [revisaoDocumentos, setRevisaoDocumentos] = useState(0);
  const navegar = useNavigate();
  const localizacao = useLocation();
  const { autenticado, sessao, sair, confirmarAceiteTermos, encerrarPorDecisaoTermos } = useAutenticacao();
  const atualizacao = autenticado && new URLSearchParams(localizacao.search).get('atualizacao') === 'true';

  function voltar() {
    if (enviando.current) return;
    const retorno = localizacao.state?.retornoDocumentos;
    navegar(retorno?.startsWith('/') && !retorno.startsWith('//') && !/termos|politica-privacidade/.test(retorno) ? retorno : autenticado ? '/cursos' : '/', { replace: true });
  }

  async function carregarDocumento() {
    setCarregandoMetadados(true);
    setAceito(false);
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

  async function decidir(confirmou, responsabilidade = {}) {
    const token = atualizacao ? sessao?.token : aceitePendente;
    if (enviando.current || !token) return;
    if (confirmou && (!versao || carregandoMetadados)) return;
    if (confirmou && !atualizacao && (!perfilValido ||
      (perfil !== 'ALUNO' && !responsabilidade.aceitouResponsabilidade))) return;

    enviando.current = true;
    setCarregando(true);
    setErro('');
    try {
      if (!atualizacao && confirmou) {
        await confirmarAceiteTermos(token, versao, responsabilidade);
        navegar('/cursos', { replace: true });
        return;
      }

      await encerrarPorDecisaoTermos(token, confirmou);
      setAceitePendente('');
      navegar('/login', {
        replace: true,
        state: {
          mensagem: confirmou ? 'Entre novamente para confirmar o aceite dos novos termos.' :
            'Você recusou os termos. Entre novamente para revisar sua decisão.'
        }
      });
    } catch (falha) {
      if (falha.status === 400 && !atualizacao && confirmou) {
        setErro('A versão atual dos documentos não está disponível. Busque novamente os documentos.');
      } else if (falha.status === 401 || falha.status === 403) {
        sair();
        setAceitePendente('');
        navegar('/login', { replace: true, state: { mensagem: 'Não foi possível validar a decisão. Faça login novamente.' } });
      } else {
        setErro(falha.message || 'Não foi possível enviar sua decisão. Tente novamente.');
        if (confirmou && !atualizacao) {
          setAceito(false);
          setRevisaoDocumentos((atual) => atual + 1);
        }
      }
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  }

  return <DocumentoLegal tipo="termos" versao={versao} dataPublicacao={dataPublicacao} conteudo={conteudo}
    exibirConteudo={!aceitePendente || atualizacao} carregando={carregandoMetadados} erro={erro}
    onVoltar={voltar} onRecarregar={carregarDocumento}>
    {atualizacao && <section className="mensagem-cadastro-concluido">
      <h2>Novos termos de uso</h2>
      <p>Entre novamente para revisar e confirmar os documentos atualizados.</p>
      <button className="botao-destaque" type="button" disabled={!versao || carregando || carregandoMetadados} onClick={() => decidir(true)}>Entrar novamente</button>
      <button className="btn btn-secondary" type="button" disabled={carregando} onClick={() => decidir(false)}>Recusar</button>
    </section>}
    {!atualizacao && aceitePendente && <section className="mensagem-cadastro-concluido">
      <h2>Aceite necessário</h2>
      {!perfilValido && <p role="alert">Não foi possível identificar seu perfil. Faça login novamente.</p>}
      <p>É necessário aceitar os documentos atuais para acessar a conta.</p>
      {versao && <AceiteDocumentos key={versao + perfil + revisaoDocumentos} perfil={perfil}
        versaoTermos={versao} aceito={aceito} onAlterar={setAceito}
        desabilitado={!perfilValido || carregando || carregandoMetadados}
        onConcluir={(responsabilidade) => decidir(true, responsabilidade)} />}
      {carregando && <p role="status">Enviando confirmação...</p>}
      <button className="btn btn-secondary" type="button" disabled={carregando} onClick={() => decidir(false)}>Recusar</button>
    </section>}
  </DocumentoLegal>;
}
