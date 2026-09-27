import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Rodape from '../componentes/comuns/Rodape';
import { aceitarTermosNovamente, buscarPoliticaAtiva } from '../servicos/servicoAutenticacao';
import { URL_BACKEND } from '../servicos/api';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function TermosDeUso() {
  const [versao, setVersao] = useState('');
  const [erroDocumento, setErroDocumento] = useState(false);
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [aceitePendente, setAceitePendente] = useState(() => sessionStorage.getItem('curso-valido-token-termos') || '');
  const [aceito, setAceito] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoDocumento, setCarregandoDocumento] = useState(true);
  const navegar = useNavigate();
  const { autenticado, sair } = useAutenticacao();

  function voltar() {
    if (window.history.length > 1) navegar(-1);
    else navegar(autenticado ? '/forum' : '/');
  }

  async function carregarDocumento() {
    setCarregandoDocumento(true);
    setErro('');
    try {
      const politica = await buscarPoliticaAtiva();
      setVersao(politica.versao);
      setDataPublicacao(politica.dataPublicacao || '');
    } catch (falha) {
      if (falha.status === 401) {
        navegar('/login', { replace: true });
        return;
      }
      setVersao('');
      setDataPublicacao('');
      setErro('Não foi possível carregar os documentos atuais. Tente novamente.');
    } finally { setCarregandoDocumento(false); }
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
    }).finally(() => ativo && setCarregandoDocumento(false));
    return () => { ativo = false; };
  }, [navegar]);

  async function aceitar() {
    if (!aceito || !aceitePendente || !versao) return;
    setCarregando(true); setErro('');
    try {
      await aceitarTermosNovamente(aceitePendente, versao);
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
        setErro('O servidor está indisponível. Tente novamente mais tarde.');
      } else {
        setErro(falha.message);
      }
    } finally { setCarregando(false); }
  }

  return <div className="pagina-publica"><main className="pagina-documento"><button className="btn btn-link" type="button" onClick={voltar}>← Voltar</button><h1>Termos de Aceite</h1>{carregandoDocumento && <p className="texto-suave">Carregando a versão atual...</p>}{erro && <><div className="mensagem-erro" role="alert">{erro}</div><button className="btn btn-secondary" type="button" onClick={carregarDocumento}>Buscar novamente</button></>}{mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}{versao && <p className="texto-suave">Versão vigente: {versao}{dataPublicacao && ` · Publicada em: ${new Intl.DateTimeFormat('pt-BR').format(new Date(dataPublicacao))}`}</p>}<p className="texto-suave"><Link to="/politica-privacidade.html">Política de Privacidade</Link></p>{aceitePendente && versao && <section className="mensagem-cadastro-concluido"><h2>Aceite necessário</h2><p>É necessário aceitar os documentos atuais para acessar a conta.</p><label className="checkbox"><input type="checkbox" checked={aceito} onChange={(evento) => setAceito(evento.target.checked)} />Li e aceito os Termos de Aceite e a Política de Privacidade.</label><button className="botao-destaque" type="button" disabled={!aceito || carregando || carregandoDocumento} onClick={aceitar}>{carregando ? 'Enviando...' : 'Aceitar termos e voltar ao login'}</button></section>}<div className="relative mt-6">{!erroDocumento && <iframe title="Termos de Aceite" src={`${URL_BACKEND}/termos-aceite.html`} className="documento-iframe" onLoad={() => setCarregandoDocumento(false)} onError={() => { setCarregandoDocumento(false); setErroDocumento(true); }} />}{carregandoDocumento && <p className="texto-suave">Carregando o documento...</p>}{erroDocumento && <div className="mensagem-erro" role="alert">Não foi possível carregar os Termos de Aceite. Verifique se o backend está ativo.</div>}</div></main><Rodape /></div>;
}
