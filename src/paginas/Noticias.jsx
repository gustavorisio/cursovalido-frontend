import { useConsultaNoticia } from '../componentes/noticias/useConsultaNoticia';
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { listarNoticias } from '../servicos/servicoNoticias';
import { DataNoticia, EstadoNoticias, LayoutNoticias } from '../componentes/noticias/componentes';

function CardNoticia({ noticia, destaque = false, indice }) {
  return <article className={`noticia-card ${destaque ? 'noticia-destaque' : ''}`}>
    <div className="noticia-meta"><span>{destaque ? 'Em destaque · mais recente' : 'Tecnologia'}</span><DataNoticia valor={noticia.criadoEm} /></div>
    <h2><Link to={`/noticias/${noticia.id}`}>{noticia.titulo}</Link></h2>
    <p className="noticia-resumo">{noticia.conteudo.slice(0, destaque ? 320 : 160)}{noticia.conteudo.length > (destaque ? 320 : 160) ? '…' : ''}</p>
    <div className="noticia-base"><Link to={`/noticias/${noticia.id}`} aria-label={`Ler notícia: ${noticia.titulo}`}>Ler notícia <span aria-hidden="true">↗</span></Link><span aria-hidden="true">{String(indice + 1).padStart(2, '0')}</span></div>
  </article>;
}

function ListaNoticias({ pagina, busca, mudarPagina }) {
  const carregar = useCallback(() => listarNoticias({ pagina, busca }), [pagina, busca]);
  const consulta = useConsultaNoticia(carregar);
  return <EstadoNoticias consulta={consulta}>{(noticias) => <>
    {!noticias.length ? <div className="noticias-estado"><h2>{busca ? 'Nenhuma notícia encontrada' : 'Nenhuma notícia por aqui'}</h2><p>{busca ? 'Experimente outro termo de busca.' : 'As próximas notícias de tecnologia aparecerão aqui.'}</p></div> : <>
      <div className="noticias-mosaico">{noticias.slice(0, 5).map((noticia, indice) => <CardNoticia key={noticia.id} noticia={noticia} indice={pagina * 12 + indice} destaque={indice === 0} />)}</div>
      {noticias.length > 5 && <section className="noticias-continuar"><div className="noticias-subtitulo"><span className="noticias-etiqueta">CONTINUE EXPLORANDO</span><h2>Mais para ler</h2><p>Mais notícias sobre o mundo da tecnologia.</p></div><div className="noticias-lista">{noticias.slice(5).map((noticia, indice) => <article key={noticia.id}><span className="noticia-numero" aria-hidden="true">{String(pagina * 12 + indice + 6).padStart(2, '0')}</span><div><DataNoticia valor={noticia.criadoEm} /><h3><Link to={`/noticias/${noticia.id}`}>{noticia.titulo}</Link></h3><p>{noticia.conteudo.slice(0, 130)}{noticia.conteudo.length > 130 ? '…' : ''}</p></div><Link to={`/noticias/${noticia.id}`} aria-label={`Ler notícia: ${noticia.titulo}`}>↗</Link></article>)}</div></section>}
    </>}
    <nav className="noticias-paginacao" aria-label="Páginas de notícias"><button type="button" className="btn btn-secondary" disabled={pagina === 0} onClick={() => mudarPagina(pagina - 1)}>← Anterior</button><span aria-live="polite">Página {pagina + 1}</span><button type="button" className="btn btn-secondary" disabled={noticias.length < 12} onClick={() => mudarPagina(pagina + 1)}>Próxima →</button></nav>
  </>}</EstadoNoticias>;
}

export default function Noticias() {
  const { sessao } = useAutenticacao();
  const [parametros, setParametros] = useSearchParams();
  const busca = parametros.get('busca') ?? '';
  const numeroPagina = Number(parametros.get('pagina') ?? 0);
  const pagina = Number.isSafeInteger(numeroPagina) && numeroPagina >= 0 ? numeroPagina : 0;
  const [textoBusca, setTextoBusca] = useState(busca);
  return <LayoutNoticias>

    <div className="noticias-barra"><h1>Noticias - Últimas publicações</h1>{sessao?.perfil === 'ADMINISTRADOR' && <Link className="btn btn-primary" to="/noticias/nova">Publicar notícia +</Link>}<form role="search" onSubmit={(evento) => { evento.preventDefault(); setParametros(textoBusca.trim() ? { busca: textoBusca.trim() } : {}); }}><label className="sr-only" htmlFor="buscar-noticias">Buscar notícias</label><input id="buscar-noticias" type="search" maxLength={255} placeholder="Busque uma notícia…" value={textoBusca} onChange={(evento) => setTextoBusca(evento.target.value)} /><button type="submit" className="btn btn-secondary">Buscar</button>{busca && <button type="button" className="btn btn-secondary" onClick={() => { setTextoBusca(''); setParametros({}); }}>Limpar</button>}</form></div>
    {busca && <p className="texto-suave">Resultados para “{busca}”</p>}
    <ListaNoticias key={`${pagina}:${busca}`} pagina={pagina} busca={busca} mudarPagina={(valor) => setParametros({ ...(busca ? { busca } : {}), pagina: String(valor) })} />
  </LayoutNoticias>;
}

