import CabecalhoPagina from '../componentes/comuns/CabecalhoPagina';
import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import ConfirmacaoModal from '../componentes/forum/componentes/ConfirmacaoModal';
import Rodape from '../componentes/comuns/Rodape';
import ModeracaoUsuarios from '../componentes/administracao/ModeracaoUsuarios';
import VoltarAdministracao from '../componentes/administracao/VoltarAdministracao';
import {
  aprovarConvite, buscarConvites, buscarConvitesPendentes, cancelarConvite,
  criarConvite, rejeitarConvite, removerPendenciaConvite, reenviarConvite,
  buscarPoliticasAtivas, publicarPolitica, buscarPrivacidadeAtiva, publicarPrivacidade,
} from '../servicos/servicoAutenticacao';
import { buscarPermissoesAdministrativas, buscarUsuariosAdministrativos } from '../servicos/servicoAdministracao';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { validarDocumento } from '../servicos/validacoesFormulario';


export default function Administracao({ tela = 'geral' }) {
  const { sessao } = useAutenticacao();
  const [usuarios, setUsuarios] = useState([]);
  const [principal, setPrincipal] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [convites, setConvites] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('PROFESSOR');
  const [mensagem, setMensagem] = useState('');
  const [processando, setProcessando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [politica, setPolitica] = useState(null);
  const [nomePolitica, setNomePolitica] = useState(tela === 'privacidade' ? 'Política de Privacidade' : 'Termos de Aceite');
  const [versaoPolitica, setVersaoPolitica] = useState('');
  const [conteudoPolitica, setConteudoPolitica] = useState('');

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const permissoes = await buscarPermissoesAdministrativas();
      setPrincipal(permissoes.principal);
      const tarefas = [];
      if (tela === 'usuarios') tarefas.push(buscarUsuariosAdministrativos().then(setUsuarios));
      if (permissoes.principal && tela === 'termos') {
        tarefas.push(buscarPoliticasAtivas().then((politicas) => {
          const atual = politicas[0] ?? null;
          setPolitica(atual);
          if (atual) { setNomePolitica(atual.nome); setConteudoPolitica(atual.conteudo); }
        }));
      }
      if (permissoes.principal && tela === 'privacidade') {
        tarefas.push(buscarPrivacidadeAtiva().then((atual) => {
          setPolitica(atual);
          if (atual) { setNomePolitica(atual.nome); setConteudoPolitica(atual.conteudo); }
        }));
      }
      if (permissoes.principal && tela === 'convites') {
        tarefas.push(buscarConvites().then(setConvites), buscarConvitesPendentes().then(setPendentes));
      }
      const resultados = await Promise.allSettled(tarefas);
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected');
      if (falhas.length > 0) setErro(falhas.map((resultado) => resultado.reason.message).join(' '));
    } catch (falha) {
      setPrincipal(false);
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }, [tela]);

  useEffect(() => { queueMicrotask(carregarDados); }, [carregarDados]);

  async function acionar(acao, sucesso) {
    setProcessando(true);
    setErro('');
    setMensagem('');
    try {
      await acao();
      setMensagem(sucesso);
      await carregarDados();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setProcessando(false);
      setConfirmacao(null);
    }
  }

  function solicitar(acao, texto, sucesso) {
    if (processando) return;
    setConfirmacao({ acao, texto, sucesso });
  }

  function convidar(evento) {
    evento.preventDefault();
    acionar(async () => { await criarConvite(email.trim(), perfil); setEmail(''); }, 'Convite enviado com sucesso.');
  }

  function publicar(evento) {
    evento.preventDefault();
    const erroValidacao = validarDocumento(nomePolitica, versaoPolitica, conteudoPolitica);
    if (erroValidacao) { setErro(erroValidacao); return; }
    setErro('');
    solicitar(async () => {
      const publicarDocumento = tela === 'privacidade' ? publicarPrivacidade : publicarPolitica;
      await publicarDocumento(nomePolitica.trim(), versaoPolitica.trim(), conteudoPolitica.trim());
      setVersaoPolitica('');
      setConteudoPolitica('');
    }, 'Publicar esta versão arquivará a atual e exigirá novo aceite na próxima autenticação. As sessões abertas continuarão funcionando. Deseja continuar?', 'Nova versão publicada. O novo aceite será solicitado na próxima autenticação.');
  }

  return <div className="app-container"><main className="main-content administracao">
    {tela !== 'geral' && <VoltarAdministracao />}
    <CabecalhoPagina etiqueta="Gestão da plataforma" titulo={({ termos: 'Termos de Aceite', privacidade: 'Política de Privacidade', usuarios: 'Moderação de usuários', convites: 'Convites' })[tela] ?? 'Administração'} descricao={`Administrador: ${sessao?.nome}`} />
    <nav className="administracao-navegacao" aria-label="Ferramentas administrativas">
      <NavLink to="/administracao/usuarios">Usuários</NavLink>
      {principal && <><NavLink to="/administracao/termos">Termos de Aceite</NavLink><NavLink to="/administracao/privacidade">Privacidade</NavLink><NavLink to="/administracao/convites">Convites</NavLink></>}
      <NavLink to="/administracao/dashboard">Dashboard</NavLink>
      <NavLink to="/administracao/caminhos">Caminhos na tecnologia</NavLink>
    </nav>
    {erro ? <div className="mensagem-erro" role="alert">{erro}<div><button className="btn btn-secondary" type="button" disabled={carregando} onClick={() => { setErro(''); carregarDados(); }}>Tentar novamente</button></div></div> : null}
    {mensagem ? <div className="mensagem-sucesso" role="status">{mensagem}</div> : null}
    {carregando ? <p className="texto-suave" role="status">Carregando administração...</p> : <>
      {tela === 'geral' ? <section className="card configuracoes-conta" aria-labelledby="perfil-administrador">
        <h2 className="titulo-detalhe" id="perfil-administrador">Meu perfil administrativo</h2>
        <p className="texto-suave">Dados do administrador conectado à plataforma.</p>
        <dl className="administracao-perfil">
          <div><dt>Nome</dt><dd>{sessao?.nome ?? 'Não informado'}</dd></div>
          <div><dt>Perfil</dt><dd>Administrador</dd></div>
          <div><dt>Identificação da conta</dt><dd>{sessao?.idUsuario ?? 'Não informada'}</dd></div>
          <div><dt>Permissão administrativa</dt><dd>{principal ? 'Administrador principal' : 'Administrador'}</dd></div>
        </dl>
        <Link className="btn btn-secondary" to="/configuracoes">Configurações da minha conta</Link>
      </section> : null}
      {['termos', 'privacidade', 'convites'].includes(tela) && !principal ? <p className="mensagem-erro" role="alert">Esta tela está disponível apenas para o administrador principal.</p> : null}
      {principal ? <>
        {tela === 'convites' ? <>
          <section className="card configuracoes-conta">
            <h2 className="titulo-detalhe">Convidar professor ou administrador</h2>
            <form className="formulario-publico" onSubmit={convidar}>
              <label>E-mail<input required type="email" maxLength={254} value={email} onChange={(evento) => setEmail(evento.target.value)} /></label>
              <label>Perfil<select value={perfil} onChange={(evento) => setPerfil(evento.target.value)}><option value="PROFESSOR">Professor</option><option value="ADMINISTRADOR">Administrador</option></select></label>
              <button className="btn btn-primary" disabled={processando}>{processando ? 'Enviando...' : 'Enviar convite'}</button>
            </form>
          </section>
        </> : null}
        {['termos', 'privacidade'].includes(tela) ? <section className="card configuracoes-conta">
          <h2 className="titulo-detalhe">{tela === 'privacidade' ? 'Editar política de privacidade' : 'Editar termos'}</h2>
          <p className="texto-suave">Versão vigente: {politica?.versao ?? 'Nenhuma versão publicada'}</p>
          <form className="formulario-publico" onSubmit={publicar}>
            <label>Nome do documento<input required maxLength={255} value={nomePolitica} onChange={(evento) => setNomePolitica(evento.target.value)} /></label>
            <label>Nova versão<input required maxLength={30} value={versaoPolitica} onChange={(evento) => setVersaoPolitica(evento.target.value)} /></label>
            <p className="texto-suave">O conteúdo pode ser escrito em texto simples ou HTML básico (títulos, parágrafos e listas).</p>
            <label>Conteúdo<textarea className="input-field" required maxLength={10000} rows={12} value={conteudoPolitica} onChange={(evento) => setConteudoPolitica(evento.target.value)} /></label>
            <button className="btn btn-primary" disabled={processando}>Publicar nova versão</button>
          </form>
        </section> : null}
        {tela === 'convites' ? <>
          <section className="card configuracoes-conta">
            <h2 className="titulo-detalhe">Convites enviados</h2>
            {convites.length === 0 ? <p className="texto-suave">Nenhum convite pendente.</p> : null}
            {convites.map((convite) => <div className="post-heading administracao-registro" key={convite.id}>
              <p>{convite.email} · {convite.perfil} · {convite.status}</p>
              <div className="acoes-topico">
                <button className="btn btn-secondary btn-small" type="button" disabled={processando} onClick={() => solicitar(() => reenviarConvite(convite.id), 'Reenviar o convite? O link anterior deixará de funcionar.', 'Convite reenviado.')}>Reenviar</button>
                <button className="btn btn-danger btn-small" type="button" disabled={processando} onClick={() => solicitar(() => cancelarConvite(convite.id), 'Cancelar este convite?', 'Convite cancelado.')}>Cancelar</button>
              </div>
            </div>)}
          </section>
          <section className="card configuracoes-conta">
            <h2 className="titulo-detalhe">Cadastros aguardando aprovação</h2>
            {pendentes.length === 0 ? <p className="texto-suave">Nenhum cadastro pendente.</p> : null}
            {pendentes.map((item) => <div className="post-heading administracao-registro" key={item.id}>
              <p>{item.nomeCompleto ?? item.email} · {item.email} · {item.perfil}</p>
              <div className="acoes-topico">
                <button className="btn btn-primary btn-small" type="button" disabled={processando} onClick={() => solicitar(() => aprovarConvite(item.id), 'Aprovar este cadastro?', 'Cadastro aprovado.')}>Aprovar</button>
                <button className="btn btn-secondary btn-small" type="button" disabled={processando} onClick={() => solicitar(() => rejeitarConvite(item.id), 'Rejeitar este cadastro?', 'Cadastro rejeitado.')}>Rejeitar</button>
                <button className="btn btn-danger btn-small" type="button" disabled={processando} onClick={() => solicitar(() => removerPendenciaConvite(item.id), 'Remover esta pendência?', 'Pendência removida.')}>Remover</button>
              </div>
            </div>)}
          </section>
        </> : null}
      </> : null}
      {tela === 'usuarios' ? <ModeracaoUsuarios usuarios={usuarios} processando={processando} onExecutar={solicitar} /> : null}
    </>}
    {confirmacao ? <ConfirmacaoModal titulo="Confirmar ação" processando={processando} mensagem={confirmacao.texto} onConfirmar={() => { if (!processando) acionar(confirmacao.acao, confirmacao.sucesso); }} onCancelar={() => { if (!processando) setConfirmacao(null); }} /> : null}
  </main><Rodape /></div>;
}
