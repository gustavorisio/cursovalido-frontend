import { Link } from 'react-router-dom';

export default function Rodape() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Curso Válido</strong>
        <span className="footer-creditos">Projeto Final de Curso · Engenharia de Software · UMC</span>
      </div>
      <nav aria-label="Links legais e suporte">
        <Link to="/suporte">Suporte</Link>
        <Link to="/termos-aceite.html">Termos de Aceite</Link>
        <Link to="/politica-privacidade.html">Política de Privacidade</Link>
      </nav>
    </footer>
  );
}
