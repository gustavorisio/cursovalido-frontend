import { Link, useLocation } from 'react-router-dom';

export default function Rodape({ onDocumento } = {}) {
  const localizacao = useLocation();
  const emDocumento = /termos-aceite|politica-privacidade/.test(localizacao.pathname);
  const estado = { retornoDocumentos: emDocumento ? localizacao.state?.retornoDocumentos || '/' : localizacao.pathname + localizacao.search };
  return (
    <footer className="site-footer">
      <div>
        <strong>Curso Válido</strong>
        <span className="footer-creditos">Projeto Final de Curso · Engenharia de Software · UMC</span>
      </div>
      <nav aria-label="Links legais e suporte">
        <Link to="/suporte">Suporte</Link>
        <Link to="/termos-aceite.html" replace={emDocumento} state={estado} onClick={onDocumento ? evento => { evento.preventDefault(); onDocumento('termos'); } : undefined}>Termos de Aceite</Link>
        <Link to="/politica-privacidade.html" replace={emDocumento} state={estado} onClick={onDocumento ? evento => { evento.preventDefault(); onDocumento('privacidade'); } : undefined}>Política de Privacidade</Link>
      </nav>
    </footer>
  );
}
