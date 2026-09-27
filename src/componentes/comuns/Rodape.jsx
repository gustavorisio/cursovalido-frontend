import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AutenticacaoContexto } from '../../contextos/contextoBaseAutenticacao';

export default function Rodape() {
  const contexto = useContext(AutenticacaoContexto);
  const autenticado = Boolean(contexto?.autenticado);

  return (
    <footer className="site-footer">
      <div>
        <strong>Curso Válido</strong>
        <span className="footer-creditos">Projeto Final de Curso · Engenharia de Software · UMC</span>
      </div>
      <nav aria-label="Links legais">
        {!autenticado && <Link to="/">Início</Link>}
        <Link to="/termos-aceite.html">Termos de Aceite</Link>
        <Link to="/politica-privacidade.html">Política de Privacidade</Link>
        {!autenticado && <Link to="/login">Login</Link>}
        {!autenticado && <Link to="/cadastro">Cadastro</Link>}
      </nav>
    </footer>
  );
}
