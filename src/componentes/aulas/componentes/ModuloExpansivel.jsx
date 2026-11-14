export default function ModuloExpansivel({ modulo, expandido = false, children }) {
  return <details className="card aulas-modulo aulas-modulo-expansivel" open={expandido || undefined}>
    <summary className="aulas-modulo-cabecalho">
      <span className="aulas-numero">{String(modulo.ordem).padStart(2, '0')}</span>
      <div><span className="aulas-etiqueta">Módulo{modulo.aulas ? ` · ${modulo.aulas.length} aulas` : ''}</span><h2 className="topic-title">{modulo.titulo}</h2></div>
      <span className="aulas-modulo-acao"><span className="aulas-modulo-abrir">Ver conteúdo</span><span className="aulas-modulo-fechar">Ocultar conteúdo</span></span>
    </summary>
    <div className="aulas-modulo-conteudo">{children}</div>
  </details>;
}
