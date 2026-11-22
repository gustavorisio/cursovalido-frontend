import { censurarConteudo } from '../../../servicos/filtroConteudo';

export default function FormularioComentario({ texto, onMudarTexto, onEnviar, onCancelar, modoEdicao = false, desabilitado = false }) {
  return (
    <div className={`card formulario-comentario ${modoEdicao ? 'm-0 border-0 p-0 shadow-none' : ''}`}>
      <h4 className="subtitulo-formulario">{modoEdicao ? 'Editar comentário' : 'Adicionar resposta'}</h4>
      <textarea
        className="input-field" disabled={desabilitado}
        style={{ minHeight: '120px' }}
        placeholder="Escreva seu comentário (máx. 5000 caracteres)..."
        value={texto}
        maxLength={5000}
        onChange={(evento) => onMudarTexto(evento.target.value)}
        onBlur={() => onMudarTexto(censurarConteudo(texto))}
      />
      <p className="texto-suave">Palavras ofensivas serão substituídas por ***. Aguarde 20 segundos entre novos comentários.</p>
      <div className="rodape-formulario">
        <span className={`contador ${texto.length >= 5000 ? 'limite' : ''}`}>
          {texto.length}/5000{texto.length >= 5000 && <span role="status"> · Limite máximo alcançado</span>}
        </span>
        <div className="acoes-formulario">
          {modoEdicao && <button className="btn btn-link" type="button" disabled={desabilitado} onClick={onCancelar}>Cancelar</button>}
          <button className="btn btn-primary" disabled={desabilitado} onClick={onEnviar}>{desabilitado ? 'Aguarde...' : modoEdicao ? 'Salvar alterações' : 'Responder'}</button>
        </div>
      </div>
    </div>
  );
}
