export default function FormularioTopico({ titulo, descricao, onMudarTitulo, onMudarDescricao, onPublicar, onCancelar, modoEdicao = false }) {
  return (
    <div className="formulario-container">
      <button className="btn btn-link" onClick={onCancelar}>Cancelar</button>

      <div className="card">
        <input
          type="text"
          className="input-field"
          placeholder="Título da postagem"
          aria-label="Título da postagem"
          aria-describedby="limite-titulo-topico"
          maxLength={40}
          value={titulo}
          onChange={(evento) => onMudarTitulo(evento.target.value)}
        />
        <p id="limite-titulo-topico" className={`contador ${titulo.length >= 40 ? 'limite' : ''}`}>
          {titulo.length}/40 caracteres{titulo.length >= 40 && <span role="status"> · Limite máximo alcançado</span>}
        </p>
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
