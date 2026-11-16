import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import LayoutAulas from './componentes/LayoutAulas';
import CabecalhoAulas from './componentes/CabecalhoAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import useCarregamento from './hooks/useCarregamento';
import * as professor from './servicos/servicoAulas';
import * as administrador from './servicos/servicoAdministradorAulas';
import { consultarQuestionario, salvarQuestionario } from './servicos/servicoAprendizagem';

export default function PaginaEditorQuestionario() {
  const { idCurso, idModulo } = useParams();
  const { sessao } = useAutenticacao();
  const perfil = sessao?.perfil === 'ADMINISTRADOR' ? 'administracao' : 'professor';
  return <Editor key={`${sessao?.idUsuario}-${perfil}-${idCurso}-${idModulo}`} perfil={perfil} idCurso={idCurso} idModulo={idModulo} />;
}

function Editor({ perfil, idCurso, idModulo }) {
  const carregar = useCallback(async () => {
    const servico = perfil === 'administracao' ? administrador : professor;
    const [curso, modulos, questionario] = await Promise.all([servico.buscarCurso(idCurso), idModulo ? servico.listarModulos(idCurso) : [], consultarQuestionario(perfil, idCurso, idModulo)]);
    const modulo = idModulo ? modulos.find((m) => String(m.id) === idModulo) : null;
    if (idModulo && !modulo) throw new Error('O módulo não pertence a este curso.');
    return { curso, modulo, questionario };
  }, [perfil, idCurso, idModulo]);
  const carga = useCarregamento(carregar);
  const voltar = perfil === 'administracao' ? `/administracao/cursos/${idCurso}` : idModulo ? `/professor/cursos/${idCurso}/modulos/${idModulo}/aulas` : `/professor/cursos/${idCurso}/modulos`;
  return <LayoutAulas><Link className="btn btn-link" to={voltar}>Voltar ao conteúdo</Link><CabecalhoAulas etiqueta="Gestão de avaliações" titulo={idModulo ? 'Questionário do módulo' : 'Avaliação do curso'} descricao="Cadastre as perguntas e as alternativas da avaliação." /><EstadoCarregamento carga={carga} />{!carga.carregando && !carga.erro && carga.dados && <FormularioQuestionario dados={carga.dados} perfil={perfil} idCurso={idCurso} idModulo={idModulo} />}</LayoutAulas>;
}

const novaPergunta = () => ({ enunciado: '', alternativas: ['', ''], alternativaCorreta: 0, explicacao: '' });

function FormularioQuestionario({ dados, perfil, idCurso, idModulo }) {
  const [titulo, setTitulo] = useState(dados.questionario?.titulo ?? (idModulo ? `Questionário: ${dados.modulo.titulo}` : `Avaliação: ${dados.curso.titulo}`));
  const limitePerguntas = idModulo ? 30 : 10;
  const [publicado, setPublicado] = useState(dados.questionario?.publicado ?? false);
  const [perguntas, setPerguntas] = useState(dados.questionario?.perguntas ?? [novaPergunta()]);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  function alterar(indice, campo, valor) {
    setPerguntas((lista) => lista.map((p, i) => i === indice ? { ...p, [campo]: valor } : p));
  }
  async function salvar(e) {
    e.preventDefault();
    if (processando) return;
    if (perguntas.length > limitePerguntas) {
      setErro(`Você pode salvar no máximo ${limitePerguntas} perguntas.`);
      return;
    }
    if (!titulo.trim() || perguntas.some((p) => !p.enunciado.trim() || !p.explicacao.trim() || p.alternativas.some((a) => !a.trim()))) { setErro('Preencha as perguntas, alternativas e explicações.'); return; }
    setProcessando(true); setErro(''); setMensagem('');
    try {
      const salvo = await salvarQuestionario(perfil, idCurso, idModulo, { titulo: titulo.trim(), publicado, perguntas: perguntas.map(({ enunciado, alternativas, alternativaCorreta, explicacao }) => ({ enunciado, alternativas, alternativaCorreta, explicacao })) });
      setMensagem(`Avaliação salva como ${salvo.publicado ? 'publicada' : 'rascunho'}. Versão ${salvo.versao}.`);
    } catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }
  return <form className="card editor-questionario" onSubmit={salvar}><h2>{dados.modulo?.titulo ?? dados.curso.titulo}</h2><p className="texto-suave">Até {limitePerguntas} perguntas, com 2 a 6 alternativas. Cada alteração salva cria uma nova versão; os alunos precisarão responder novamente para atualizar o resultado.</p>{erro && <p className="mensagem-erro" role="alert">{erro}</p>}{mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}<fieldset disabled={processando}><label htmlFor="questionario-titulo">Título da avaliação</label><input className="input-field" id="questionario-titulo" value={titulo} maxLength={255} required onChange={(e) => setTitulo(e.target.value)} />
    {perguntas.map((p, indice) => <fieldset className="editor-pergunta" key={indice}><legend>Pergunta {indice + 1}</legend>
      <label htmlFor={`enunciado-${indice}`}>Enunciado</label><textarea id={`enunciado-${indice}`} className="input-field" maxLength={1000} required value={p.enunciado} onChange={(e) => alterar(indice, 'enunciado', e.target.value)} />
      {p.alternativas.map((texto, opcao) => <div className="editor-alternativa" key={opcao}><label><input type="radio" name={`correta-${indice}`} checked={p.alternativaCorreta === opcao} onChange={() => alterar(indice, 'alternativaCorreta', opcao)} />Correta</label><label htmlFor={`alternativa-${indice}-${opcao}`}>Alternativa {opcao + 1}</label><input id={`alternativa-${indice}-${opcao}`} className="input-field" value={texto} maxLength={500} required onChange={(e) => alterar(indice, 'alternativas', p.alternativas.map((a, i) => i === opcao ? e.target.value : a))} /></div>)}
      <div className="acoes-topico"><button type="button" className="btn btn-secondary" disabled={p.alternativas.length >= 6} onClick={() => alterar(indice, 'alternativas', [...p.alternativas, ''])}>Adicionar alternativa</button><button type="button" className="btn btn-secondary" disabled={p.alternativas.length <= 2} onClick={() => { alterar(indice, 'alternativas', p.alternativas.slice(0, -1)); if (p.alternativaCorreta === p.alternativas.length - 1) alterar(indice, 'alternativaCorreta', 0); }}>Remover última alternativa</button></div>
      <label htmlFor={`explicacao-${indice}`}>Explicação exibida após a resposta</label><textarea id={`explicacao-${indice}`} className="input-field" maxLength={2000} required value={p.explicacao} onChange={(e) => alterar(indice, 'explicacao', e.target.value)} />
      <button type="button" className="btn btn-danger" disabled={perguntas.length <= 1} onClick={() => setPerguntas((lista) => lista.filter((_, i) => i !== indice))}>Remover pergunta</button>
    </fieldset>)}
    <button type="button" className="btn btn-secondary" disabled={perguntas.length >= limitePerguntas} onClick={() => setPerguntas((lista) => lista.length < limitePerguntas ? [...lista, novaPergunta()] : lista)}>Adicionar pergunta</button>
    <label className="editor-publicacao"><input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} />Disponibilizar avaliação para os alunos</label>
    </fieldset><button className="btn btn-primary" type="submit" disabled={processando}>{processando ? 'Salvando...' : 'Salvar avaliação'}</button></form>;
}
