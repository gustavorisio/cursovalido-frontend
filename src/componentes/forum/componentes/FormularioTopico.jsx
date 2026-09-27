export default function FormularioTopico({ titulo, descricao, onMudarTitulo, onMudarDescricao, onPublicar, onCancelar, modoEdicao = false, desabilitado = false }) {
  return (
    <div className="formulario-container">
      <button className="btn btn-link" disabled={desabilitado} onClick={onCancelar}>← Cancelar</button>

      <div className="card">
        <input
          type="text"
          className="input-field"
          placeholder="Título da postagem"
          value={titulo}
          onChange={(evento) => onMudarTitulo(evento.target.value)}
        />
        <textarea
          className="input-field"
          placeholder="Escreva a descrição detalhada do seu tópico..."
          value={descricao}
          maxLength={5000}
          onChange={(evento) => onMudarDescricao(evento.target.value)}
        />
        <div className={`contador ${descricao.length >= 5000 ? 'limite' : ''}`}>
          {descricao.length}/5000
        </div>
        <div className="acoes-formulario">
          <button className="btn btn-primary" disabled={desabilitado} onClick={onPublicar}>{desabilitado ? 'Salvando...' : modoEdicao ? 'Salvar alterações' : 'Publicar'}</button>
        </div>
      </div>
    </div>
  );
}