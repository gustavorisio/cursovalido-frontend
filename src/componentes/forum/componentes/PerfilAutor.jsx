export default function PerfilAutor({ perfil }) {
  const nome = typeof perfil === 'object' && perfil !== null
    ? perfil.nome ?? perfil.descricao ?? perfil.codigo
    : perfil;
  if (typeof nome !== 'string' || !nome.trim()) return null;

  return <div className="meta-group">
    <span className="meta-label">Perfil</span>
    <span className="meta-value">{nome}</span>
  </div>;
}
