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
  const [ampliado, setAmpliado] = useState(false);
  return <figure className="card caminhos-imagem" aria-labelledby="caminhos-imagem-titulo">
      <h2 id="caminhos-imagem-titulo">Uma ideia de caminhos possíveis</h2>
      <p className="texto-suave">Explore como interfaces, servidores, bancos de dados, infraestrutura e inteligência artificial se conectam. Use o mapa para conhecer possibilidades e escolher o que aprofundar, um assunto por vez.</p>
      <button type="button" className="caminhos-imagem-abrir" onClick={() => setAmpliado(true)} aria-haspopup="dialog" aria-label="Abrir diagrama em tela cheia">
        <img src="/imagens/roadmap-fullstack.png" alt="Mapa de caminhos para desenvolvimento fullstack, com interfaces, desenvolvimento no servidor, bancos de dados, arquitetura, DevOps, estruturas de dados, inteligência artificial e carreira." width="4070" height="3002" loading="lazy" decoding="async" />
      </button>
      <figcaption>Clique na imagem para ampliar e explorar os caminhos possíveis.</figcaption>
      {ampliado && <VisualizadorDiagrama onFechar={() => setAmpliado(false)} />}
    </figure>;
}

function VisualizadorDiagrama({ onFechar }) {
  const [zoom, setZoom] = useState(100);
  const [arrastando, setArrastando] = useState(false);
  const arraste = useRef(null);
  const painel = useRef(null);
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

  function iniciarArraste(evento) {
    if (evento.button !== 0 || evento.isPrimary === false || arraste.current) return;
    const area = evento.currentTarget;
    if (area.scrollWidth <= area.clientWidth && area.scrollHeight <= area.clientHeight) return;
    evento.preventDefault();
    area.focus({ preventScroll: true });
    arraste.current = { id: evento.pointerId, x: evento.clientX, y: evento.clientY, esquerda: area.scrollLeft, topo: area.scrollTop };
    area.setPointerCapture?.(evento.pointerId);
    setArrastando(true);
  }

  function moverArraste(evento) {
    const inicio = arraste.current;
    if (!inicio || inicio.id !== evento.pointerId) return;
    const area = evento.currentTarget;
    area.scrollLeft = Math.max(0, Math.min(area.scrollWidth - area.clientWidth, inicio.esquerda + inicio.x - evento.clientX));
    area.scrollTop = Math.max(0, Math.min(area.scrollHeight - area.clientHeight, inicio.topo + inicio.y - evento.clientY));
  }

  function encerrarArraste(evento) {
    if (arraste.current?.id !== evento.pointerId) return;
    arraste.current = null;
    setArrastando(false);
    if (evento.currentTarget.hasPointerCapture?.(evento.pointerId)) evento.currentTarget.releasePointerCapture(evento.pointerId);
  }

  function teclado(evento) {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      onFechar();
    }
    if (evento.key !== 'Tab') return;
    const controles = painel.current.querySelectorAll('button:not(:disabled), [tabindex="0"]');
    const primeiro = controles[0];
    const ultimo = controles[controles.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  return createPortal(<div ref={painel} className="caminhos-visualizador" role="dialog" aria-modal="true" aria-labelledby="caminhos-visualizador-titulo" onKeyDown={teclado}>
    <div className="caminhos-visualizador-barra">
      <h2 id="caminhos-visualizador-titulo">Caminhos possíveis</h2>
      <div className="caminhos-visualizador-acoes">
        <button type="button" onClick={() => setZoom((valor) => Math.max(100, valor - 50))} disabled={zoom === 100} aria-label="Diminuir zoom do diagrama">Reduzir</button>
        <span aria-live="polite">{zoom}%</span>
        <button type="button" onClick={() => setZoom((valor) => Math.min(400, valor + 50))} disabled={zoom === 400} aria-label="Aumentar zoom do diagrama">Ampliar</button>
        <button type="button" onClick={() => setZoom(100)}>Ajustar à tela</button>
        <button ref={fechar} type="button" onClick={onFechar}>Fechar</button>
      </div>
    </div>
    <div className={`caminhos-visualizador-area${zoom > 100 ? ' caminhos-visualizador-movivel' : ''}${arrastando ? ' caminhos-visualizador-arrastando' : ''}`} tabIndex={0} role="region" aria-label="Mapa ampliado; arraste ou use a rolagem para explorar os detalhes" onPointerDown={iniciarArraste} onPointerMove={moverArraste} onPointerUp={encerrarArraste} onPointerCancel={encerrarArraste} onLostPointerCapture={encerrarArraste}>
      <div className="caminhos-visualizador-tela" style={{ width: `${zoom}%`, height: `${zoom}%` }}>
        <img src="/imagens/roadmap-fullstack.png" alt="Diagrama ampliado dos caminhos possíveis para desenvolvimento fullstack." width="4070" height="3002" decoding="async" draggable={false} />
      </div>
    </div>
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
