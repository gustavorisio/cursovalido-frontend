import FormularioConteudo from './componentes/FormularioConteudo';
import ConfirmacaoModal from '../forum/componentes/ConfirmacaoModal';
import PesquisaConteudo from './componentes/PesquisaConteudo';
import { correspondeAoNome } from './servicos/pesquisaConteudo';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import PlayerAula from './componentes/PlayerAula';
import useCarregamento from './hooks/useCarregamento';
import * as servico from './servicos/servicoAdministradorAulas';

export default function PaginaAulasAdministrador() {
  const { idCurso, idAula } = useParams();
  return <ConsultaAulas key={`${idCurso}-${idAula}`} idCurso={idCurso} idAula={idAula} />;
}

function ConsultaAulas({ idCurso, idAula }) {
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
  const cursos = dados?.cursos?.filter((curso) => correspondeAoNome(curso.titulo, busca));
  const modulos = dados?.modulos?.map((modulo) => ({ ...modulo, aulas: modulo.aulas.filter((aula) => correspondeAoNome(aula.titulo, busca)) })).filter((modulo) => !busca.trim() || modulo.aulas.length > 0);

  async function executar(acao, sucesso) {
    if (processando) return;
    setProcessando(true); setErroAcao(''); setMensagem('');
    try { await acao(); setEditando(null); setConfirmacao(null); setMensagem(sucesso); carga.tentarNovamente(); }
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

  return <LayoutAulas>
    {erroAcao && <p className="mensagem-erro" role="alert">{erroAcao}</p>}
    {mensagem && <p role="status">{mensagem}</p>}
    {confirmacao && <ConfirmacaoModal titulo={confirmacao.ativo === false ? 'Reabrir aula' : 'Arquivar aula'} mensagem={confirmacao.ativo === false ? 'A aula voltará a ficar disponível aos alunos matriculados.' : 'A aula ficará indisponível para os alunos. Você poderá reabri-la depois.'} processando={processando} onCancelar={() => { if (!processando) setConfirmacao(null); }} onConfirmar={() => executar(() => confirmacao.ativo === false ? servico.reabrirAula(confirmacao.id) : servico.arquivarAula(confirmacao.id), confirmacao.ativo === false ? 'Aula reaberta.' : 'Aula arquivada.')} />}
    <nav className="acoes-topico" aria-label="Navegação dos cursos">
      <Link className="btn btn-link" to="/administracao/cursos">Cursos</Link>
      {dados?.curso ? <Link className="btn btn-link" to={`/administracao/cursos/${idCurso}`}>→ {dados.curso.titulo}</Link> : null}
    </nav>
    <header className="aulas-apresentacao">
      <span className="aulas-etiqueta">Área administrativa · Conteúdo educacional</span>
      <h1 className="page-title">{dados?.aula?.titulo ?? dados?.curso?.titulo ?? 'Cursos e aulas'}</h1>
      <p className="texto-suave">{dados?.aula ? 'Confira o vídeo e o conteúdo desta aula.' : dados?.curso ? 'Explore os módulos e visualize as aulas deste curso.' : 'Consulte os cursos disponíveis e acompanhe a organização das aulas.'}</p>
      {dados?.curso ? <div className="aulas-indicadores"><span>{dados.modulos.length} módulos</span><span>{dados.modulos.reduce((total, modulo) => total + modulo.aulas.length, 0)} aulas</span></div> : null}
    </header>
    {!idAula && <PesquisaConteudo valor={busca} onAlterar={setBusca} label={idCurso ? 'Pesquisar aula por nome' : 'Pesquisar curso por nome'} />}
    <EstadoCarregamento carga={carga} />
    {carga.carregando ? null : carga.erro ? null : dados ? <>
      {dados.cursos ? <>
        {cursos.length === 0 ? <div className="card empty-list">Nenhum curso encontrado.</div> : null}
        <div className="aulas-grade">
          {cursos.map((curso) => <article className="card aulas-cartao" key={curso.id}>
            <span className="aulas-etiqueta">Curso</span>
            <div className="aulas-cartao-corpo">
              <h2 className="topic-title">{curso.titulo}</h2>
              <p className="content-text">{curso.descricao}</p>
            </div>
            <footer className="aulas-cartao-acoes"><Link className="btn btn-primary" to={`/administracao/cursos/${curso.id}`}>Ver módulos e aulas <span aria-hidden="true">→</span></Link></footer>
          </article>)}
        </div>
      </> : null}
      {dados.aula ? editando ? formulario(dados.aula) : <section className="card aulas-detalhe">
        <p className="aulas-etiqueta">{dados.aula.ativo === false ? 'Arquivada' : 'Disponível'}</p>{acoes(dados.aula)}
        <PlayerAula videoId={dados.aula.youtubeVideoId} />
        <p className="content-text">{dados.aula.descricao}</p>
      </section> : dados.curso ? <>
        <p className="card content-text">{dados.curso.descricao}</p>
        {modulos.length === 0 ? <div className="card empty-list">Nenhum módulo disponível.</div> : null}
        {modulos.map((modulo) => <section className="card aulas-modulo" key={modulo.id}>
          <header className="aulas-modulo-cabecalho"><span className="aulas-numero">{String(modulo.ordem).padStart(2, '0')}</span><div><span className="aulas-etiqueta">Módulo · {modulo.aulas.length} aulas</span><h2 className="topic-title">{modulo.titulo}</h2></div></header>
          <p className="content-text">{modulo.descricao}</p>
          {modulo.aulas.length === 0 ? <p className="texto-suave">Nenhuma aula disponível.</p> : null}
          {modulo.aulas.map((aula) => <div key={aula.id}>
            {editando?.id === aula.id ? formulario(aula) : <div className="aulas-linha">
              <div><span className="aulas-etiqueta">Aula {aula.ordem}{aula.ativo === false ? ' · Arquivada' : ''}</span><h3>{aula.titulo}</h3></div>
              <Link className="btn btn-secondary" to={`/administracao/cursos/${idCurso}/aulas/${aula.id}`}>Visualizar aula</Link>{acoes(aula)}
            </div>}
          </div>)}
        </section>)}
      </> : null}
    </> : null}
  </LayoutAulas>;
}
