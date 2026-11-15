import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { buscarPoliticaAtiva, buscarPrivacidadeAtiva, buscarResponsabilidade } from '../../servicos/servicoAutenticacao';
import ConteudoLegal from './ConteudoLegal';

const TITULOS = { termos: 'Termos de Aceite', privacidade: 'Política de Privacidade', responsabilidade: 'Termo de Responsabilidade' };

function LeituraDocumento({ tipo, perfil, versaoTermos, desabilitado, onAceitar, onFechar, carregarDocumento }) {
  const [documento, setDocumento] = useState(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  const texto = useRef(null);
  const id = useId();

  useEffect(() => {
    let ativo = true;
    carregarDocumento(tipo).then((atual) => {
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
  }, [tipo, perfil, versaoTermos, tentativa, carregarDocumento]);

  useEffect(() => {
    if (documento) texto.current?.focus();
  }, [documento]);

  return <section className="leitura-documento" aria-labelledby={id} aria-busy={!documento && !erro}>
    <h3 id={id}>{TITULOS[tipo]}{tipo === 'responsabilidade' ? ` — ${perfil === 'PROFESSOR' ? 'Professor' : 'Administrador'}` : ''}</h3>
    {!documento && !erro && <p role="status">Carregando o documento...</p>}
    {erro && <div className="mensagem-erro" role="alert">{erro}<div><button type="button" className="btn btn-secondary" onClick={() => { setErro(''); setTentativa((atual) => atual + 1); }}>Tentar novamente</button></div></div>}
    {documento && <>
      <p className="texto-suave">Versão vigente: {documento.versao}</p>
      <div ref={texto} className="leitura-documento-texto" role="region" aria-label={TITULOS[tipo]} tabIndex={0}><ConteudoLegal conteudo={documento.conteudo} /></div>
    </>}
    <div className="leitura-documento-acoes">
      <button className="btn btn-secondary" type="button" disabled={desabilitado} onClick={onFechar}>Fechar</button>
      <button className="btn btn-primary" type="button" disabled={!documento || desabilitado} onClick={() => { if (documento) onAceitar(documento); }}>Li e aceito {tipo === 'responsabilidade' ? 'o termo de responsabilidade' : tipo === 'termos' ? 'os termos' : 'a política de privacidade'}</button>
    </div>
  </section>;
}

export default function AceiteDocumentos({ versaoTermos, aceito, onAlterar, desabilitado = false, perfil, onResponsabilidade }) {
  const [aceitos, setAceitos] = useState({ termos: false, privacidade: false });
  const [aberto, setAberto] = useState(null);
  const documentos = useRef(new Map());
  const carregarDocumento = useCallback((tipo) => {
    const chave = tipo + ':' + (tipo === 'responsabilidade' ? perfil : versaoTermos);
    if (!documentos.current.has(chave)) {
      const buscar = tipo === 'responsabilidade' ? () => buscarResponsabilidade(perfil) : tipo === 'termos' ? buscarPoliticaAtiva : buscarPrivacidadeAtiva;
      const pendente = buscar().then(atual => {
        if (!atual?.versao || typeof atual.conteudo !== 'string' || !atual.conteudo.trim()) throw new Error('Documento indisponível.');
        if (tipo === 'termos' && atual.versao !== versaoTermos) throw new Error('Os termos foram atualizados. Recarregue a página para ler a versão atual.');
        return atual;
      }).catch(erro => { documentos.current.delete(chave); throw erro; });
      documentos.current.set(chave, pendente);
    }
    return documentos.current.get(chave);
  }, [perfil, versaoTermos]);
  const id = useId();

  const exigeResponsabilidade = ['PROFESSOR', 'ADMINISTRADOR'].includes(perfil);
  const tipos = exigeResponsabilidade ? ['termos', 'privacidade', 'responsabilidade'] : ['termos', 'privacidade'];

  function aceitarDocumento(documento) {
    const proximos = { ...aceitos, [aberto]: true };
    setAceitos(proximos);
    const completo = tipos.every((tipo) => proximos[tipo]);
    if (aberto === 'responsabilidade') onResponsabilidade?.({ aceitouResponsabilidade: true, versaoResponsabilidade: documento.versao });
    onAlterar(completo);
    setAberto(tipos.find((tipo) => !proximos[tipo]) ?? null);
  }

  return <div className="aceite-documentos">
    <label className="checkbox"><input type="checkbox" checked={Boolean(aceito && tipos.every((tipo) => aceitos[tipo]))} disabled={desabilitado || !versaoTermos} onChange={(evento) => {
      if (!evento.target.checked) { setAceitos({ termos: false, privacidade: false }); onAlterar(false); if (exigeResponsabilidade) onResponsabilidade?.({ aceitouResponsabilidade: false, versaoResponsabilidade: '' }); }
      else setAberto(tipos.find((tipo) => !aceitos[tipo]) ?? 'termos');
    }} />Li e aceito os Termos de Aceite, a Política de Privacidade{exigeResponsabilidade ? ' e o Termo de Responsabilidade do meu perfil' : ''}.</label>
    <p className="texto-suave">Leia e aceite {exigeResponsabilidade ? 'os três' : 'os dois'} documentos para continuar.</p>
    <div className="leitura-documento-acoes">
      {tipos.map((tipo) => <button key={tipo} type="button" className="btn btn-secondary" disabled={desabilitado || !versaoTermos} aria-expanded={aberto === tipo} aria-controls={id} onClick={() => setAberto(tipo)}>{TITULOS[tipo]}{aceitos[tipo] ? ' — Aceito' : ' — Ler e aceitar'}</button>)}
    </div>
    <div id={id}>{aberto && <LeituraDocumento carregarDocumento={carregarDocumento} key={aberto} tipo={aberto} perfil={perfil} versaoTermos={versaoTermos} desabilitado={desabilitado} onAceitar={aceitarDocumento} onFechar={() => setAberto(null)} />}</div>
  </div>;
}
