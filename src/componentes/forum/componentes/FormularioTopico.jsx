export default function FormularioTopico({ titulo, descricao, onMudarTitulo, onMudarDescricao, onPublicar, onCancelar, modoEdicao = false }) {
  return (
    <div className="formulario-container">
      <button className="btn btn-link" onClick={onCancelar}>← Cancelar</button>

      <div className="card">
        <input
          type="text"
          className="input-field"
          placeholder="Título da postagem"
          maxLength={255}
          value={titulo}
          onChange={(evento) => onMudarTitulo(evento.target.value)}
        />
        {titulo.length >= 255 && <p className="contador limite" role="status">Limite máximo alcançado</p>}
        <textarea
          className="input-field"
          placeholder="Escreva a descrição detalhada do seu tópico..."
          value={descricao}
          maxLength={5000}
          onChange={(evento) => onMudarDescricao(evento.target.value)}
        />
        <div className={`contador ${descricao.length >= 5000 ? 'limite' : ''}`}>
          {descricao.length}/5000{descricao.length >= 5000 && <span role="status"> · Limite máximo alcançado</span>}
        </div>
        <div className="acoes-formulario">
          <button className="btn btn-primary" onClick={onPublicar}>{modoEdicao ? 'Salvar alterações' : 'Publicar'}</button>
        </div>
      </div>
    </div>
  );
}