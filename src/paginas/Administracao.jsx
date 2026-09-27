import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CabecalhoForum from '../componentes/forum/componentes/CabecalhoForum';
import Rodape from '../componentes/comuns/Rodape';
import {
  aprovarConvite, buscarConvites, buscarConvitesPendentes, cancelarConvite,
  criarConvite, rejeitarConvite, removerPendenciaConvite, reenviarConvite,
  buscarPoliticasAtivas, publicarPolitica
} from '../servicos/servicoAutenticacao';
import { buscarUsuarios } from '../componentes/forum/servicos/servicoForum';
import { useAutenticacao } from '../contextos/useAutenticacao';

function perfilDoUsuario(usuario) {
  const perfil = usuario?.perfil ?? usuario?.tipoPerfil ?? usuario?.role ?? usuario?.tipoUsuario;
  if (typeof perfil === 'object') return perfil.nome ?? perfil.descricao ?? perfil.codigo ?? 'Não informado';
  return perfil || 'Não informado';
}

export default function Administracao() {
  const { sessao } = useAutenticacao();
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [convites, setConvites] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('PROFESSOR');
  const [mensagem, setMensagem] = useState('');
  const [processando, setProcessando] = useState(false);
  const [politica, setPolitica] = useState(null);
  const [nomePolitica, setNomePolitica] = useState('Termos de Uso e Politica de Privacidade');
  const [versaoPolitica, setVersaoPolitica] = useState('');
  const [conteudoPolitica, setConteudoPolitica] = useState('');

  async function carregarDados() {
    setCarregando(true); setErro('');
    try {
      const [listaUsuarios, listaConvites, listaPendentes, politicasAtivas] = await Promise.all([buscarUsuarios(), buscarConvites(), buscarConvitesPendentes(), buscarPoliticasAtivas()]);
      setUsuarios(Array.isArray(listaUsuarios) ? listaUsuarios : listaUsuarios?.content || listaUsuarios?.itens || []);
      setConvites(Array.isArray(listaConvites) ? listaConvites : listaConvites?.content || listaConvites?.itens || []);
      setPendentes(Array.isArray(listaPendentes) ? listaPendentes : listaPendentes?.content || listaPendentes?.itens || []);
      const politicaAtual = Array.isArray(politicasAtivas) ? politicasAtivas[0] : politicasAtivas;
      setPolitica(politicaAtual || null);
    } catch (falha) { setErro(falha.message || 'Não foi possível carregar os dados administrativos.'); }
    finally { setCarregando(false); }
  }

  useEffect(() => {
    queueMicrotask(carregarDados);
  }, []);

  async function convidar(evento) {
    evento.preventDefault(); setProcessando(true); setErro(''); setMensagem('');
    try { await criarConvite(email, perfil); setEmail(''); setMensagem('Convite enviado com sucesso.'); await carregarDados(); }
    catch (falha) { setErro(falha.status === 409 ? 'E-mail já utilizado ou convite já existente.' : falha.message); }
    finally { setProcessando(false); }
  }

  async function executar(acao, id, confirmacao, sucesso) {
    if (!window.confirm(confirmacao)) return;
    setProcessando(true); setErro(''); setMensagem('');
    try { await acao(id); setMensagem(sucesso); await carregarDados(); }
    catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }

  async function publicar(evento) {
    evento.preventDefault();
    if (!window.confirm('Publicar uma nova versão arquivará a atual e exigirá novo aceite de todos os usuários. Deseja continuar?')) return;
    setProcessando(true); setErro(''); setMensagem('');
    try {
      await publicarPolitica(nomePolitica, versaoPolitica, conteudoPolitica);
      setVersaoPolitica(''); setConteudoPolitica('');
      setMensagem('Nova versão publicada. Os usuários deverão aceitar os termos novamente.');
      await carregarDados();
    } catch (falha) { setErro(falha.message); }
    finally { setProcessando(false); }
  }

  return <div className="app-container"><CabecalhoForum /><main className="main-content">
    <section className="card configuracoes-conta">
      <h1 className="page-title">Administração</h1>
      <p className="texto-suave">Administrador: {sessao?.nome}</p>
      <p className="texto-suave">Perfil: {sessao?.perfil}</p>
      <div className="acoes-configuracoes"><Link className="btn btn-secondary" to="/forum">Acessar fórum</Link></div>
    </section>
    {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
    {mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}
    <section className="card configuracoes-conta"><h2>Convidar professor ou administrador</h2><form className="formulario-publico" onSubmit={convidar}><label>E-mail<input required type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} /></label><label>Perfil<select value={perfil} onChange={(evento) => setPerfil(evento.target.value)}><option value="PROFESSOR">Professor</option><option value="ADMINISTRADOR">Administrador</option></select></label><button className="btn btn-primary" disabled={processando}>{processando ? 'Enviando...' : 'Enviar convite'}</button></form></section>
    <section className="card configuracoes-conta"><h2>Termos e LGPD</h2>{politica ? <p className="texto-suave">Versão vigente: {politica.versao}</p> : <p className="texto-suave">Nenhuma versão publicada.</p>}<form className="formulario-publico" onSubmit={publicar}><label>Nome do documento<input required maxLength={255} value={nomePolitica} onChange={(evento) => setNomePolitica(evento.target.value)} /></label><label>Nova versão<input required maxLength={30} placeholder="Ex.: 2.0" value={versaoPolitica} onChange={(evento) => setVersaoPolitica(evento.target.value)} /></label><label>Conteúdo<textarea required maxLength={10000} rows={12} value={conteudoPolitica} onChange={(evento) => setConteudoPolitica(evento.target.value)} /></label><button className="btn btn-primary" disabled={processando}>{processando ? 'Publicando...' : 'Publicar nova versão'}</button></form></section>
    <section className="card configuracoes-conta"><h2>Convites enviados</h2>{convites.length === 0 ? <p className="texto-suave">Nenhum convite encontrado.</p> : <ul>{convites.map((convite) => <li key={convite.id}><strong>{convite.email}</strong> · {convite.perfil} · {convite.status} · confirmado: {convite.emailConfirmado ? 'sim' : 'não'}<div><button className="btn btn-secondary btn-small" type="button" disabled={processando} onClick={() => executar(reenviarConvite, convite.id, 'Tem certeza que deseja reenviar este convite?', 'Convite reenviado com sucesso.')}>Reenviar</button><button className="btn btn-danger btn-small" type="button" disabled={processando} onClick={() => executar(cancelarConvite, convite.id, 'Tem certeza que deseja cancelar este convite?', 'Convite cancelado.')}>Cancelar</button></div></li>)}</ul>}</section>
    <section className="card configuracoes-conta"><h2>Cadastros aguardando aprovação</h2>{pendentes.length === 0 ? <p className="texto-suave">Nenhum cadastro pendente.</p> : <ul>{pendentes.map((pendente) => <li key={pendente.id}><strong>{pendente.nomeCompleto || pendente.email}</strong> · {pendente.email} · {pendente.perfil}<div><button className="btn btn-primary btn-small" type="button" disabled={processando} onClick={() => executar(aprovarConvite, pendente.id, 'Tem certeza que deseja aprovar este cadastro?', 'Cadastro aprovado com sucesso.')}>Aprovar</button><button className="btn btn-secondary btn-small" type="button" disabled={processando} onClick={() => executar(rejeitarConvite, pendente.id, 'Tem certeza que deseja rejeitar este cadastro?', 'Cadastro rejeitado.')}>Rejeitar</button><button className="btn btn-danger btn-small" type="button" disabled={processando} onClick={() => executar(removerPendenciaConvite, pendente.id, 'Tem certeza que deseja remover esta pendência?', 'Pendência removida.')}>Remover</button></div></li>)}</ul>}</section>
    <section className="card configuracoes-conta">
      <h2>Usuários do fórum</h2>
      {!erro && null}
      {carregando && <p className="texto-suave">Carregando usuários...</p>}
      {!carregando && !erro && <ul>{usuarios.map((usuario) => <li key={usuario.id ?? usuario.idUsuario}>{usuario.nome ?? usuario.nomeCompleto ?? 'Nome não informado'} · {perfilDoUsuario(usuario)}</li>)}</ul>}
    </section>
  </main><Rodape /></div>;
}