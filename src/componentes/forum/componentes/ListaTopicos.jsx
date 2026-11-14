import PerfilAutor from './PerfilAutor';
import { perfilDoUsuario } from '../hooks/useForum';

function formatarData(valor) {
  if (!valor) return '--/--/----';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '--/--/----';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data);
}

export default function ListaTopicos({ topicos, usuarios, onSelecionar }) {
  if (topicos.length === 0) {
    return <div className="card empty-list">Nenhum tópico encontrado.</div>;
  }

  return (
    <div className="lista-topicos">
      {topicos.map((topico) => (
        <div
          key={topico.id}
          className="card topic-list-item"
          role="button"
          tabIndex={0}
          onKeyDown={(evento) => { if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); onSelecionar(topico); } }}
          onClick={() => onSelecionar(topico)}
        >
          <div className="topic-summary">
            <h3 className="topic-title" title={topico.titulo}>{topico.titulo}</h3>
          </div>
          <div className="topic-meta">
            <div className="meta-group">
              <span className="meta-label">Respostas</span>
              <span className="meta-value">{topico.quantidadeRespostas ?? 0}</span>
            </div>
            <div className="meta-group">
              <span className="meta-label">Autor</span>
              <span className="meta-value">{usuarios.find((usuario) => Number(usuario.id) === Number(topico.idAutor))?.nome ?? topico.nomeAutor}</span>
            </div>
            <PerfilAutor perfil={topico.perfilAutor ?? topico.perfil ?? topico.nomePerfil ?? topico.autor?.perfil ?? topico.autor?.tipoPerfil ?? perfilDoUsuario(usuarios.find((usuario) => Number(usuario.id ?? usuario.idUsuario) === Number(topico.idAutor ?? topico.idUsuario ?? topico.autor?.id ?? topico.autor?.idUsuario)))} />
            <div className="meta-group">
              <span className="meta-label">Criado em</span>
              <span className="meta-value">{formatarData(topico.criadoEm)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
