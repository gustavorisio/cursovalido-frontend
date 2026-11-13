import { useConsultaNoticia } from '../componentes/noticias/useConsultaNoticia';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { buscarNoticia, excluirNoticia } from '../servicos/servicoNoticias';
import { DataNoticia, EstadoNoticias, LayoutNoticias } from '../componentes/noticias/componentes';
import ConfirmacaoModal from '../componentes/forum/componentes/ConfirmacaoModal';

export default function Noticia() {
  const { id } = useParams();
  return <LeituraNoticia key={id} id={id} />;
}

function LeituraNoticia({ id }) {
  const { sessao } = useAutenticacao();
  const navegar = useNavigate();
  const carregar = useCallback(() => buscarNoticia(id), [id]);
  const consulta = useConsultaNoticia(carregar);
  const [confirmar, setConfirmar] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  async function excluir() {
    if (processando) return;
    setProcessando(true); setErro('');
    try { await excluirNoticia(id); navegar('/noticias', { replace: true }); }
    catch (falha) { setErro(falha.message); setConfirmar(false); setProcessando(false); }
  }
  return <LayoutNoticias><Link className="noticias-voltar" to="/noticias">Todas as notícias</Link>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    <EstadoNoticias consulta={consulta}>{(noticia) => <article className="noticia-leitura"><header><span className="noticias-etiqueta">EM PAUTA / CURSO VÁLIDO</span><h1>{noticia.titulo}</h1><div className="noticia-meta"><DataNoticia valor={noticia.criadoEm} /><span>Redação Curso Válido</span></div>{noticia.atualizadoEm && <p className="texto-suave">Atualizada em <DataNoticia valor={noticia.atualizadoEm} /></p>}
      {sessao?.perfil === 'ADMINISTRADOR' && String(sessao.idUsuario) === String(noticia.idAutor) && <div className="noticias-acoes"><Link className="btn btn-secondary" to={`/noticias/${id}/editar`}>Editar notícia</Link><button className="btn btn-danger" type="button" onClick={() => setConfirmar(true)}>Excluir notícia</button></div>}
    </header><div className="noticia-conteudo">{noticia.conteudo}</div></article>}</EstadoNoticias>
    {confirmar && <ConfirmacaoModal titulo="Excluir notícia" mensagem="Esta notícia deixará de aparecer nas publicações. Deseja continuar?" processando={processando} onConfirmar={excluir} onCancelar={() => { if (!processando) setConfirmar(false); }} />}
  </LayoutNoticias>;
}
