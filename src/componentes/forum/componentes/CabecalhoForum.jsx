import { Link } from 'react-router-dom';

export default function CabecalhoForum({ usuarios, usuarioAtual, onMudarUsuario }) {
  return (
    <header className="header">
      <Link className="brand-link" to="/">curso.valido.dev</Link>
      <nav className="nav-group">
        <Link className="nav-link" to="/">Início</Link>
        <Link className="nav-link active" to="/forum">Fórum</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
          <span style={{ color: '#aaa', fontSize: '12px' }}>Usuário -</span>
          <select
            className="user-select"
            value={usuarioAtual.id}
            onChange={(evento) => onMudarUsuario(Number(evento.target.value))}
          >
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>
            ))}
          </select>
        </div>
      </nav>
    </header>
  );
}