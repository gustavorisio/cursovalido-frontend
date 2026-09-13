function formatarData(valor) {
  if (!valor) return '--/--/----';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '--/--/----';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

export default function ListaTopicos({ topicos, usuarios, onSelecionar }) {
  if (topicos.length === 0) {
    return <div className="card empty-list">Nenhum tópico encontrado.</div>;
  }

  return (
    <div className="lista-topicos">
      {topicos.map((topico) => (
        <div
          key={topico.id}
          className="card topic-list-item"
          onClick={() => onSelecionar(topico)}
        >
          <div className="topic-summary">
            <h3 className="topic-title">{topico.titulo}</h3>
            <p className="topic-preview">{topico.descricao}</p>
          </div>

          <div className="topic-meta">
            <div className="meta-group">
              <span className="meta-label">Respostas</span>
              <span className="meta-value">{topico.quantidadeRespostas ?? 0}</span>
            </div>
            <div className="meta-group">
              <span className="meta-label">Autor</span>
              <span className="meta-value">
                {usuarios.find((usuario) => Number(usuario.id) === Number(topico.idAutor))?.nome ?? topico.nomeAutor}
              </span>
            </div>
            <div className="meta-group">
              <span className="meta-label">Criado em</span>
              <span className="meta-value">{formatarData(topico.criadoEm)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}