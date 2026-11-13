
import Rodape from '../comuns/Rodape';
import './noticias.css';

export function LayoutNoticias({ children }) {
  return <div className="app-container pagina-noticias"><main className="main-content noticias-container">{children}</main><Rodape /></div>;
}

export function DataNoticia({ valor }) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : <time dateTime={valor}>{data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</time>;
}

export function EstadoNoticias({ consulta, children }) {
  if (consulta.carregando) return <p className="noticias-estado" role="status">Carregando notícias...</p>;
  if (consulta.erro) return <div className="mensagem-erro" role="alert">{consulta.erro}<div><button className="btn btn-secondary" type="button" onClick={consulta.repetir}>Tentar novamente</button></div></div>;
  return children(consulta.dados);
}
