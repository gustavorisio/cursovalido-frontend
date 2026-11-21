export default function CabecalhoPagina({ titulo, descricao, etiqueta, acoes, children, className = '' }) {
  return <header className={`page-header ${className}`}>
    <div className="page-header-content">
      <h1 className="page-title">{titulo}</h1>
      {etiqueta && <span className="page-eyebrow">{etiqueta}</span>}
      {descricao && <p className="page-description">{descricao}</p>}
      {children}
    </div>
    {acoes && <div className="page-actions">{acoes}</div>}
  </header>;
}
