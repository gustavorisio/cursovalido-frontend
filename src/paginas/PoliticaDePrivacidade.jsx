import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { buscarPoliticaAtiva } from '../servicos/servicoAutenticacao';
import { URL_BACKEND } from '../servicos/api';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function PoliticaDePrivacidade() {
  const [versao, setVersao] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [carregandoDocumento, setCarregandoDocumento] = useState(true);
  const [erroDocumento, setErroDocumento] = useState(false);
  const navegar = useNavigate();
  const { autenticado } = useAutenticacao();

  function voltar() {
    if (window.history.length > 1) navegar(-1);
    else navegar(autenticado ? '/forum' : '/');
  }

  async function carregarDocumento() {
    setCarregando(true); setErro('');
    try {
      const politica = await buscarPoliticaAtiva();
      setVersao(politica.versao);
      setDataPublicacao(politica.dataPublicacao || '');
    } catch (falha) {
      if (falha.status === 401) {
        navegar('/login', { replace: true });
        return;
      }
      setVersao(''); setErro('Não foi possível carregar os documentos atuais. Tente novamente.');
      setDataPublicacao('');
    } finally { setCarregando(false); }
  }

  useEffect(() => {
    let ativo = true;
    buscarPoliticaAtiva().then((politica) => {
      if (!ativo) return;
      setVersao(politica.versao);
      setDataPublicacao(politica.dataPublicacao || '');
    }).catch((falha) => {
      if (!ativo) return;
      if (falha.status === 401) {
        navegar('/login', { replace: true });
        return;
      }
      setVersao('');
      setDataPublicacao('');
      setErro('Não foi possível carregar os documentos atuais. Tente novamente.');
    }).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [navegar]);

  return <div className="pagina-publica"><main className="pagina-documento"><button className="btn btn-link" type="button" onClick={voltar}>← Voltar</button><h1>Política de Privacidade</h1>{carregando && <p className="texto-suave">Carregando a versão atual...</p>}{erro && <><div className="mensagem-erro" role="alert">{erro}</div><button className="btn btn-secondary" type="button" onClick={carregarDocumento}>Buscar novamente</button></>}{versao && <p className="texto-suave">Versão vigente: {versao}{dataPublicacao && ` · Publicada em: ${new Intl.DateTimeFormat('pt-BR').format(new Date(dataPublicacao))}`}</p>}<p className="texto-suave"><Link to="/termos-aceite.html">Termos de Aceite</Link></p><div className="relative mt-6">{!erroDocumento && <iframe title="Política de Privacidade" src={`${URL_BACKEND}/politica-privacidade.html`} className="documento-iframe" onLoad={() => setCarregandoDocumento(false)} onError={() => { setCarregandoDocumento(false); setErroDocumento(true); }} />}{carregandoDocumento && <p className="texto-suave">Carregando o documento...</p>}{erroDocumento && <div className="mensagem-erro" role="alert">Não foi possível carregar a Política de Privacidade. Verifique se o backend está ativo.</div>}</div></main><Rodape /></div>;
}
