import { Link } from 'react-router-dom';
import Rodape from './Rodape';
import ConteudoLegal from './ConteudoLegal';

export default function DocumentoLegal({ tipo, versao, dataPublicacao, conteudo, carregando, erro, onVoltar, onRecarregar, children }) {
  const privacidade = tipo === 'privacidade';
  const titulo = privacidade ? 'Política de Privacidade' : 'Termos de Aceite';
  return <div className="pagina-publica"><main className="pagina-documento">
    <nav className="documento-navegacao" aria-label="Navegação dos documentos">
      <button className="btn btn-secondary" type="button" onClick={onVoltar}>Voltar</button>
      <Link className="btn btn-secondary" to={privacidade ? '/termos-aceite.html' : '/politica-privacidade.html'}>{privacidade ? 'Termos de Aceite' : 'Política de Privacidade'}</Link>
    </nav>
    <h1>{titulo}</h1>
    {carregando && <p className="texto-suave" role="status">Carregando a versão atual...</p>}
    {versao && <p className="texto-suave">Versão vigente: {versao}{dataPublicacao && (' · Publicada em: ' + new Intl.DateTimeFormat('pt-BR').format(new Date(dataPublicacao)))}</p>}
    {erro && <div className="mensagem-erro" role="alert">{erro}<div><button className="btn btn-secondary" type="button" disabled={carregando} onClick={onRecarregar}>Buscar novamente</button></div></div>}
    {children}
    {!carregando && conteudo && <div className="documento-conteudo" role="region" aria-label={titulo}><ConteudoLegal conteudo={conteudo} /></div>}
  </main><Rodape /></div>;
}
