import { useAutenticacao } from '../../contextos/useAutenticacao';
import PesquisaConteudo from './componentes/PesquisaConteudo';
import { correspondeAoNome } from './servicos/pesquisaConteudo';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import useCarregamento from './hooks/useCarregamento';
import * as servico from './servicos/servicoAluno';
import CabecalhoAulas from './componentes/CabecalhoAulas';
import FiltroTema from './componentes/FiltroTema';
import { correspondeAoTema } from './servicos/filtroTema';


export default function PaginaCatalogo() {
  const { autenticado, sessao } = useAutenticacao();
  const aluno = autenticado && sessao?.perfil === 'ALUNO';
  const carregarCatalogo = useCallback(async () => {
    if (!aluno) return { cursos: await servico.listarCatalogoPublico(), matriculas: [] };
    const [cursos, matriculas] = await Promise.all([servico.listarCatalogo(), servico.listarMatriculas()]);
    return { cursos, matriculas };
  }, [aluno]);
  const carga = useCarregamento(carregarCatalogo);
  const [novasMatriculas, setNovasMatriculas] = useState([]);
  const [somenteMatriculados, setSomenteMatriculados] = useState(false);
  const [processando, setProcessando] = useState(null);
  const [busca, setBusca] = useState('');
  const [temaSelecionado, setTemaSelecionado] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const matriculas = [...(carga.dados?.matriculas ?? []), ...novasMatriculas];
  const catalogo = carga.dados?.cursos ?? [];
  const cursos = catalogo.filter((curso) => {
    if (!correspondeAoNome(curso.titulo, busca)) return false;
    if (!correspondeAoTema(curso, temaSelecionado)) return false;
    if (!somenteMatriculados) return true;
    return matriculas.some((item) => item.idCurso === curso.id);
  });

  function mostrarTodos() {
    setTemaSelecionado('');
    setBusca('');
    setSomenteMatriculados(false);
  }

  async function matricular(curso) {
    if (!aluno || processando !== null) return;
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
    <CabecalhoAulas etiqueta="Aprenda no seu ritmo" titulo="Aulas online" descricao="Explore nossos cursos de tecnologia e programação e descubra novas possibilidades." tipo="aula" acao={<PesquisaConteudo valor={busca} onAlterar={setBusca} />} />
    <section className="catalogo-resultados" id="catalogo-cursos" aria-labelledby="catalogo-cursos-titulo">
      <div className="catalogo-secao-cabecalho">
        <div><span className="aulas-etiqueta">Continue aprendendo</span><h2 id="catalogo-cursos-titulo">Explore nossos cursos</h2></div>
        {aluno && <div className="catalogo-abas">
          <button type="button" aria-pressed={!somenteMatriculados} onClick={() => setSomenteMatriculados(false)}>Catálogo</button>
          <button type="button" aria-pressed={somenteMatriculados} onClick={() => setSomenteMatriculados(true)}>Minhas matrículas</button>
        </div>}
      </div>
    {erro ? <p className="mensagem-erro" role="alert">{erro}</p> : null}
    {mensagem ? <p className="mensagem-sucesso" role="status">{mensagem}</p> : null}
    <FiltroTema valor={temaSelecionado} onAlterar={setTemaSelecionado} />
    {!carga.carregando && !carga.erro && <p className="catalogo-contagem" role="status">{cursos.length} {cursos.length === 1 ? 'curso encontrado' : 'cursos encontrados'}{temaSelecionado && <> neste tema · <button type="button" onClick={() => setTemaSelecionado('')}>Limpar tema</button></>}</p>}
    <EstadoCarregamento carga={carga} />
    {carga.carregando ? null : carga.erro ? null : <>
      {cursos.length === 0 ? <div className="card empty-list">{busca.trim() ? 'Nenhum curso encontrado para esta pesquisa.' : somenteMatriculados ? 'Você ainda não possui matrículas com estes filtros.' : temaSelecionado ? 'Ainda não há cursos disponíveis com estes filtros.' : 'Nenhum curso disponível no momento.'}{(temaSelecionado || busca || somenteMatriculados) && <button className="btn btn-link catalogo-limpar" type="button" onClick={mostrarTodos}>Ver todos os cursos</button>}</div> : null}
      <div className="aulas-grade catalogo-cursos-grade">
        {cursos.map((curso) => {
          const matriculado = matriculas.some((item) => item.idCurso === curso.id);
          return <article className="card aulas-cartao" key={curso.id}>

            <div className="aulas-cartao-corpo">
              <h2 className="topic-title">{curso.titulo}</h2>

            </div>
            <footer className="aulas-cartao-acoes">
              <div className="acoes-topico">
                {!autenticado ? <Link className="btn btn-primary" to="/login">Entrar para acessar</Link> : !aluno ? <Link className="btn btn-primary" to="/cursos">Ir para meus cursos</Link> : matriculado ? <Link className="btn btn-primary" to={`/aluno/cursos/${curso.id}`}>Acessar curso</Link> : <button className="btn btn-primary" type="button" disabled={processando !== null} onClick={() => matricular(curso)}>{processando === curso.id ? 'Matriculando...' : 'Matricular-se gratuitamente'}</button>}
              </div>
            </footer>
          </article>;
        })}
      </div>
    </>}
    </section>
  </LayoutAulas>;
}
