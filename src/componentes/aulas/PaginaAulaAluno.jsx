import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import PlayerAula from './componentes/PlayerAula';
import useCarregamento from './hooks/useCarregamento';
import { criarFilaProgresso } from './servicos/filaProgresso';
import * as servico from './servicos/servicoAluno';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import CabecalhoAulas from './componentes/CabecalhoAulas';

export default function PaginaAulaAluno() {
  const { idCurso, idAula } = useParams();
  return <AulaAluno key={`${idCurso}-${idAula}`} idCurso={idCurso} idAula={idAula} />;
}

function AulaAluno({ idCurso, idAula }) {
  const carregar = useCallback(async () => {
    const [curso, modulos, aula, progresso] = await Promise.all([
      servico.buscarCurso(idCurso), servico.listarModulos(idCurso), servico.buscarAula(idAula), servico.buscarProgresso(idAula),
    ]);
    const modulo = modulos.find((item) => item.id === aula.idModulo);
    if (!modulo) throw new Error('Esta aula não pertence ao curso informado.');
    const aulas = await servico.listarAulas(modulo.id);
    return { curso, modulo, aula, progresso, aulas };
  }, [idCurso, idAula]);
  const carga = useCarregamento(carregar);

  return <LayoutAulas>
    <Link className="btn btn-link" to={`/aluno/cursos/${idCurso}`}>Voltar ao curso</Link>
    <EstadoCarregamento carga={carga} />
    {carga.carregando ? null : carga.erro ? null : carga.dados ? <ConteudoAula dados={carga.dados} /> : null}
  </LayoutAulas>;
}

function ConteudoAula({ dados }) {
  const { sessao } = useAutenticacao();
  const [tokenDaAula] = useState(sessao?.token);
  const { curso, modulo, aula, aulas } = dados;
  const [progresso, setProgresso] = useState(dados.progresso);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [concluindo, setConcluindo] = useState(false);
  const [executar] = useState(criarFilaProgresso);
  const ativo = useRef(true);
  const indice = aulas.findIndex((item) => item.id === aula.id);
  const anterior = aulas[indice - 1];
  const proxima = aulas[indice + 1];

  useEffect(() => {
    ativo.current = true;
    return () => { ativo.current = false; };
  }, []);

  const salvar = useCallback(async (posicao, aoSair = false) => {
    try {
      const salvo = await executar(() => servico.salvarPosicao(aula.id, posicao, { keepalive: aoSair, tokenAutenticacao: tokenDaAula }));
      if (ativo.current) {
        setProgresso(salvo);
        setErro('');
      }
      return true;
    } catch (falha) {
      if (ativo.current) {
        setErro(`Não foi possível salvar a posição. ${falha.message} O sistema tentará novamente automaticamente.`);
        setMensagem('');
      }
      return false;
    }
  }, [aula.id, executar, tokenDaAula]);

  async function concluir() {
    if (concluindo) return;
    setConcluindo(true);
    setErro('');
    setMensagem('');
    try {
      const salvo = await executar(() => servico.concluirAula(aula.id, { tokenAutenticacao: tokenDaAula }));
      if (!ativo.current) return;
      setProgresso(salvo);
      setMensagem('Aula marcada como concluída.');
    } catch (falha) {
      if (ativo.current) setErro(falha.message);
    } finally {
      if (ativo.current) setConcluindo(false);
    }
  }

  return <>
    <CabecalhoAulas etiqueta={`${curso.titulo} · ${modulo.titulo}`} titulo={aula.titulo} tipo="aula" descricao={`Aula ${aula.ordem} · ${progresso.concluida ? 'Concluída' : 'Aprenda no seu ritmo e retome de onde parou.'}`} />
    <div className="aulas-sala">
    <section className="card aulas-sala-player" aria-label="Vídeo e conteúdo da aula">
      <PlayerAula videoId={aula.youtubeVideoId} posicaoInicial={dados.progresso.posicaoSegundos} onSalvar={salvar} />
      {erro ? <p className="mensagem-erro" role="alert">{erro}</p> : null}
      {mensagem ? <p className="mensagem-sucesso" role="status">{mensagem}</p> : null}
      <p className="texto-suave">Última posição salva: {progresso.posicaoSegundos}s.</p>
      <h2 className="aulas-sobre-titulo">Sobre esta aula</h2>
      <p className="content-text">{aula.descricao}</p>
      <p className="texto-suave">A conclusão é manual. Você pode marcar esta aula como concluída quando desejar.</p>
      <div className="aulas-cartao-acoes"><button className="btn btn-primary" type="button" disabled={progresso.concluida ? true : concluindo} onClick={concluir}>{progresso.concluida ? 'Aula concluída' : concluindo ? 'Concluindo...' : 'Marcar como concluída'}</button></div>
    </section>
    <aside className="card aulas-sala-trilha" aria-labelledby="aulas-trilha-titulo">
      <span className="aulas-etiqueta">Conteúdo do módulo</span><h2 id="aulas-trilha-titulo">{modulo.titulo}</h2>
      <p className="texto-suave">{aulas.length} aulas · Aula {indice + 1} de {aulas.length}</p>
      <nav aria-label="Aulas deste módulo">{aulas.map((item) => <Link key={item.id} to={`/aluno/cursos/${curso.id}/aulas/${item.id}`} aria-current={item.id === aula.id ? 'page' : undefined}><span><small>Aula {item.ordem}</small>{item.titulo}</span></Link>)}</nav>
      <Link className="btn btn-secondary" to={`/aluno/cursos/${curso.id}`}>Ver todos os módulos</Link>
      <Link className="btn btn-secondary" to={`/aluno/cursos/${curso.id}/modulos/${modulo.id}/questionario`}>Questionário do módulo</Link>
    </aside>
    </div>
    <nav className="page-actions" aria-label="Navegar entre aulas do módulo">
      {anterior ? <Link className="btn btn-secondary" to={`/aluno/cursos/${curso.id}/aulas/${anterior.id}`}>Aula anterior</Link> : null}
      {proxima ? <Link className="btn btn-secondary" to={`/aluno/cursos/${curso.id}/aulas/${proxima.id}`}>Próxima aula</Link> : null}
      <Link className="btn btn-secondary" to={`/aluno/cursos/${curso.id}`}>Todos os módulos</Link>
    </nav>
  </>;
}
