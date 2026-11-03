import { useState } from 'react';
import { Link } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import useCarregamento from './hooks/useCarregamento';
import * as servico from './servicos/servicoAluno';

async function carregarCatalogo() {
  const [cursos, matriculas] = await Promise.all([servico.listarCatalogo(), servico.listarMatriculas()]);
  return { cursos, matriculas };
}

export default function PaginaCatalogo() {
  const carga = useCarregamento(carregarCatalogo);
  const [novasMatriculas, setNovasMatriculas] = useState([]);
  const [somenteMatriculados, setSomenteMatriculados] = useState(false);
  const [processando, setProcessando] = useState(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const matriculas = [...(carga.dados?.matriculas ?? []), ...novasMatriculas];
  const cursos = (carga.dados?.cursos ?? []).filter((curso) => {
    if (!somenteMatriculados) return true;
    return matriculas.some((item) => item.idCurso === curso.id);
  });

  async function matricular(curso) {
    if (processando !== null) return;
    setProcessando(curso.id);
    setErro('');
    setMensagem('');
    try {
      const matricula = await servico.matricular(curso.id);
      setNovasMatriculas((itens) => [...itens, matricula]);
      setMensagem(`Matrícula em “${curso.titulo}” realizada. Você já pode acessar as aulas.`);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setProcessando(null);
    }
  }

  return <LayoutAulas>
    <header className="aulas-apresentacao">
      <span className="aulas-etiqueta">Sua jornada de aprendizagem</span>
    <div className="page-header">
      <h1 className="page-title">Cursos</h1>
      <div className="page-actions">
        <button className={somenteMatriculados ? 'btn btn-secondary' : 'btn btn-primary'} type="button" aria-pressed={!somenteMatriculados} onClick={() => setSomenteMatriculados(false)}>Catálogo</button>
        <button className={somenteMatriculados ? 'btn btn-primary' : 'btn btn-secondary'} type="button" aria-pressed={somenteMatriculados} onClick={() => setSomenteMatriculados(true)}>Minhas matrículas</button>
      </div>
    </div>
      <p className="texto-suave">Explore os cursos gratuitos ou retome seus estudos nas suas matrículas.</p>
    </header>
    {erro ? <p className="mensagem-erro" role="alert">{erro}</p> : null}
    {mensagem ? <p className="mensagem-sucesso" role="status">{mensagem}</p> : null}
    <EstadoCarregamento carga={carga} />
    {carga.carregando ? null : carga.erro ? null : <>
      {cursos.length === 0 ? <div className="card empty-list">{somenteMatriculados ? 'Você ainda não possui matrículas em cursos disponíveis.' : 'Nenhum curso disponível no momento.'}</div> : null}
      <div className="aulas-grade">
      {cursos.map((curso) => {
        const matriculado = matriculas.some((item) => item.idCurso === curso.id);
        return <article className="card aulas-cartao" key={curso.id}>
          <span className="aulas-etiqueta">{matriculado ? 'Matriculado' : 'Curso gratuito'}</span>
          <div className="aulas-cartao-corpo">
            <h2 className="topic-title">{curso.titulo}</h2>
            <p className="content-text">{curso.descricao}</p>
          </div>
          <footer className="aulas-cartao-acoes">
            <div className="acoes-topico">
              {matriculado ? <Link className="btn btn-primary" to={`/aluno/cursos/${curso.id}`}>Acessar curso</Link> : <button className="btn btn-primary" type="button" disabled={processando !== null} onClick={() => matricular(curso)}>{processando === curso.id ? 'Matriculando...' : 'Matricular-se gratuitamente'}</button>}
            </div>
          </footer>
        </article>;
      })}
      </div>
    </>}
  </LayoutAulas>;
}
