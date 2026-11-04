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
  const [busca, setBusca] = useState('');
  const cursos = dados?.cursos?.filter((curso) => correspondeAoNome(curso.titulo, busca));
  const modulos = dados?.modulos?.map((modulo) => ({ ...modulo, aulas: modulo.aulas.filter((aula) => correspondeAoNome(aula.titulo, busca)) })).filter((modulo) => !busca.trim() || modulo.aulas.length > 0);

  return <LayoutAulas>
    <nav className="acoes-topico" aria-label="Navegação dos cursos">
      <Link className="btn btn-secondary" to="/administracao">← Administração</Link>
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
      {dados.aula ? <section className="card">
        <PlayerAula videoId={dados.aula.youtubeVideoId} />
        <p className="content-text">{dados.aula.descricao}</p>
      </section> : dados.curso ? <>
        <p className="card content-text">{dados.curso.descricao}</p>
        {modulos.length === 0 ? <div className="card empty-list">Nenhum módulo disponível.</div> : null}
        {modulos.map((modulo) => <section className="card aulas-modulo" key={modulo.id}>
          <header className="aulas-modulo-cabecalho"><span className="aulas-numero">{String(modulo.ordem).padStart(2, '0')}</span><div><span className="aulas-etiqueta">Módulo · {modulo.aulas.length} aulas</span><h2 className="topic-title">{modulo.titulo}</h2></div></header>
          <p className="content-text">{modulo.descricao}</p>
          {modulo.aulas.length === 0 ? <p className="texto-suave">Nenhuma aula disponível.</p> : null}
          {modulo.aulas.map((aula) => <div className="aulas-linha" key={aula.id}>
            <div><span className="aulas-etiqueta">Aula {aula.ordem}</span><h3>{aula.titulo}</h3></div>
            <Link className="btn btn-secondary" to={`/administracao/cursos/${idCurso}/aulas/${aula.id}`}>Visualizar aula</Link>
          </div>)}
        </section>)}
      </> : null}
    </> : null}
  </LayoutAulas>;
}
