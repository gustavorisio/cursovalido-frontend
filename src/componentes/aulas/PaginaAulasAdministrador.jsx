import FormularioConteudo from './componentes/FormularioConteudo';
import ConfirmacaoModal from '../forum/componentes/ConfirmacaoModal';
import ModuloExpansivel from './componentes/ModuloExpansivel';
import PesquisaConteudo from './componentes/PesquisaConteudo';
import { correspondeAoNome } from './servicos/pesquisaConteudo';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import PlayerAula from './componentes/PlayerAula';
import useCarregamento from './hooks/useCarregamento';
import * as servico from './servicos/servicoAdministradorAulas';
import CabecalhoAulas from './componentes/CabecalhoAulas';
import FiltroTema from './componentes/FiltroTema';
import { correspondeAoTema } from './servicos/filtroTema';

export default function PaginaAulasAdministrador() {
  const { idCurso, idAula } = useParams();
  return <ConsultaAulas key={`${idCurso}-${idAula}`} idCurso={idCurso} idAula={idAula} />;
}

function ConsultaAulas({ idCurso, idAula }) {
  const navegar = useNavigate();
  const carregar = useCallback(async () => {
    if (!idCurso) return { cursos: await servico.listarCursos() };
    const [curso, modulos] = await Promise.all([servico.buscarCurso(idCurso), servico.listarModulos(idCurso)]);
    const conteudo = await Promise.all(modulos.map(async (modulo) => ({
      ...modulo, aulas: await servico.listarAulas(modulo.id),
    })));
    let aula = null;
    if (idAula) {
      aula = await servico.buscarAula(idAula);
      if (!modulos.some((modulo) => modulo.id === aula.idModulo)) {
        throw new Error('Esta aula não pertence ao curso informado.');
      }
    }
    return { curso, modulos: conteudo, aula };
  }, [idCurso, idAula]);
  const carga = useCarregamento(carregar);
  const dados = carga.dados;
  const [editando, setEditando] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [busca, setBusca] = useState('');
  const [tema, setTema] = useState('');
  const [cursoEditando, setCursoEditando] = useState(null);
  const [cursoExcluindo, setCursoExcluindo] = useState(null);
  const cursos = dados?.cursos?.filter((curso) => correspondeAoNome(curso.titulo, busca) && correspondeAoTema(curso, tema));
  const modulos = dados?.modulos?.map((modulo) => ({ ...modulo, aulas: modulo.aulas.filter((aula) => correspondeAoNome(aula.titulo, busca)) })).filter((modulo) => !busca.trim() || modulo.aulas.length > 0);

  async function executar(acao, sucesso) {
    if (processando) return;
    setProcessando(true); setErroAcao(''); setMensagem('');
    try { await acao(); setEditando(null); setCursoEditando(null); setCursoExcluindo(null); setConfirmacao(null); setMensagem(sucesso); carga.tentarNovamente(); }
    catch (falha) { setErroAcao(falha.message); }
    finally { setProcessando(false); }
  }
  async function abrirEdicao(aula) {
    if (processando) return;
    setProcessando(true); setErroAcao(''); setMensagem('');
    try { setEditando(await servico.buscarAula(aula.id)); }
    catch (falha) { setErroAcao(falha.message); }
    finally { setProcessando(false); }
  }

  function formulario(aula) {
    return editando?.id === aula.id ? <FormularioConteudo key={editando.id} tipo="aula" item={editando} processando={processando} onCancelar={() => setEditando(null)} onSalvar={valores => executar(() => servico.editarAula(editando.id, valores), 'Aula atualizada.')} /> : null;
  }

  function acoes(aula) {
    return <div className="acoes-topico">
      <button className="btn btn-secondary" type="button" disabled={processando} onClick={() => abrirEdicao(aula)}>Editar aula</button>
      <button className="btn btn-secondary" type="button" disabled={processando} onClick={() => setConfirmacao(aula)}>{aula.ativo === false ? 'Reabrir aula' : 'Arquivar aula'}</button>
    </div>;
  }

  function acoesCurso(curso) {
    return <div className="acoes-topico">
      <Link className="btn btn-secondary" to={`/administracao/cursos/${curso.id}/diagnostico`}>Diagnóstico inicial</Link>
      <button className="btn btn-secondary" type="button" disabled={processando} onClick={() => setCursoEditando(curso)}>Editar curso</button>
      <button className="btn btn-danger" type="button" disabled={processando} onClick={() => setCursoExcluindo(curso)}>Excluir curso</button>
    </div>;
  }

  return <LayoutAulas>
    {erroAcao && <p className="mensagem-erro" role="alert">{erroAcao}</p>}
    {mensagem && <p role="status">{mensagem}</p>}
    {cursoExcluindo && <ConfirmacaoModal titulo="Excluir curso" mensagem={`Excluir “${cursoExcluindo.titulo}”? O curso será inativado e o acesso aos módulos e aulas será bloqueado.`} processando={processando} onCancelar={() => { if (!processando) setCursoExcluindo(null); }} onConfirmar={() => executar(async () => { await servico.excluirCurso(cursoExcluindo.id); if (idCurso) navegar('/administracao/cursos'); }, 'Curso excluído.')} />}
    {confirmacao && <ConfirmacaoModal titulo={confirmacao.ativo === false ? 'Reabrir aula' : 'Arquivar aula'} mensagem={confirmacao.ativo === false ? 'A aula voltará a ficar disponível aos alunos matriculados.' : 'A aula ficará indisponível para os alunos. Você poderá reabri-la depois.'} processando={processando} onCancelar={() => { if (!processando) setConfirmacao(null); }} onConfirmar={() => executar(() => confirmacao.ativo === false ? servico.reabrirAula(confirmacao.id) : servico.arquivarAula(confirmacao.id), confirmacao.ativo === false ? 'Aula reaberta.' : 'Aula arquivada.')} />}
    <nav className="acoes-topico" aria-label="Navegação dos cursos">
      <Link className="btn btn-link" to="/administracao/cursos">Cursos</Link>
      {dados?.curso ? <Link className="btn btn-link" to={`/administracao/cursos/${idCurso}`}>{dados.curso.titulo}</Link> : null}
    </nav>
    <CabecalhoAulas etiqueta="Área administrativa · Conteúdo educacional" titulo={dados?.aula?.titulo ?? dados?.curso?.titulo ?? 'Cursos e aulas'} tipo={idAula ? 'aula' : idCurso ? 'modulo' : 'curso'} acao={dados?.curso && !idAula ? acoesCurso(dados.curso) : null} descricao={dados?.aula ? 'Confira o vídeo e o conteúdo desta aula.' : dados?.curso ? 'Explore os módulos e visualize as aulas deste curso.' : 'Consulte os cursos disponíveis e acompanhe a organização das aulas.'}>
      {dados?.curso ? <div className="aulas-indicadores"><span>{dados.modulos.length} módulos</span><span>{dados.modulos.reduce((total, modulo) => total + modulo.aulas.length, 0)} aulas</span></div> : null}
    </CabecalhoAulas>
    {cursoEditando && <FormularioConteudo key={cursoEditando.id} tipo="curso" item={cursoEditando} processando={processando} onCancelar={() => setCursoEditando(null)} onSalvar={(valores) => executar(() => servico.editarCurso(cursoEditando.id, valores), 'Curso atualizado.')} />}
    {!cursoEditando && <section className="catalogo-resultados" id="catalogo-cursos" aria-label={idAula ? 'Conteúdo da aula' : idCurso ? 'Módulos e aulas' : 'Cursos disponíveis'}>
    <div className="catalogo-secao-cabecalho"><div><span className="aulas-etiqueta">Gestão de conteúdo</span><h2>{idAula ? 'Conteúdo da aula' : idCurso ? 'Módulos e aulas' : 'Cursos disponíveis'}</h2></div></div>
    {!idAula && <PesquisaConteudo valor={busca} onAlterar={setBusca} label={idCurso ? 'Pesquisar aula por nome' : 'Pesquisar curso por nome'} />}
    {!idCurso && <FiltroTema valor={tema} onAlterar={setTema} gerenciar onAtualizar={carga.tentarNovamente} />}
    <EstadoCarregamento carga={carga} />
    {carga.carregando ? null : carga.erro ? null : dados ? <>
      {dados.cursos ? <>
        {cursos.length === 0 ? <div className="card empty-list">Nenhum curso encontrado.</div> : null}
        <div className="aulas-grade aulas-conteudo-grade">
          {cursos.map((curso) => <article className="card aulas-cartao" key={curso.id}>

            <div className="aulas-cartao-corpo">
              <h2 className="topic-title">{curso.titulo}</h2>

            </div>
            <footer className="aulas-cartao-acoes"><Link className="btn btn-primary" to={`/administracao/cursos/${curso.id}`}>Ver módulos e aulas</Link>{acoesCurso(curso)}</footer>
          </article>)}
        </div>
      </> : null}
      {dados.aula ? editando ? formulario(dados.aula) : <section className="card aulas-detalhe aulas-sala-player">
        <p className="aulas-etiqueta">{dados.aula.ativo === false ? 'Arquivada' : 'Disponível'}</p>{acoes(dados.aula)}
      <PlayerAula videoId={dados.aula.youtubeVideoId} />
        <p className="content-text">{dados.aula.descricao}</p>
      </section> : dados.curso ? <>
        <p className="card content-text">{dados.curso.descricao}</p>
        {modulos.length === 0 ? <div className="card empty-list">Nenhum módulo disponível.</div> : null}
        {modulos.map((modulo) => <ModuloExpansivel key={modulo.id} modulo={modulo} expandido={Boolean(busca.trim())}>

          <p className="content-text">{modulo.descricao}</p>
          <Link className="btn btn-secondary" to={`/administracao/cursos/${idCurso}/modulos/${modulo.id}/questionario`}>Editar questionário do módulo</Link>
          {modulo.aulas.length === 0 ? <p className="texto-suave">Nenhuma aula disponível.</p> : null}
          {modulo.aulas.map((aula) => <div key={aula.id}>
            {editando?.id === aula.id ? formulario(aula) : <div className="aulas-linha">

              <div><span className="aulas-etiqueta">Aula {aula.ordem}{aula.ativo === false ? ' · Arquivada' : ''}</span><h3>{aula.titulo}</h3></div>
              <Link className="btn btn-secondary" to={`/administracao/cursos/${idCurso}/aulas/${aula.id}`}>Visualizar aula</Link>{acoes(aula)}
            </div>}
          </div>)}
        </ModuloExpansivel>)}
      </> : null}
    </> : null}
    </section>}
  </LayoutAulas>;
}
