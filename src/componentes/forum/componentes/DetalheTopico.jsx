import PerfilAutor from './PerfilAutor';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ConfirmacaoModal from './ConfirmacaoModal';
import FormularioComentario from './FormularioComentario';
import ListaComentarios from './ListaComentarios';

function formatarData(valor) {
  if (!valor) return '--/--/----';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '--/--/----';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

export default function DetalheTopico({
  autenticado = true,
  topico,
  comentarios,
  podeGerenciarTopico,
  podeEditarTopico,
  podeEditarComentario,
  podeExcluirComentario,
  onFechar,
  onArquivar,
  onEditarTopico,
  onExcluirComentario,
  onEditarComentario,
  textoComentario,
  onMudarComentario,
  onEnviarComentario,
  comentarioEditando,
  onCancelarEdicaoComentario,
  onVoltar
  , comentariosBloqueados = false
  , desabilitado = false
}) {
  const [confirmacao, setConfirmacao] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  async function confirmarAcao() {
    if (confirmando) return;
    setConfirmando(true);
    try {
      if (confirmacao === 'fechar') await onFechar(topico);
      else await onArquivar(topico);
      setConfirmacao('');
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="detalhe-topico">
      <button className="btn btn-link" onClick={onVoltar}>Voltar para a lista</button>

      <div className="card">
        <div className="post-heading">
          <h3 className="topic-title titulo-detalhe">{topico.titulo}</h3>
          <div className="topic-meta meta-detalhe">
            <div className="meta-group">
              <span className="meta-label">Autor</span>
              <span className="meta-value">{topico.nomeAutor ?? topico.autor?.nome}</span>
            </div>
            <PerfilAutor perfil={topico.perfilAutor ?? topico.perfil ?? topico.nomePerfil ?? topico.autor?.perfil ?? topico.autor?.tipoPerfil} />
            <div className="meta-group">
              <span className="meta-label">Publicado em</span>
              <span className="meta-value">{formatarData(topico.criadoEm)}</span>
            </div>
          </div>
          {podeGerenciarTopico(topico) && (
            <div className="acoes-topico">
              {podeEditarTopico(topico) && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => onEditarTopico(topico)}>
                  Editar tópico
                </button>
              )}
              {!topico.fechado && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setConfirmacao('fechar')}>
                  Fechar tópico
                </button>
              )}
              {!topico.arquivado && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setConfirmacao('arquivar')}>
                  Arquivar tópico
                </button>
              )}
            </div>
          )}
        </div>
        <p className="content-text">{topico.descricao}</p>
        {topico.fechado && <p className="aviso-fechado">Este tópico está fechado para novas respostas.</p>}
      </div>

      <h4 className="titulo-respostas">Respostas ({comentarios.length})</h4>
      <ListaComentarios
        comentarios={comentarios}
        podeExcluir={podeExcluirComentario}
        podeEditar={podeEditarComentario}
        onExcluir={onExcluirComentario}
        onEditar={onEditarComentario}
      />

      {!autenticado ? <p className="card">Faça login para responder e participar. <Link to="/login">Entrar</Link></p> : comentariosBloqueados ? <p className="mensagem-erro" role="status">Você está temporária ou permanentemente impedido de enviar comentários. Consulte a restrição no cabeçalho.</p> : !topico.fechado ? (
        <FormularioComentario
          texto={textoComentario}
          onMudarTexto={onMudarComentario}
          onEnviar={onEnviarComentario}
          onCancelar={onCancelarEdicaoComentario}
          modoEdicao={Boolean(comentarioEditando)}
          desabilitado={desabilitado}
        />
      ) : null}
      {confirmacao && (
        <ConfirmacaoModal
          titulo={confirmacao === 'fechar' ? 'Fechar tópico' : 'Arquivar tópico'}
          mensagem={confirmacao === 'fechar'
            ? 'O tópico não aceitará novas respostas.'
            : 'O tópico sairá da listagem e ficará arquivado permanentemente.'}
          processando={confirmando}
          onConfirmar={confirmarAcao}
          onCancelar={() => setConfirmacao('')}
        />
      )}
    </div>
  );
}
