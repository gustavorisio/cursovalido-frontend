import { useState } from 'react';
import Paginacao from '../comuns/Paginacao';
import PesquisaPagina from '../comuns/PesquisaPagina';
import { aplicarSuspensao, revogarSuspensao, excluirUsuarioAdministrativo } from '../../servicos/servicoAdministracao';

const FILTROS = [[null, 'Todos os usuários'], [true, 'Com restrição'], [false, 'Sem restrição']];

const ESCOPOS = { CONTA: 'Acesso à conta', FORUM: 'Acesso ao fórum', TOPICOS: 'Acesso a tópicos e comentários', COMENTARIOS: 'Acesso a tópicos e comentários' };

export default function ModeracaoUsuarios({ usuarios, processando, carregando = false, onExecutar, filtroRestricao = null, onFiltrarRestricao }) {
  const ocupado = processando || carregando;
  const [idSelecionado, setSelecionado] = useState(null);
  const selecionado = usuarios.find((usuario) => usuario.id === idSelecionado);
  const podeAplicarRestricao = selecionado?.podeModerar && selecionado.suspensoes.length === 0;
  const [escopo, setEscopo] = useState('FORUM');
  const [motivo, setMotivo] = useState('');
  const [permanente, setPermanente] = useState(false);
  const [expiraEm, setExpiraEm] = useState('');
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  function solicitar(evento) {
    evento.preventDefault();
    if (ocupado || !podeAplicarRestricao) return;
    if (!motivo.trim()) { setErro('Informe o motivo da restrição.'); return; }
    let expiracao = null;
    if (!permanente) {
      const data = new Date(expiraEm);
      if (!Number.isFinite(data.getTime())) { setErro('Informe uma data válida.'); return; }
      if (data.getTime() <= Date.now()) { setErro('A data de término deve estar no futuro.'); return; }
      expiracao = data.toISOString();
    }
    setErro('');
    const dados = { escopo, motivo: motivo.trim(), expiraEm: expiracao };
    onExecutar(async () => {
      await aplicarSuspensao(selecionado.id, dados);
      setSelecionado(null);
    }, `Aplicar restrição de ${ESCOPOS[escopo].toLowerCase()} a ${selecionado.nome}? ${permanente ? 'Ela permanecerá até ser revogada.' : `Término: ${new Date(expiracao).toLocaleString('pt-BR')}.`}`, 'Restrição aplicada.');
  }

  function excluir(usuario) {
    if (processando || !usuario.podeExcluir) return;
    onExecutar(async () => {
      await excluirUsuarioAdministrativo(usuario.id);
      if (selecionado?.id === usuario.id) setSelecionado(null);
    }, `Excluir a conta de ${usuario.nome}? O acesso será encerrado e os dados principais serão desidentificados. Cursos, publicações, aceites e registros necessários de auditoria serão preservados. Esta ação não pode ser desfeita.`, 'Conta excluída. Dados principais desidentificados e histórico preservado.');
  }

  const termo = busca.trim().toLowerCase();
  const resultados = termo ? usuarios.filter((usuario) => `${usuario.nome} ${usuario.email} ${usuario.perfil}`.toLowerCase().includes(termo)) : [];
  const equipe = usuarios.filter((usuario) => ['PROFESSOR', 'ADMINISTRADOR'].includes(usuario.perfil));
  const alunos = usuarios.filter((usuario) => !['PROFESSOR', 'ADMINISTRADOR'].includes(usuario.perfil));
  const grupos = termo ? [{ titulo: 'Resultados da busca', lista: resultados, vazio: 'Nenhum usuário encontrado.' }] : [
    { titulo: 'Alunos', lista: alunos, vazio: 'Nenhum aluno cadastrado.' },
    { titulo: 'Professores e administradores', lista: equipe, vazio: 'Nenhum professor ou administrador cadastrado.' },
  ];

  return <section className="card configuracoes-conta moderacao-usuarios">
    <h2 className="titulo-detalhe">Moderação de usuários</h2>
    <p className="texto-suave">Restrinja a conta inteira ou apenas ações do fórum. Restrições temporárias expiram automaticamente; permanentes podem ser revogadas.</p>
    <div className="administracao-resumo"><span><strong>{usuarios.length}</strong> contas</span><span><strong>{equipe.length}</strong> membros da equipe</span><span><strong>{usuarios.filter((usuario) => usuario.suspensoes.length > 0).length}</strong> com restrições</span></div>
    <p className="texto-suave">E-mails de alunos são exibidos parcialmente. Busque alunos pelo nome ou perfil; os e-mails completos da equipe ficam disponíveis à administração.</p>
    {onFiltrarRestricao && <div className="acoes-topico" role="group" aria-label="Filtrar usuários por restrição">
      {FILTROS.map(([valor, rotulo]) => <button key={rotulo} className={filtroRestricao === valor ? 'btn btn-primary' : 'btn btn-secondary'} type="button"
        aria-pressed={filtroRestricao === valor} disabled={ocupado} onClick={() => {
          if (filtroRestricao === valor) return;
          setSelecionado(null);
          onFiltrarRestricao(valor);
        }}>{rotulo}</button>)}
    </div>}
    <PesquisaPagina valor={busca} onAlterar={setBusca} rotulo="Buscar usuário" placeholder="Nome, perfil ou e-mail da equipe" />
    {!termo ? <p className="texto-suave">Digite um nome, e-mail ou perfil para encontrar um usuário.</p> : null}
    {podeAplicarRestricao ? <form className="formulario-publico moderacao-formulario" onSubmit={solicitar}>
      <h3>Restringir {selecionado.nome}</h3>
      {erro ? <p className="mensagem-erro" role="alert">{erro}</p> : null}
      <fieldset disabled={ocupado}>
        <label>Restrição<select value={escopo} onChange={(evento) => setEscopo(evento.target.value)}>{Object.entries(ESCOPOS).filter(([valor]) => valor !== 'COMENTARIOS').map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}</select></label>
        <label>Motivo<textarea className="input-field" required maxLength={1000} value={motivo} onChange={(evento) => setMotivo(evento.target.value)} /></label>
        <label className="checkbox"><input type="checkbox" checked={permanente} onChange={(evento) => setPermanente(evento.target.checked)} />Permanente, até revogação</label>
        {permanente ? null : <label>Término da restrição<input type="datetime-local" required value={expiraEm} onChange={(evento) => setExpiraEm(evento.target.value)} /></label>}
        <div className="acoes-topico">
          <button className="btn btn-danger" type="submit">Aplicar restrição</button>
          <button className="btn btn-secondary" type="button" onClick={() => setSelecionado(null)}>Cancelar</button>
        </div>
      </fieldset>
    </form> : null}
    {carregando && <p role="status">Carregando usuários...</p>}
    {(!carregando || usuarios.length > 0) && grupos.map(({ titulo, lista, vazio }) => <section key={titulo} aria-label={titulo}>
      <h3 className="titulo-respostas">{titulo} <span className="administracao-contagem">{lista.length}</span></h3>
      <Paginacao key={String(filtroRestricao) + termo} itens={lista} tamanho={10} rotulo={"Páginas de " + titulo.toLowerCase()} desabilitada={ocupado}>
        {(usuariosDaPagina) => <div className="moderacao-lista">
          {lista.length === 0 ? <p className="texto-suave">{vazio}</p> : null}
          {usuariosDaPagina.map((usuario) => <article key={usuario.id} className="moderacao-usuario">
            <div className="post-heading">
              <div><h3 className="topic-title">{usuario.nome}</h3><p className="texto-suave">{usuario.email}</p><div className="administracao-badges"><span>{usuario.perfil}</span><span className={usuario.ativo ? 'status-ativo' : ''}>{usuario.ativo ? 'Conta ativa' : 'Conta inativa'}</span></div></div>
              <div className="acoes-topico">
                {usuario.podeModerar && usuario.suspensoes.length === 0 ? <button className="btn btn-secondary btn-small" type="button" disabled={ocupado} onClick={() => { setSelecionado(usuario.id); setMotivo(''); setErro(''); }}>Aplicar restrição</button> : null}
                {usuario.podeExcluir ? <button className="btn btn-danger btn-small" type="button" disabled={ocupado} onClick={() => excluir(usuario)}>Excluir conta</button> : null}
              </div>
            </div>
            {usuario.suspensoes.length === 0 ? <p className="texto-suave">Sem restrições vigentes.</p> : null}
            {usuario.suspensoes.map((item) => <div className="moderacao-restricao" key={item.id}>
              <p className="content-text"><strong>{ESCOPOS[item.escopo]}</strong> · {item.expiraEm ? `Até ${new Date(item.expiraEm).toLocaleString('pt-BR')}` : 'Permanente'}</p>
              <p className="content-text">Motivo: {item.motivo}</p>
              {usuario.podeModerar ? <button className="btn btn-secondary btn-small" type="button" disabled={ocupado} onClick={() => onExecutar(() => revogarSuspensao(usuario.id, item.id), `Revogar esta restrição de ${usuario.nome}?`, 'Restrição revogada.')}>Revogar restrição</button> : null}
            </div>)}
          </article>)}
        </div>}
      </Paginacao>
    </section>)}
  </section>;
}
