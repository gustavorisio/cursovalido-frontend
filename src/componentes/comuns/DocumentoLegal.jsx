import { useRef, useState } from 'react';
import Rodape from './Rodape';
import HistoricoDocumentos from './HistoricoDocumentos';
import ConteudoLegal from './ConteudoLegal';
import { buscarPoliticaAtiva, buscarPrivacidadeAtiva } from '../../servicos/servicoAutenticacao';

export default function DocumentoLegal({ tipo, versao, dataPublicacao, conteudo, carregando, erro, onVoltar, onRecarregar, exibirConteudo = true, children }) {
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [alternativo, setAlternativo] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [falha, setFalha] = useState('');
  const emAndamento = useRef(false);
  const cache = useRef(null);
  const exibido = alternativo?.tipo ?? tipo;
  const documento = alternativo ?? { versao, dataPublicacao, conteudo };
  const titulo = exibido === 'privacidade' ? 'Política de Privacidade' : 'Termos de Aceite';
  async function selecionarDocumento(destino) {
    if (emAndamento.current || destino === exibido) return;
    setFalha('');
    if (destino === tipo) { setAlternativo(null); return; }
    if (cache.current) { setAlternativo(cache.current); return; }
    emAndamento.current = true;
    setBuscando(true); setFalha('');
    try {
      const atual = await (destino === 'privacidade' ? buscarPrivacidadeAtiva() : buscarPoliticaAtiva());
      if (!atual?.versao || !atual?.conteudo) throw new Error('Documento indisponível.');
      cache.current = { ...atual, tipo: destino };
      setAlternativo(cache.current);
    } catch { setFalha('Não foi possível carregar o documento. Tente novamente.'); }
    finally { emAndamento.current = false; setBuscando(false); }
  }
  return <div className="pagina-publica"><main className="pagina-documento">
    <nav className="documento-navegacao" aria-label="Navegação dos documentos">
      <button className="btn btn-secondary" type="button" onClick={onVoltar}>Voltar</button>
      <button className="btn btn-secondary" type="button" disabled={buscando || carregando} onClick={() => selecionarDocumento(exibido === 'privacidade' ? 'termos' : 'privacidade')}>{exibido === 'privacidade' ? 'Termos de Aceite' : 'Política de Privacidade'}</button>
    </nav>
    <h1>{titulo}</h1>
    {(carregando || buscando) && <p className="texto-suave" role="status">Carregando a versão atual...</p>}
    {documento.versao && <p className="texto-suave">Versão vigente: {documento.versao}{documento.dataPublicacao && (' · Publicada em: ' + new Intl.DateTimeFormat('pt-BR').format(new Date(documento.dataPublicacao)))}</p>}
    {(erro || falha) && <div className="mensagem-erro" role="alert">{erro || falha}<div><button className="btn btn-secondary" type="button" disabled={carregando || buscando} onClick={falha ? () => selecionarDocumento(exibido === 'privacidade' ? 'termos' : 'privacidade') : onRecarregar}>Buscar novamente</button></div></div>}
    {children && <div hidden={exibido !== tipo}>{children}</div>}
    {!carregando && !buscando && (exibirConteudo || exibido !== tipo) && documento.conteudo && <div className="documento-conteudo" role="region" aria-label={titulo}><ConteudoLegal conteudo={documento.conteudo} /></div>}
  </main><Rodape onDocumento={selecionarDocumento} onHistorico={() => setHistoricoAberto(true)} />
    {historicoAberto && <HistoricoDocumentos key={exibido} tipo={exibido} onFechar={() => setHistoricoAberto(false)} />}
  </div>;
}
