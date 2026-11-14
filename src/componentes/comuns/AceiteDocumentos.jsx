import { useEffect, useId, useRef, useState } from 'react';
import { buscarPoliticaAtiva, buscarPrivacidadeAtiva } from '../../servicos/servicoAutenticacao';
import ConteudoLegal from './ConteudoLegal';

const TITULOS = { termos: 'Termos de Aceite', privacidade: 'Política de Privacidade' };

function LeituraDocumento({ tipo, versaoTermos, desabilitado, onAceitar, onFechar }) {
  const [documento, setDocumento] = useState(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [leuTudo, setLeuTudo] = useState(false);
  const texto = useRef(null);
  const id = useId();

  useEffect(() => {
    let ativo = true;
    const buscar = tipo === 'termos' ? buscarPoliticaAtiva : buscarPrivacidadeAtiva;
    buscar().then((atual) => {
      if (!atual?.versao || typeof atual.conteudo !== 'string' || !atual.conteudo.trim()) {
        throw new Error('Documento indisponível.');
      }
      if (tipo === 'termos' && atual.versao !== versaoTermos) {
        throw new Error('Os termos foram atualizados. Recarregue a página para ler a versão atual.');
      }
      if (ativo) setDocumento(atual);
    }).catch((falha) => {
      if (ativo) setErro(falha.message || 'Não foi possível carregar o documento. Tente novamente.');
    });
    return () => { ativo = false; };
  }, [tipo, versaoTermos, tentativa]);

  useEffect(() => {
    if (!documento) return;
    const elemento = texto.current;
    function verificarFim() {
      if (elemento.clientHeight > 0 && elemento.scrollHeight - elemento.scrollTop <= elemento.clientHeight + 2) setLeuTudo(true);
    }
    elemento.focus();
    const temporizador = window.setTimeout(verificarFim, 0);
    const observador = window.ResizeObserver ? new window.ResizeObserver(verificarFim) : null;
    observador?.observe(elemento);
    window.addEventListener('resize', verificarFim);
    return () => {
      window.clearTimeout(temporizador);
      observador?.disconnect();
      window.removeEventListener('resize', verificarFim);
    };
  }, [documento]);

  return <section className="leitura-documento" aria-labelledby={id} aria-busy={!documento && !erro}>
    <h3 id={id}>{TITULOS[tipo]}</h3>
    {!documento && !erro && <p role="status">Carregando o documento...</p>}
    {erro && <div className="mensagem-erro" role="alert">{erro}<div><button type="button" className="btn btn-secondary" onClick={() => { setErro(''); setTentativa((atual) => atual + 1); }}>Tentar novamente</button></div></div>}
    {documento && <>
      <p className="texto-suave">Versão vigente: {documento.versao}</p>
      <p id={id + '-instrucao'} className="texto-suave">Role o texto até o final para liberar o aceite.</p>
      <div ref={texto} className="leitura-documento-texto" role="region" aria-label={TITULOS[tipo]} aria-describedby={id + '-instrucao'} tabIndex={0} onScroll={(evento) => {
        const elemento = evento.currentTarget;
        if (elemento.clientHeight > 0 && elemento.scrollHeight - elemento.scrollTop <= elemento.clientHeight + 2) setLeuTudo(true);
      }}><ConteudoLegal conteudo={documento.conteudo} /></div>
      <p className="texto-suave" role="status">{leuTudo ? 'Leitura concluída. Você já pode aceitar este documento.' : 'Aceite bloqueado até chegar ao final do texto.'}</p>
    </>}
    <div className="leitura-documento-acoes">
      <button className="btn btn-secondary" type="button" disabled={desabilitado} onClick={onFechar}>Fechar</button>
      <button className="btn btn-primary" type="button" disabled={!documento || !leuTudo || desabilitado} onClick={() => { if (documento && leuTudo) onAceitar(); }}>Li e aceito {tipo === 'termos' ? 'os termos' : 'a política de privacidade'}</button>
    </div>
  </section>;
}

export default function AceiteDocumentos({ versaoTermos, aceito, onAlterar, desabilitado = false }) {
  const [aceitos, setAceitos] = useState({ termos: false, privacidade: false });
  const [aberto, setAberto] = useState(null);
  const id = useId();

  function aceitarDocumento() {
    const proximos = { ...aceitos, [aberto]: true };
    setAceitos(proximos);
    const completo = proximos.termos && proximos.privacidade;
    onAlterar(completo);
    setAberto(completo ? null : proximos.termos ? 'privacidade' : 'termos');
  }

  return <div className="aceite-documentos">
    <label className="checkbox"><input type="checkbox" checked={Boolean(aceito && aceitos.termos && aceitos.privacidade)} disabled={desabilitado || !versaoTermos} onChange={(evento) => {
      if (!evento.target.checked) { setAceitos({ termos: false, privacidade: false }); onAlterar(false); }
      else setAberto(aceitos.termos ? 'privacidade' : 'termos');
    }} />Li e aceito os Termos de Aceite e a Política de Privacidade.</label>
    <p className="texto-suave">Leia e aceite os dois documentos para continuar.</p>
    <div className="leitura-documento-acoes">
      {Object.entries(TITULOS).map(([tipo, titulo]) => <button key={tipo} type="button" className="btn btn-secondary" disabled={desabilitado || !versaoTermos} aria-expanded={aberto === tipo} aria-controls={id} onClick={() => setAberto(tipo)}>{titulo}{aceitos[tipo] ? ' — Aceito' : ' — Ler e aceitar'}</button>)}
    </div>
    <div id={id}>{aberto && <LeituraDocumento key={aberto} tipo={aberto} versaoTermos={versaoTermos} desabilitado={desabilitado} onAceitar={aceitarDocumento} onFechar={() => setAberto(null)} />}</div>
  </div>;
}
