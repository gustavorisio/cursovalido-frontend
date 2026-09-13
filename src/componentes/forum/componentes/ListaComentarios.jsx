function formatarData(valor) {
  if (!valor) return '--/--/----';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '--/--/----';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

export default function ListaComentarios({ comentarios, podeExcluir, podeEditar, onExcluir, onEditar }) {
  return (
    <>
      {comentarios.map((comentario) => (
        <div key={comentario.id} className="card comment-card">
          <div className="topic-meta comment-header">
            <div className="meta-group">
              <span className="meta-label">Autor</span>
              <span className="meta-value">{comentario.nomeAutor}</span>
            </div>
            <div className="meta-group">
              <span className="meta-label">Respondido em</span>
              <span className="meta-value">{formatarData(comentario.criadoEm)}</span>
            </div>
            {comentario.ativo !== false && podeEditar(comentario) && (
              <button className="btn btn-secondary btn-small" type="button" onClick={() => onEditar(comentario)}>
                Editar
              </button>
            )}
            {comentario.ativo !== false && podeExcluir(comentario) && (
              <button className="btn btn-danger btn-small" type="button" onClick={() => onExcluir(comentario)}>
                Apagar
              </button>
            )}
          </div>
          <p className="content-text">
            {comentario.ativo === false ? 'mensagem apagada' : comentario.conteudo}
          </p>
        </div>
      ))}
    </>
  );
}