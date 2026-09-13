export default function FormularioComentario({ texto, onMudarTexto, onEnviar, onCancelar, modoEdicao = false }) {
  return (
    <div className="card formulario-comentario">
      <h4 className="subtitulo-formulario">Adicionar Resposta</h4>
      <textarea
        className="input-field"
        style={{ minHeight: '120px' }}
        placeholder="Escreva seu comentário (máx. 5000 caracteres)..."
        value={texto}
        maxLength={5000}
        onChange={(evento) => onMudarTexto(evento.target.value)}
      />
      <div className="rodape-formulario">
        <span className={`contador ${texto.length >= 5000 ? 'limite' : ''}`}>
          {texto.length}/5000
        </span>
        <div className="acoes-formulario">
          {modoEdicao && <button className="btn btn-link" type="button" onClick={onCancelar}>Cancelar</button>}
          <button className="btn btn-primary" onClick={onEnviar}>{modoEdicao ? 'Salvar alterações' : 'Responder'}</button>
        </div>
      </div>
    </div>
  );
}