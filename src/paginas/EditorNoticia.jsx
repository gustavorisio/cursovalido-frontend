import { useConsultaNoticia } from '../componentes/noticias/useConsultaNoticia';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { buscarNoticia, criarNoticia, editarNoticia } from '../servicos/servicoNoticias';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { EstadoNoticias, LayoutNoticias } from '../componentes/noticias/componentes';

export default function EditorNoticia() {
  const { id } = useParams();
  return <LayoutNoticias><Link className="noticias-voltar" to={id ? `/noticias/${id}` : '/noticias'}>← Voltar às notícias</Link>{id ? <CarregarEdicao key={id} id={id} /> : <FormularioNoticia />}</LayoutNoticias>;
}

function CarregarEdicao({ id }) {
  const carregar = useCallback(() => buscarNoticia(id), [id]);
  const consulta = useConsultaNoticia(carregar);
  const { sessao } = useAutenticacao();
  return <EstadoNoticias consulta={consulta}>{(noticia) => String(noticia.idAutor) === String(sessao?.idUsuario) ? <FormularioNoticia noticia={noticia} /> : <p className="mensagem-erro" role="alert">Somente o autor pode editar esta notícia.</p>}</EstadoNoticias>;
}

function FormularioNoticia({ noticia }) {
  const navegar = useNavigate();
  const [titulo, setTitulo] = useState(noticia?.titulo ?? '');
  const [conteudo, setConteudo] = useState(noticia?.conteudo ?? '');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  async function salvar(evento) {
    evento.preventDefault();
    if (processando) return;
    if (!titulo.trim() || !conteudo.trim()) { setErro('Preencha título e conteúdo.'); return; }
    setProcessando(true); setErro('');
    try {
      const dados = { titulo: titulo.trim(), conteudo: conteudo.trim() };
      const resultado = noticia ? await editarNoticia(noticia.id, dados) : await criarNoticia(dados);
      navegar(`/noticias/${resultado.id}`, { replace: true });
    } catch (falha) { setErro(falha.message); setProcessando(false); }
  }
  return <section className="noticia-editor"><span className="noticias-etiqueta">ESPAÇO DA REDAÇÃO</span><h1>{noticia ? 'Editar notícia' : 'Uma novidade para compartilhar'}</h1><p className="texto-suave">Escreva uma publicação para a comunidade Curso Válido.</p>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    <form onSubmit={salvar} className="formulario-publico" aria-busy={processando}><label>Título<input required maxLength={255} value={titulo} onChange={(evento) => setTitulo(evento.target.value)} disabled={processando} /></label><label>Conteúdo<textarea required maxLength={30000} rows={18} value={conteudo} onChange={(evento) => setConteudo(evento.target.value)} disabled={processando} /></label><p className="texto-suave">{conteudo.length.toLocaleString('pt-BR')} / 30.000 caracteres · Texto simples, com quebras de linha preservadas.</p><div className="noticias-acoes"><button type="submit" className="btn btn-primary" disabled={processando}>{processando ? 'Salvando...' : noticia ? 'Salvar alterações' : 'Publicar notícia'}</button><Link className="btn btn-secondary" to={noticia ? `/noticias/${noticia.id}` : '/noticias'}>Cancelar</Link></div></form>
  </section>;
}

