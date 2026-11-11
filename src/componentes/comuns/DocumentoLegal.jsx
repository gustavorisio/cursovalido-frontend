import { useState } from 'react';
import { Link } from 'react-router-dom';
import Rodape from './Rodape';
import { URL_BACKEND } from '../../servicos/api';

export default function DocumentoLegal({ tipo, versao, dataPublicacao, carregando, erro, onVoltar, onRecarregar, children }) {
  const [carregandoDocumento, setCarregandoDocumento] = useState(true);
  const [erroDocumento, setErroDocumento] = useState(false);
  const privacidade = tipo === 'privacidade';
  const titulo = privacidade ? 'Política de Privacidade' : 'Termos de Aceite';
  const caminho = privacidade ? 'politica-privacidade.html' : 'termos-aceite.html';
  return <div className="pagina-publica"><main className="pagina-documento">
    <nav className="documento-navegacao" aria-label="Navegação dos documentos">
      <button className="btn btn-secondary" type="button" onClick={onVoltar}>← Voltar</button>
      <Link className="btn btn-secondary" to={privacidade ? '/termos-aceite.html' : '/politica-privacidade.html'}>{privacidade ? 'Termos de Aceite' : 'Política de Privacidade'}</Link>
    </nav>
    <h1>{titulo}</h1>
    {carregando && <p className="texto-suave" role="status">Carregando a versão atual...</p>}
    {versao && <p className="texto-suave">Versão vigente: {versao}{dataPublicacao && (' · Publicada em: ' + new Intl.DateTimeFormat('pt-BR').format(new Date(dataPublicacao)))}</p>}
    {erro && <div className="mensagem-erro" role="alert">{erro}<div><button className="btn btn-secondary" type="button" disabled={carregando} onClick={onRecarregar}>Buscar novamente</button></div></div>}
    {children}
    <div className="relative mt-6">
      <iframe title={titulo} src={URL_BACKEND + '/' + caminho} className="documento-iframe" onLoad={() => setCarregandoDocumento(false)} onError={() => { setCarregandoDocumento(false); setErroDocumento(true); }} />
      {carregandoDocumento && <p className="texto-suave" role="status">Carregando o documento...</p>}
      {erroDocumento && <div className="mensagem-erro" role="alert">Não foi possível carregar o documento. Verifique se o backend está ativo.</div>}
    </div>
  </main><Rodape /></div>;
}
