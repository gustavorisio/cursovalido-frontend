import PerfilAutor from './PerfilAutor';
import { useRef, useState } from 'react';
import ConfirmacaoModal from './ConfirmacaoModal';
import FormularioComentario from './FormularioComentario';
import FormularioDenuncia from './FormularioDenuncia';

function formatarData(valor) {
  if (!valor) return '--/--/----';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '--/--/----';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

export default function ListaComentarios({ comentarios, podeExcluir, podeEditar, onExcluir, onEditar, comentarioEditando, textoComentario, onMudarComentario, onSalvarEdicao, onCancelarEdicao, desabilitado = false, autenticado = false, idUsuario, onDenunciar }) {
  const [confirmando, setConfirmando] = useState(null);
  const [denunciaAberta, setDenunciaAberta] = useState(null);

  const [excluindo, setExcluindo] = useState(false);
  const exclusaoEmAndamento = useRef(false);

  async function excluir(comentario) {
    if (exclusaoEmAndamento.current) return;
    exclusaoEmAndamento.current = true;
    setExcluindo(true);
    try {
      await onExcluir(comentario);
      setConfirmando(null);
    } finally {
      exclusaoEmAndamento.current = false;
      setExcluindo(false);
    }
  }

  return (
    <>
      {comentarios.map((comentario) => (
        <div key={comentario.id} className="card comment-card">
          {Number(comentarioEditando?.id) === Number(comentario.id) ? <FormularioComentario
            texto={textoComentario}
            onMudarTexto={onMudarComentario}
            onEnviar={onSalvarEdicao}
            onCancelar={onCancelarEdicao}
            modoEdicao
            desabilitado={desabilitado}
          /> : <>
          <div className="topic-meta comment-header">
            <div className="meta-group">
              <span className="meta-label">Autor</span>
              <span className="meta-value">{comentario.nomeAutor ?? comentario.autor?.nome}</span>
            </div>
            {comentario.gamertagAutor && <div className="meta-group"><span className="meta-label">Gamertag</span><span className="meta-value">{comentario.gamertagAutor}</span></div>}
            <PerfilAutor perfil={comentario.papelAutor ?? comentario.perfilAutor ?? comentario.perfil ?? comentario.nomePerfil ?? comentario.autor?.perfil ?? comentario.autor?.tipoPerfil} />
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
            {autenticado && idUsuario != null && comentario.ativo !== false && (comentario.idAutor ?? comentario.autor?.id ?? comentario.autor?.idUsuario) != null && Number(comentario.idAutor ?? comentario.autor?.id ?? comentario.autor?.idUsuario) !== Number(idUsuario) && <button className="btn btn-secondary btn-small" type="button" onClick={() => setDenunciaAberta(denunciaAberta === comentario.id ? null : comentario.id)} aria-expanded={denunciaAberta === comentario.id}>Denunciar</button>}
          </div>
          <p className={`content-text ${comentario.ativo === false ? 'texto-suave' : ''}`}>
            {comentario.ativo === false ? 'Esta mensagem foi excluída.' : comentario.conteudo}
          </p>
          {denunciaAberta === comentario.id && <FormularioDenuncia aoEnviar={(dados) => onDenunciar('COMENTARIO', comentario.id, dados)} aoCancelar={() => setDenunciaAberta(null)} desabilitado={desabilitado} />}
          </>}
          {confirmando === comentario.id && (
            <ConfirmacaoModal
              titulo="Apagar comentário"
              mensagem="Esta ação não poderá ser desfeita."
              processando={excluindo}
              onConfirmar={() => excluir(comentario)}
              onCancelar={() => setConfirmando(null)}
            />
          )}
        </div>
      ))}
    </>
  );
}
