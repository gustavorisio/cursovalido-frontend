import PesquisaConteudo from './componentes/PesquisaConteudo';
import { correspondeAoNome } from './servicos/pesquisaConteudo';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CabecalhoForum from '../forum/componentes/CabecalhoForum';
import ConfirmacaoModal from '../forum/componentes/ConfirmacaoModal';
import Rodape from '../comuns/Rodape';
import FormularioConteudo from './componentes/FormularioConteudo';
import * as servico from './servicos/servicoAulas';
import './estilos/aulas.css';

export default function PaginaGestaoCursos() {
  const { idCurso, idModulo } = useParams();
  return <GestaoConteudo key={`${idCurso}-${idModulo}`} idCurso={idCurso} idModulo={idModulo} />;
}

function ordenar(itens, tipo) {
  if (tipo === 'curso') return itens;
  return [...itens].sort((a, b) => {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.id - b.id;
  });
}

function GestaoConteudo({ idCurso, idModulo }) {
  const tipo = idModulo ? 'aula' : idCurso ? 'modulo' : 'curso';
  const nome = tipo === 'modulo' ? 'módulo' : tipo;
  const titulo = tipo === 'curso' ? 'Meus cursos' : tipo === 'modulo' ? 'Módulos do curso' : 'Aulas do módulo';
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState([]);
  const [curso, setCurso] = useState(null);
  const [modulo, setModulo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [formulario, setFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        let lista;
        let cursoAtual = null;
        let moduloAtual = null;
        if (idModulo) {
          [cursoAtual, moduloAtual, lista] = await Promise.all([
            servico.buscarCurso(idCurso), servico.buscarModulo(idModulo), servico.listarAulas(idModulo),
          ]);
          if (String(moduloAtual.idCurso) !== idCurso) throw new Error('Este módulo não pertence ao curso informado.');
        } else if (idCurso) {
          [cursoAtual, lista] = await Promise.all([servico.buscarCurso(idCurso), servico.listarModulos(idCurso)]);
        } else {
          lista = await servico.listarCursos();
        }
        if (!ativo) return;
        setCurso(cursoAtual);
        setModulo(moduloAtual);
        setItens(ordenar(lista, tipo));
        setFalhaCarga(false);
      } catch (falha) {
        if (!ativo) return;
        setErro(falha.message);
        setFalhaCarga(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [idCurso, idModulo, tipo, tentativa]);

  function abrirFormulario(item = null) {
    setErro('');
    setSucesso('');
    setEditando(item);
    setFormulario(true);
  }

  async function salvar(dados) {
    if (processando) return;
    setProcessando(true);
    setErro('');
    try {
      let salvo;
      if (tipo === 'curso') salvo = await servico.salvarCurso(editando?.id, dados);
      if (tipo === 'modulo') salvo = await servico.salvarModulo(editando?.id, idCurso, dados);
      if (tipo === 'aula') salvo = await servico.salvarAula(editando?.id, idModulo, dados);
      const atualizados = editando ? itens.map((item) => item.id === salvo.id ? salvo : item) : [...itens, salvo];
      setItens(ordenar(atualizados, tipo));
      setFormulario(false);
      setSucesso('Alterações salvas com sucesso.');
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setProcessando(false);
    }
  }

  async function excluir() {
    if (processando) return;
    setProcessando(true);
    setErro('');
    setSucesso('');
    try {
      if (tipo === 'curso') await servico.excluirCurso(excluindo.id);
      if (tipo === 'modulo') await servico.excluirModulo(excluindo.id);
      if (tipo === 'aula') await servico.excluirAula(excluindo.id);
      setItens(itens.filter((item) => item.id !== excluindo.id));
      setSucesso('Conteúdo inativado com sucesso.');
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setExcluindo(null);
      setProcessando(false);
    }
  }

  return <div className="app-container">
    <CabecalhoForum />
    <main className="main-content pagina-aulas">
      <nav className="acoes-topico" aria-label="Navegação dos cursos">
        <Link className="btn btn-link" to="/professor/cursos">Meus cursos</Link>
        {curso ? <Link className="btn btn-link" to={`/professor/cursos/${curso.id}/modulos`}>→ {curso.titulo}</Link> : null}
        {modulo ? <span>→ {modulo.titulo}</span> : null}
      </nav>
      {erro ? <div className="card aviso-erro" role="alert">{erro}</div> : null}
      {sucesso ? <div className="mensagem-sucesso" role="status">{sucesso}</div> : null}
      {formulario ? <FormularioConteudo tipo={nome} item={editando} processando={processando} onSalvar={salvar} onCancelar={() => { setFormulario(false); setErro(''); }} /> : <>
        <header className="aulas-apresentacao">
          <span className="aulas-etiqueta">Área do professor · Gestão de conteúdo</span>
          <div className="page-header"><h1 className="page-title">{titulo}</h1>
          <button className="btn btn-primary" type="button" disabled={carregando ? true : falhaCarga ? true : processando} onClick={() => abrirFormulario()}>Cadastrar {nome}</button>
          </div>
          <p className="texto-suave">{tipo === 'curso' ? 'Organize seus cursos e crie uma jornada de aprendizagem.' : tipo === 'modulo' ? 'Organize os módulos na sequência em que devem ser estudados.' : 'Adicione vídeos e organize as aulas deste módulo.'}</p>
        </header>
        <PesquisaConteudo valor={busca} onAlterar={setBusca} label={tipo === 'curso' ? 'Pesquisar curso por nome' : tipo === 'aula' ? 'Pesquisar aula por nome' : 'Pesquisar módulo por nome'} />
        {carregando ? <div className="card empty-list" role="status">Carregando...</div> : falhaCarga ? <div className="card empty-list"><button className="btn btn-secondary" type="button" onClick={() => { setCarregando(true); setErro(''); setTentativa(tentativa + 1); }}>Tentar novamente</button></div> : <>
          {itens.length === 0 ? <div className="card empty-list">Nenhum conteúdo cadastrado. Cadastre o primeiro {nome}.</div> : null}
          {itens.length > 0 && !itens.some((item) => correspondeAoNome(item.titulo, busca)) && <p className="card empty-list" role="status">Nenhum conteúdo encontrado para esta pesquisa.</p>}
          <div className="aulas-grade">
          {itens.filter((item) => correspondeAoNome(item.titulo, busca)).map((item) => <article className="card aulas-cartao" key={item.id}>
            <span className="aulas-etiqueta">{nome}{tipo === 'curso' ? '' : ` ${item.ordem}`}</span>
            <div className="aulas-cartao-corpo">
              <h2 className="topic-title">{item.titulo}</h2>
              <p className="content-text">{item.descricao}</p>
              {tipo === 'aula' ? <p className="texto-suave">Vídeo: <a href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`} target="_blank" rel="noreferrer">Abrir no YouTube ↗</a></p> : null}
            </div>
            <footer className="aulas-cartao-acoes">
              <div className="acoes-topico">
                {tipo === 'curso' ? <Link className="btn btn-secondary btn-small" to={`/professor/cursos/${item.id}/modulos`}>Ver módulos</Link> : null}
                {tipo === 'modulo' ? <Link className="btn btn-secondary btn-small" to={`/professor/cursos/${idCurso}/modulos/${item.id}/aulas`}>Ver aulas</Link> : null}
                <button className="btn btn-secondary btn-small" type="button" disabled={processando} onClick={() => abrirFormulario(item)}>Editar</button>
                <button className="btn btn-danger btn-small" type="button" disabled={processando} onClick={() => setExcluindo(item)}>Excluir</button>
              </div>
            </footer>
          </article>)}
          </div>
        </>}
      </>}
      {excluindo ? <ConfirmacaoModal titulo={`Excluir ${nome}`} processando={processando} mensagem={`Deseja excluir “${excluindo.titulo}”? O conteúdo será inativado.${tipo === 'aula' ? '' : ' O acesso ao conteúdo vinculado também será bloqueado.'}`} onConfirmar={excluir} onCancelar={() => { if (!processando) setExcluindo(null); }} /> : null}
    </main>
    <Rodape />
  </div>;
}
