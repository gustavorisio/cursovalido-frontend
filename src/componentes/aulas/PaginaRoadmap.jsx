import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import LayoutAulas from './componentes/LayoutAulas';
import CabecalhoAulas from './componentes/CabecalhoAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import QuestionarioCaminhos from './componentes/QuestionarioCaminhos';
import useCarregamento from './hooks/useCarregamento';
import { consultarPerguntasInteresses, consultarQuestionarioCaminhos, consultarInteresses } from './servicos/servicoAprendizagem';

export default function PaginaRoadmap() {
  const { autenticado, sessao } = useAutenticacao();
  const aluno = autenticado && sessao?.perfil === 'ALUNO';
  const catalogo = !autenticado ? '/cursos' : aluno ? '/aluno/cursos' : sessao?.perfil === 'ADMINISTRADOR' ? '/administracao/cursos' : '/professor/cursos';
  return <Caminhos key={sessao?.idUsuario ?? 'publico'} aluno={aluno} administrador={sessao?.perfil === 'ADMINISTRADOR'} catalogo={catalogo} />;
}

function Caminhos({ aluno, administrador, catalogo }) {
  const carregar = useCallback(() => consultarPerguntasInteresses(), []);
  const carga = useCarregamento(carregar);
  return <LayoutAulas>
    <CabecalhoAulas etiqueta="Descubra por onde começar" titulo="Caminhos na tecnologia" descricao="Responda uma pergunta por vez, explore suas possibilidades e descubra assuntos para pesquisar em Aulas online." acao={administrador && <Link className="btn btn-primary" to="/administracao/caminhos">Gerenciar caminhos</Link>} />
    <EstadoCarregamento carga={carga} />
    {!carga.carregando && !carga.erro && carga.dados && <>
      <EscolherQuestionario questionarios={carga.dados.questionarios} aluno={aluno} catalogo={catalogo} />
      <section className="card caminhos-secoes" aria-labelledby="caminhos-secoes-titulo">
        <span className="aulas-etiqueta">Conheça as possibilidades</span>
        <h2 id="caminhos-secoes-titulo">Explore os caminhos da programação</h2>
        <p className="texto-suave">Abra os assuntos que despertam seu interesse. Você pode consultar mais de um ao mesmo tempo.</p>
        {carga.dados.secoes.length ? carga.dados.secoes.map((secao) => <details key={secao.id} className="caminhos-secao"><summary>{secao.titulo}</summary><div className="caminhos-conteudo">{secao.conteudo}</div></details>) : <p className="texto-suave">O administrador ainda não publicou conteúdos explicativos.</p>}
      </section>
    </>}
    <DiagramaCaminhos />
  </LayoutAulas>;
}

function DiagramaCaminhos() {
  const [aberto, setAberto] = useState(false);
  return <figure className="card caminhos-imagem" aria-labelledby="caminhos-imagem-titulo">
      <h2 id="caminhos-imagem-titulo">Uma ideia de caminhos possíveis</h2>
      <p className="texto-suave">Explore como interfaces, servidores, bancos de dados, infraestrutura e inteligência artificial se conectam. Use o mapa para conhecer possibilidades e escolher o que aprofundar, um assunto por vez.</p>
      <button type="button" className="caminhos-imagem-abrir" onClick={() => setAberto(true)} aria-haspopup="dialog" aria-label="Abrir diagrama em tela cheia">
        <img src="/imagens/roadmap-fullstack.png" alt="Mapa de caminhos para desenvolvimento fullstack, com interfaces, desenvolvimento no servidor, bancos de dados, arquitetura, DevOps, estruturas de dados, inteligência artificial e carreira." width="4070" height="3002" loading="lazy" decoding="async" />
      </button>
      <figcaption>Selecione a imagem para abrir o diagrama em tela cheia.</figcaption>
      {aberto && <VisualizadorDiagrama onFechar={() => setAberto(false)} />}
    </figure>;
}

function VisualizadorDiagrama({ onFechar }) {
  const fechar = useRef(null);

  useEffect(() => {
    const focoAnterior = document.activeElement;
    const rolagemAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fechar.current?.focus();
    return () => {
      document.body.style.overflow = rolagemAnterior;
      focoAnterior?.focus();
    };
  }, []);

  function teclado(evento) {
    if (evento.key === 'Tab') evento.preventDefault();
    if (evento.key === 'Escape') {
      evento.preventDefault();
      onFechar();
    }
  }

  return createPortal(<div className="caminhos-visualizador" role="dialog" aria-modal="true" aria-labelledby="caminhos-visualizador-titulo" onKeyDown={teclado}>
    <div className="caminhos-visualizador-barra">
      <h2 id="caminhos-visualizador-titulo">Caminhos possíveis</h2>
      <button ref={fechar} className="btn btn-secondary" type="button" onClick={onFechar}>Fechar</button>
    </div>
    <img className="caminhos-visualizador-imagem" src="/imagens/roadmap-fullstack.png" alt="Diagrama dos caminhos possíveis para desenvolvimento fullstack." width="4070" height="3002" decoding="async" draggable={false} />
  </div>, document.body);
}

function EscolherQuestionario({ questionarios, aluno, catalogo }) {
  const [selecionado, setSelecionado] = useState(String(questionarios[0]?.id ?? ''));
  if (!questionarios.length) return <p className="card empty-list">O administrador ainda não publicou um questionário. Enquanto isso, explore os assuntos abaixo.</p>;
  return <section className="caminhos-questionarios" aria-label="Questionários disponíveis">
    {questionarios.length > 1 && <div className="card"><label htmlFor="caminhos-questionario">Escolha um questionário</label><select className="input-field" id="caminhos-questionario" value={selecionado} onChange={(e) => setSelecionado(e.target.value)}>{questionarios.map((q) => <option key={q.id} value={q.id}>{q.titulo}</option>)}</select></div>}
    <CarregarQuestionario key={selecionado} id={selecionado} aluno={aluno} catalogo={catalogo} />
  </section>;
}

function CarregarQuestionario({ id, aluno, catalogo }) {
  const carregar = useCallback(async () => {
    const [questionario, resultado] = await Promise.all([consultarQuestionarioCaminhos(id), aluno ? consultarInteresses(id) : Promise.resolve(null)]);
    return { questionario, resultado };
  }, [id, aluno]);
  const carga = useCarregamento(carregar);
  return <><EstadoCarregamento carga={carga} />{!carga.carregando && !carga.erro && carga.dados && <QuestionarioCaminhos dados={carga.dados} aluno={aluno} catalogo={catalogo} onRecarregar={carga.tentarNovamente} />}</>;
}
