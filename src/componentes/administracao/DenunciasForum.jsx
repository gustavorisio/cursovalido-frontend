import { useCallback, useEffect, useState } from 'react';
import Paginacao from '../comuns/Paginacao';
import { decidirDenunciaForum, listarDenunciasForum } from '../forum/servicos/servicoForum';

const ROTULOS_MOTIVO = { OFENSA: 'Ofensa', ASSEDIO: 'Assédio', DISCRIMINACAO: 'Discriminação', CONTEUDO_IMPROPRIO: 'Conteúdo impróprio', DADOS_PESSOAIS: 'Dados pessoais', SPAM: 'Spam', OUTRO: 'Outro' };

function converterPrazoRestricao(valor) {
  const data = new Date(valor);
  return Number.isFinite(data.getTime()) && data.getTime() > Date.now() ? data.toISOString() : null;
}

export default function DenunciasForum() {
  const [status, setStatus] = useState('PENDENTE');
  const [denuncias, setDenuncias] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(null);
  const [observacoes, setObservacoes] = useState({});
  const [restricoes, setRestricoes] = useState({});

  const carregar = useCallback(async () => {
    setCarregando(true); setErro('');
    try {
      const resultado = await listarDenunciasForum(status);
      setDenuncias(Array.isArray(resultado) ? resultado : resultado?.content ?? []);
    } catch (falha) { setErro(falha.message || 'Não foi possível carregar as denúncias.'); }
    finally { setCarregando(false); }
  }, [status]);

  useEffect(() => { queueMicrotask(carregar); }, [carregar]);

  async function decidir(denuncia, procedente, removerConteudo) {
    const observacao = observacoes[denuncia.id]?.trim();
    if (!observacao) { setErro('Informe uma observação para registrar a decisão.'); return; }
    const restricao = restricoes[denuncia.id] ?? {};
    let expiraEm = null;
    if (procedente && restricao.aplicar) {
      if (!restricao.permanente) {
        expiraEm = converterPrazoRestricao(restricao.expiraEm);
        if (!expiraEm) { setErro('Informe uma data de término futura para a restrição.'); return; }
      }
    }
    setProcessando(denuncia.id); setErro('');
    try {
      await decidirDenunciaForum(denuncia.id, { procedente, removerConteudo, observacao,
        aplicarRestricao: Boolean(procedente && restricao.aplicar),
        escopoRestricao: restricao.escopo ?? 'FORUM', expiraEm });
      await carregar();
    } catch (falha) { setErro(falha.message || 'Não foi possível decidir esta denúncia.'); }
    finally { setProcessando(null); }
  }

  return <section className="space-y-4" aria-labelledby="denuncias-forum-titulo">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="titulo-detalhe" id="denuncias-forum-titulo">Denúncias do fórum</h2><p className="texto-suave">O denunciante não é exibido. Avalie o conteúdo e registre o motivo da decisão.</p></div>
      <label className="text-sm font-medium">Status
        <select className="input-field ml-2" value={status} onChange={(evento) => setStatus(evento.target.value)}>
          <option value="PENDENTE">Pendentes</option><option value="PROCEDENTE">Procedentes</option><option value="IMPROCEDENTE">Improcedentes</option><option value="">Todas</option>
        </select>
      </label>
    </div>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    {carregando ? <p className="texto-suave" role="status">Carregando denúncias…</p> : denuncias.length === 0 ? <p className="card texto-suave">Não há denúncias para este filtro.</p> : <Paginacao itens={denuncias} tamanho={10} rotulo="Páginas de denúncias" desabilitada={Boolean(processando)}>
      {(pagina) => <div className="space-y-4">{pagina.map((denuncia) => <article className="card space-y-3" key={denuncia.id}>
        <div className="flex flex-wrap items-start justify-between gap-2"><div><span className="badge">{denuncia.tipo === 'TOPICO' ? 'Tópico' : 'Comentário'}</span> <strong>{ROTULOS_MOTIVO[denuncia.motivo] ?? denuncia.motivo}</strong><p className="texto-suave">Autor: {denuncia.nomeAutor || `Usuário ${denuncia.idAutor ?? ''}`}{denuncia.gamertagAutor && <> · Gamertag: {denuncia.gamertagAutor}</>} · {denuncia.denunciasPendentesDoConteudo} denúncia(s) pendente(s)</p></div><span className="badge">{denuncia.status}</span></div>
        <blockquote className="border-l-2 border-slate-300 pl-4 text-slate-700">{denuncia.trecho || 'Conteúdo indisponível'}</blockquote>
        {denuncia.descricao && <p><strong>Relato:</strong> {denuncia.descricao}</p>}
        <p className="texto-suave">{denuncia.conteudoAtivo ? 'Conteúdo ativo' : 'Conteúdo já removido'} · {denuncia.criadaEm ? new Date(denuncia.criadaEm).toLocaleString('pt-BR') : ''}</p>
        {denuncia.status === 'PENDENTE' ? <>
          <label className="block text-sm font-medium">Observação da moderação (obrigatória)
            <textarea className="input-field mt-1 w-full" maxLength={1000} rows={2} value={observacoes[denuncia.id] ?? ''} onChange={(evento) => setObservacoes((atual) => ({ ...atual, [denuncia.id]: evento.target.value }))} />
          </label>
          <fieldset className="space-y-3" disabled={Boolean(processando)}>
            <legend className="font-semibold">Restrição ao autor (opcional)</legend>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(restricoes[denuncia.id]?.aplicar)} onChange={(evento) => setRestricoes((atual) => ({ ...atual, [denuncia.id]: { ...atual[denuncia.id], aplicar: evento.target.checked } }))} />Aplicar restrição se a denúncia for procedente</label>
            {restricoes[denuncia.id]?.aplicar && <div className="space-y-3">
              <label className="block text-sm font-medium">Restrição
                <select className="input-field mt-1" value={restricoes[denuncia.id]?.escopo ?? 'FORUM'} onChange={(evento) => setRestricoes((atual) => ({ ...atual, [denuncia.id]: { ...atual[denuncia.id], escopo: evento.target.value } }))}><option value="FORUM">Acesso ao fórum</option><option value="CONTA">Acesso à conta</option></select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(restricoes[denuncia.id]?.permanente)} onChange={(evento) => setRestricoes((atual) => ({ ...atual, [denuncia.id]: { ...atual[denuncia.id], permanente: evento.target.checked } }))} />Permanente, até revogação</label>
              {!restricoes[denuncia.id]?.permanente && <label className="block text-sm font-medium">Término da restrição<input className="input-field mt-1" type="datetime-local" required value={restricoes[denuncia.id]?.expiraEm ?? ''} onChange={(evento) => setRestricoes((atual) => ({ ...atual, [denuncia.id]: { ...atual[denuncia.id], expiraEm: evento.target.value } }))} /></label>}
            </div>}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-danger btn-small" type="button" disabled={Boolean(processando)} onClick={() => decidir(denuncia, true, true)}>Aprovar denúncia</button>
            <button className="btn btn-secondary btn-small" type="button" disabled={Boolean(processando)} onClick={() => decidir(denuncia, false, false)}>Recusar denúncia</button>
          </div>
        </> : denuncia.observacaoModeracao && <p><strong>Decisão da moderação:</strong> {denuncia.observacaoModeracao}</p>}
      </article>)}</div>}
    </Paginacao>}
  </section>;
}
