export default function ConfirmacaoModal({ titulo, mensagem, onConfirmar, onCancelar }) {
  return (
    <div className="modal-fundo" role="presentation" onClick={onCancelar}>
      <div
        className="modal-caixa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h3 id="modal-titulo">{titulo}</h3>
        <p>{mensagem}</p>
        <div className="modal-acoes">
          <button className="btn btn-secondary" type="button" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn btn-danger" type="button" onClick={onConfirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
