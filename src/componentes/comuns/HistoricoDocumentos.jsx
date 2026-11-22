import { useEffect, useId, useRef, useState } from 'react';
import { buscarHistoricoDocumentos } from '../../servicos/servicoAutenticacao';
import ConteudoLegal from './ConteudoLegal';

function dataPublicacao(valor) {
  return valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(valor)) : 'Data não informada';
}

export default function HistoricoDocumentos({ tipo, onFechar }) {
  const [documentos, setDocumentos] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const janela = useRef(null);
  const id = useId();
  const titulo = tipo === 'privacidade' ? 'Política de Privacidade' : 'Termos de Aceite';

  useEffect(() => {
    const dialogo = janela.current;
    const acionador = document.activeElement;
    const overflow = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialogo.close();
      document.body.style.overflow = overflow;
      acionador?.focus();
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    buscarHistoricoDocumentos(tipo).then((resposta) => {
      if (ativo) setDocumentos(resposta);
    }).catch(() => {
      if (ativo) setErro('Não foi possível carregar o histórico. Tente novamente.');
    });
    return () => { ativo = false; };
  }, [tipo, tentativa]);

  return <dialog ref={janela} className="leitura-documento" aria-labelledby={id} onCancel={(evento) => { evento.preventDefault(); onFechar(); }}>
    <h3 id={id}>Histórico — {titulo}</h3>
    {!documentos && !erro && <p role="status">Carregando versões anteriores...</p>}
    {erro && <div role="alert" className="mensagem-erro">{erro}<button type="button" className="btn btn-secondary" onClick={() => { setErro(''); setTentativa((atual) => atual + 1); }}>Tentar novamente</button></div>}
    {documentos?.length === 0 && <p>Nenhuma versão anterior publicada.</p>}
    {documentos?.length > 0 && <nav aria-label="Versões anteriores"><ul>
      {documentos.map((documento) => <li key={documento.versao}><button className="btn btn-secondary" type="button" aria-pressed={selecionado?.versao === documento.versao} onClick={() => setSelecionado(documento)}>Versão {documento.versao} · {dataPublicacao(documento.dataPublicacao)}</button></li>)}
    </ul></nav>}
    {selecionado && <section aria-label="Documento anterior">
      <h4>{selecionado.nome || titulo}</h4>
      <p>Versão: {selecionado.versao} · Publicada em: {dataPublicacao(selecionado.dataPublicacao)}</p>
      <div className="leitura-documento-texto" role="region" aria-label="Conteúdo da versão anterior" tabIndex={0}><ConteudoLegal conteudo={selecionado.conteudo} /></div>
    </section>}
    <div className="leitura-documento-acoes"><button type="button" className="btn btn-secondary" onClick={onFechar}>Fechar histórico</button></div>
  </dialog>;
}
