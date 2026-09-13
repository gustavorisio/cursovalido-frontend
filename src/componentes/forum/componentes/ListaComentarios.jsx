import { useState } from 'react';
import ConfirmacaoModal from './ConfirmacaoModal';

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
  const [confirmando, setConfirmando] = useState(null);

  async function excluir(comentario) {
    await onExcluir(comentario);
    setConfirmando(null);
  }

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
              <button className="btn btn-danger btn-small" type="button" onClick={() => setConfirmando(comentario.id)}>
                Apagar
              </button>
            )}
          </div>
          <p className="content-text">{comentario.conteudo}</p>
          {confirmando === comentario.id && (
            <ConfirmacaoModal
              titulo="Apagar comentário"
              mensagem="Esta ação não poderá ser desfeita."
              onConfirmar={() => excluir(comentario)}
              onCancelar={() => setConfirmando(null)}
            />
          )}
        </div>
      ))}
    </>
  );
}