import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import LayoutAulas from './componentes/LayoutAulas';
import CabecalhoAulas from './componentes/CabecalhoAulas';
import EstadoCarregamento from './componentes/EstadoCarregamento';
import EditorCaminhos from './componentes/EditorCaminhos';
import ConfirmacaoModal from '../forum/componentes/ConfirmacaoModal';
import useCarregamento from './hooks/useCarregamento';
import { consultarPerguntasInteresses, consultarQuestionarioCaminhos, salvarQuestionarioCaminhos, excluirQuestionarioCaminhos, salvarSecaoCaminhos, excluirSecaoCaminhos } from './servicos/servicoAprendizagem';

export default function PaginaAdministracaoCaminhos() {
  const carregar = useCallback(() => consultarPerguntasInteresses(true), []);
  const carga = useCarregamento(carregar);
  const [aba, setAba] = useState('questionarios');
  const [editor, setEditor] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function executar(acao, sucesso) {
    if (processando) return;
    setProcessando(true); setErro(''); setMensagem('');
    try { await acao(); setEditor(null); setConfirmacao(null); setMensagem(sucesso); carga.tentarNovamente(); }
    catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }
  async function editarQuestionario(id) {
    if (processando) return;
    setProcessando(true); setErro(''); setMensagem('');
    try { setEditor({ tipo: 'questionario', dados: await consultarQuestionarioCaminhos(id, true) }); }
    catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }
  function criar() {
    setErro(''); setMensagem('');
    setEditor(aba === 'questionarios' ? { tipo: 'questionario', dados: { titulo: '', descricao: '', publicado: false, versao: 0, perguntaInicial: null, perguntas: [], resultados: [] } } : { tipo: 'secao', dados: { titulo: '', conteudo: '', ordem: (carga.dados?.secoes.length ?? 0) + 1, publicado: false } });
  }

  return <LayoutAulas>
    <Link className="btn btn-link" to="/administracao">Voltar à administração</Link>
    <CabecalhoAulas etiqueta="Gestão de conteúdo" titulo="Caminhos na tecnologia" descricao="Crie questionários com ramificações e resultados, e publique conteúdos explicativos sobre os caminhos da programação." acao={<Link className="btn btn-secondary" to="/roadmap">Ver página pública</Link>} />
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}{mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
    {editor ? editor.tipo === 'questionario' ? <EditorCaminhos dados={editor.dados} processando={processando} onCancelar={() => setEditor(null)} onSalvar={(dados) => executar(() => salvarQuestionarioCaminhos(editor.dados.id, dados), 'Questionário salvo. As alterações criaram uma nova versão.')} /> : <EditorSecao dados={editor.dados} processando={processando} onCancelar={() => setEditor(null)} onSalvar={(dados) => executar(() => salvarSecaoCaminhos(editor.dados.id, dados), 'Seção salva.')} /> : <>
      <div className="catalogo-abas caminhos-admin-abas" aria-label="Conteúdo para administrar"><button type="button" aria-pressed={aba === 'questionarios'} onClick={() => setAba('questionarios')}>Questionários</button><button type="button" aria-pressed={aba === 'secoes'} onClick={() => setAba('secoes')}>Seções explicativas</button></div>
      <EstadoCarregamento carga={carga} />
      {!carga.carregando && !carga.erro && carga.dados && <section className="card caminhos-admin-lista">
        <div className="catalogo-secao-cabecalho"><h2>{aba === 'questionarios' ? 'Questionários e caminhos' : 'Seções que abrem e fecham'}</h2><button className="btn btn-primary" type="button" disabled={processando} onClick={criar}>{aba === 'questionarios' ? 'Criar questionário' : 'Criar seção'}</button></div>
        {(aba === 'questionarios' ? carga.dados.questionarios : carga.dados.secoes).map((item) => <article key={item.id} className="caminhos-admin-item"><div><span className="aulas-etiqueta">{item.publicado ? 'Publicado' : 'Rascunho'}</span><h3>{item.titulo}</h3>{aba === 'secoes' && <p className="texto-suave">Ordem: {item.ordem}</p>}</div><div className="acoes-topico"><button className="btn btn-secondary" type="button" disabled={processando} onClick={() => { if (aba === 'questionarios') editarQuestionario(item.id); else { setEditor({ tipo: 'secao', dados: item }); setErro(''); } }}>Editar</button><button className="btn btn-danger" type="button" disabled={processando} onClick={() => setConfirmacao({ ...item, tipo: aba })}>Excluir</button></div></article>)}
        {(aba === 'questionarios' ? carga.dados.questionarios : carga.dados.secoes).length === 0 && <p className="texto-suave">Nenhum conteúdo cadastrado.</p>}
      </section>}
    </>}
    {confirmacao && <ConfirmacaoModal titulo="Excluir conteúdo" mensagem={`Excluir “${confirmacao.titulo}”? ${confirmacao.tipo === 'questionarios' ? 'O questionário será inativado. As respostas dos alunos serão preservadas.' : 'A seção será removida da página.'}`} processando={processando} onCancelar={() => { if (!processando) setConfirmacao(null); }} onConfirmar={() => executar(() => confirmacao.tipo === 'questionarios' ? excluirQuestionarioCaminhos(confirmacao.id) : excluirSecaoCaminhos(confirmacao.id), 'Conteúdo excluído.')} />}
  </LayoutAulas>;
}

function EditorSecao({ dados, processando, onSalvar, onCancelar }) {
  const [titulo, setTitulo] = useState(dados.titulo);
  const [conteudo, setConteudo] = useState(dados.conteudo);
  const [ordem, setOrdem] = useState(dados.ordem);
  const [publicado, setPublicado] = useState(dados.publicado);
  return <form className="card editor-caminhos" onSubmit={(e) => { e.preventDefault(); onSalvar({ titulo: titulo.trim(), conteudo: conteudo.trim(), ordem: Number(ordem), publicado }); }}>
    <h2>{dados.id ? 'Editar seção explicativa' : 'Criar seção explicativa'}</h2><fieldset disabled={processando}>
      <label htmlFor="secao-titulo">Título da seção</label><input className="input-field" id="secao-titulo" required maxLength={255} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <label htmlFor="secao-conteudo">Conteúdo explicativo</label><textarea className="input-field caminhos-editor-conteudo" id="secao-conteudo" required maxLength={20000} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
      <label htmlFor="secao-ordem">Ordem de apresentação</label><input className="input-field" id="secao-ordem" type="number" required min="1" step="1" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
      <label className="editor-publicacao"><input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} />Publicar seção</label>
    </fieldset><div className="acoes-topico"><button className="btn btn-primary" type="submit" disabled={processando}>{processando ? 'Salvando...' : 'Salvar seção'}</button><button className="btn btn-secondary" type="button" disabled={processando} onClick={onCancelar}>Cancelar</button></div>
  </form>;
}
