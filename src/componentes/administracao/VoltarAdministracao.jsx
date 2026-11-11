import { Link } from 'react-router-dom';

export default function VoltarAdministracao() {
  return <nav className="administracao-retorno" aria-label="Retorno à administração">
    <Link className="btn btn-secondary btn-small" to="/administracao">← Voltar à administração</Link>
  </nav>;
}
