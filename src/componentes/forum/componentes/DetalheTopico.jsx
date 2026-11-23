import ControlesPaginacao from '../../comuns/ControlesPaginacao';
import { censurarConteudo } from '../../../servicos/filtroConteudo';
import PerfilAutor from './PerfilAutor';
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import ConfirmacaoModal from './ConfirmacaoModal';
import FormularioComentario from './FormularioComentario';
import ListaComentarios from './ListaComentarios';
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
  , mensagemBloqueio = null
  , desabilitado = false
  , idUsuario = null
  , onDenunciar
  , paginaComentarios = 0
  , totalPaginasComentarios = 1
  , totalComentarios = comentarios.length
  , carregandoComentarios = false
  , onMudarPaginaComentarios
}) {
  const [confirmacao, setConfirmacao] = useState('');
  const [denunciaAberta, setDenunciaAberta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const acaoEmAndamento = useRef(false);

  async function confirmarAcao() {
    if (confirmando || acaoEmAndamento.current) return;
    acaoEmAndamento.current = true; setConfirmando(true);
    try {
      if (confirmacao === 'fechar') await onFechar(topico);
      else await onArquivar(topico);
      setConfirmacao('');
    } finally {
      acaoEmAndamento.current = false; setConfirmando(false);
    }
  }

  return (
    <div className="detalhe-topico">
      <button className="btn btn-link" onClick={onVoltar}>Voltar para a lista</button>

      <div className="card">
        <div className="post-heading">
          <h3 className="topic-title titulo-detalhe">{censurarConteudo(topico.titulo)}</h3>
          <div className="topic-meta meta-detalhe">
            <div className="meta-group">
              <span className="meta-label">Autor</span>
              <span className="meta-value">{topico.nomeAutor ?? topico.autor?.nome}</span>
            </div>
            {topico.gamertagAutor && <div className="meta-group"><span className="meta-label">Gamertag</span><span className="meta-value">{topico.gamertagAutor}</span></div>}
            <PerfilAutor perfil={topico.papelAutor ?? topico.perfilAutor ?? topico.perfil ?? topico.nomePerfil ?? topico.autor?.perfil ?? topico.autor?.tipoPerfil} />
            <div className="meta-group">
              <span className="meta-label">Publicado em</span>
              <span className="meta-value">{formatarData(topico.criadoEm)}</span>
            </div>
          </div>
          {(podeGerenciarTopico(topico) || podeEditarTopico(topico)) && (
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
              {podeGerenciarTopico(topico) && !topico.arquivado && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setConfirmacao('arquivar')}>
                  Arquivar tópico
                </button>
              )}
            </div>
          )}
          {autenticado && idUsuario != null && (topico.idAutor ?? topico.autor?.id ?? topico.autor?.idUsuario) != null && Number(topico.idAutor ?? topico.autor?.id ?? topico.autor?.idUsuario) !== Number(idUsuario) && <button className="btn btn-secondary btn-small" type="button" onClick={() => setDenunciaAberta((aberta) => !aberta)} aria-expanded={denunciaAberta}>Denunciar tópico</button>}
        </div>
        <p className="content-text">{censurarConteudo(topico.descricao)}</p>
        {denunciaAberta && <FormularioDenuncia aoEnviar={(dados) => onDenunciar('TOPICO', topico.id, dados)} aoCancelar={() => setDenunciaAberta(false)} desabilitado={desabilitado} />}
        {topico.fechado && <p className="aviso-fechado">Este tópico está fechado para novas respostas.</p>}
      </div>

      <h4 className="titulo-respostas">Respostas ({totalComentarios})</h4>
      <ListaComentarios
        comentarios={comentarios}
        podeExcluir={podeExcluirComentario}
        podeEditar={podeEditarComentario}
        onExcluir={onExcluirComentario}
        onEditar={onEditarComentario}
        comentarioEditando={comentarioEditando}
        textoComentario={textoComentario}
        onMudarComentario={onMudarComentario}
        onSalvarEdicao={onEnviarComentario}
        onCancelarEdicao={onCancelarEdicaoComentario}
        desabilitado={desabilitado || carregandoComentarios}
        autenticado={autenticado}
        idUsuario={idUsuario}
        onDenunciar={onDenunciar}
      />

      <ControlesPaginacao pagina={paginaComentarios} total={totalPaginasComentarios} rotulo="Páginas de respostas"
        desabilitada={desabilitado || carregandoComentarios}
        onAnterior={() => onMudarPaginaComentarios(paginaComentarios - 1)}
        onProxima={() => onMudarPaginaComentarios(paginaComentarios + 1)} />
      {carregandoComentarios && <p className="texto-suave" role="status">Carregando respostas...</p>}

      {!comentarioEditando && (!autenticado ? <p className="card">Faça login para responder e participar. <Link to="/login">Entrar</Link></p> : comentariosBloqueados ? <p className="mensagem-erro" role="status">{mensagemBloqueio || 'Você está temporária ou permanentemente impedido de enviar comentários. Consulte a restrição no cabeçalho.'}</p> : !topico.fechado ? (
        <FormularioComentario
          texto={textoComentario}
          onMudarTexto={onMudarComentario}
          onEnviar={onEnviarComentario}
          desabilitado={desabilitado}
        />
      ) : null)}
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
