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
  topico,
  comentarios,
  podeGerenciarTopico,
  podeArquivarTopico = podeApagarTopico,
  podeEditarTopico,
  podeEditarComentario,
  podeApagarTopico,
  podeExcluirComentario,
  onFechar,
  onArquivar,
  onEditarTopico,
  onExcluirTopico,
  onExcluirComentario,
  onEditarComentario,
  textoComentario,
  onMudarComentario,
  onEnviarComentario,
  comentarioEditando,
  onCancelarEdicaoComentario,
  onVoltar
  , desabilitado = false
}) {
  const [confirmacao, setConfirmacao] = useState('');

  async function confirmarAcao() {
    if (confirmacao === 'fechar') await onFechar(topico);
    if (confirmacao === 'arquivar') await onArquivar(topico);
    if (confirmacao === 'apagar') await onExcluirTopico(topico);
    setConfirmacao('');
  }

  return (
    <div className="detalhe-topico">
      <button className="btn btn-link" onClick={onVoltar}>← Voltar para a lista</button>

      <div className="card">
        <div className="post-heading">
          <h3 className="topic-title titulo-detalhe">{topico.titulo}</h3>
          <div className="topic-meta meta-detalhe">
            <div className="meta-group">
              <span className="meta-label">Autor</span>
              <span className="meta-value">{topico.nomeAutor ?? topico.autor?.nome}</span>
            </div>
            <div className="meta-group">
              <span className="meta-label">Perfil</span>
              <span className="meta-value">{topico.perfilAutor ?? topico.perfil ?? topico.nomePerfil ?? topico.autor?.perfil ?? topico.autor?.tipoPerfil ?? 'Não informado'}</span>
            </div>
            <div className="meta-group">
              <span className="meta-label">Publicado em</span>
              <span className="meta-value">{formatarData(topico.criadoEm)}</span>
            </div>
          </div>
          {(podeGerenciarTopico(topico) || podeApagarTopico(topico)) && (
            <div className="acoes-topico">
              {podeEditarTopico(topico) && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => onEditarTopico(topico)}>
                  Editar tópico
                </button>
              )}
              {podeGerenciarTopico(topico) && !topico.fechado && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setConfirmacao('fechar')}>
                  Fechar tópico
                </button>
              )}
              {podeArquivarTopico(topico) && !topico.arquivado && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setConfirmacao('arquivar')}>
                  Arquivar tópico
                </button>
              )}
              {podeApagarTopico(topico) && (
                <button className="btn btn-danger btn-small" type="button" onClick={() => setConfirmacao('apagar')}>
                  Apagar postagem
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

      {!topico.fechado && (
        <FormularioComentario
          texto={textoComentario}
          onMudarTexto={onMudarComentario}
          onEnviar={onEnviarComentario}
          onCancelar={onCancelarEdicaoComentario}
          modoEdicao={Boolean(comentarioEditando)}
          desabilitado={desabilitado}
        />
      )}
      {confirmacao && (
        <ConfirmacaoModal
          titulo={confirmacao === 'fechar' ? 'Fechar tópico' : confirmacao === 'arquivar' ? 'Arquivar tópico' : 'Apagar postagem'}
          mensagem={confirmacao === 'fechar'
            ? 'O tópico não aceitará novas respostas.'
            : confirmacao === 'arquivar' ? 'O tópico será arquivado e sairá da listagem ativa.' : 'Esta ação não poderá ser desfeita.'}
          onConfirmar={confirmarAcao}
          onCancelar={() => setConfirmacao('')}
        />
      )}
    </div>
  );
}