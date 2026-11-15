import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentoLegal from '../componentes/comuns/DocumentoLegal';
import { buscarPrivacidadeAtiva } from '../servicos/servicoAutenticacao';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function PoliticaDePrivacidade() {
  const [versao, setVersao] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const navegar = useNavigate();
  const localizacao = useLocation();
  const { autenticado } = useAutenticacao();

  function voltar() {
    const retorno = localizacao.state?.retornoDocumentos;
    navegar(retorno?.startsWith('/') && !retorno.startsWith('//') && !/termos|politica-privacidade/.test(retorno) ? retorno : autenticado ? '/cursos' : '/', { replace: true });
  }

  async function carregarDocumento() {
    setCarregando(true); setErro('');
    try {
      const politica = await buscarPrivacidadeAtiva();
      setVersao(politica?.versao ?? '');
      setConteudo(politica?.conteudo ?? '');
      setDataPublicacao(politica?.dataPublicacao || '');
    } catch (falha) {
      if (falha.status === 401) {
        navegar('/login', { replace: true });
        return;
      }
      setVersao(''); setErro('Não foi possível carregar os documentos atuais. Tente novamente.');
      setConteudo('');
      setDataPublicacao('');
    } finally { setCarregando(false); }
  }

  useEffect(() => {
    let ativo = true;
    buscarPrivacidadeAtiva().then((politica) => {
      if (!ativo) return;
      setVersao(politica?.versao ?? '');
      setConteudo(politica?.conteudo ?? '');
      setDataPublicacao(politica?.dataPublicacao || '');
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
    }).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [navegar]);

  return <DocumentoLegal tipo="privacidade" versao={versao} dataPublicacao={dataPublicacao} conteudo={conteudo} carregando={carregando} erro={erro} onVoltar={voltar} onRecarregar={carregarDocumento} />;
}
