import { censurarConteudo } from '../../../servicos/filtroConteudo';

export default function FormularioTopico({ titulo, descricao, onMudarTitulo, onMudarDescricao, onPublicar, onCancelar, modoEdicao = false, desabilitado = false }) {
  return (
    <div className="formulario-container">
      <button className="btn btn-link" disabled={desabilitado} onClick={onCancelar}>Cancelar</button>

      <div className="card">
        <input
          type="text"
          className="input-field" disabled={desabilitado}
          placeholder="Título da postagem"
          aria-label="Título da postagem"
          aria-describedby="limite-titulo-topico"
          maxLength={80}
          value={titulo}
          onChange={(evento) => onMudarTitulo(evento.target.value)}
          onBlur={() => onMudarTitulo(censurarConteudo(titulo))}
        />
        <p id="limite-titulo-topico" className={`contador ${titulo.length >= 80 ? 'limite' : ''}`}>
          {titulo.length}/80 caracteres{titulo.length >= 80 && <span role="status"> · Limite máximo alcançado</span>}
        </p>
        <textarea
          className="input-field" disabled={desabilitado}
          placeholder="Escreva a descrição detalhada do seu tópico..."
          value={descricao}
          maxLength={5000}
          onChange={(evento) => onMudarDescricao(evento.target.value)}
          onBlur={() => onMudarDescricao(censurarConteudo(descricao))}
        />
        <div className={`contador ${descricao.length >= 5000 ? 'limite' : ''}`}>
          {descricao.length}/5000{descricao.length >= 5000 && <span role="status"> · Limite máximo alcançado</span>}
        </div>
        <p className="texto-suave">Palavras ofensivas serão substituídas por ***. Você pode criar um novo tópico a cada 3 minutos.</p>
        <div className="acoes-formulario">
          <button className="btn btn-primary" disabled={desabilitado} onClick={onPublicar}>{desabilitado ? 'Aguarde...' : modoEdicao ? 'Salvar alterações' : 'Publicar'}</button>
        </div>
      </div>
    </div>
  );
}
