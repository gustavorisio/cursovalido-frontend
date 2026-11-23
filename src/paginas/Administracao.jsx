import CabecalhoPagina from '../componentes/comuns/CabecalhoPagina';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import ConfirmacaoModal from '../componentes/forum/componentes/ConfirmacaoModal';
import Rodape from '../componentes/comuns/Rodape';
import ModeracaoUsuarios from '../componentes/administracao/ModeracaoUsuarios';
import DenunciasForum from '../componentes/administracao/DenunciasForum';
import VoltarAdministracao from '../componentes/administracao/VoltarAdministracao';
import {
  aprovarConvite, buscarConvites, buscarConvitesPendentes, cancelarConvite,
  criarConvite, rejeitarConvite, removerPendenciaConvite, reenviarConvite,
  buscarPoliticasAtivas, publicarPolitica, buscarPrivacidadeAtiva, publicarPrivacidade,
} from '../servicos/servicoAutenticacao';
import { buscarPermissoesAdministrativas, buscarUsuariosAdministrativos } from '../servicos/servicoAdministracao';
import { atualizarVideoInicio, buscarVideoInicio } from '../servicos/servicoVideoInicio';
import { useAutenticacao } from '../contextos/useAutenticacao';
import { validarDocumento } from '../servicos/validacoesFormulario';
import { textoSimples } from '../servicos/textoSimples';


export default function Administracao({ tela = 'geral' }) {
  const { sessao } = useAutenticacao();
  const [usuarios, setUsuarios] = useState(null);
  const [filtroRestricao, setFiltroRestricao] = useState(null);
  const [principal, setPrincipal] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [convites, setConvites] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('PROFESSOR');
  const [mensagem, setMensagem] = useState('');
  const [processando, setProcessando] = useState(false);
  const emAndamento = useRef(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [politica, setPolitica] = useState(null);
  const [nomePolitica, setNomePolitica] = useState('');

  const [conteudoPolitica, setConteudoPolitica] = useState('');
  const [videoInicio, setVideoInicio] = useState('');

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const permissoes = await buscarPermissoesAdministrativas();
      setPrincipal(permissoes.principal);
      const tarefas = [];
      if (tela === 'usuarios') tarefas.push(buscarUsuariosAdministrativos(filtroRestricao).then(setUsuarios));
      if (permissoes.principal && tela === 'termos') {
        tarefas.push(buscarPoliticasAtivas().then((politicas) => {
          const atual = politicas[0] ?? null;
          setPolitica(atual);
          setNomePolitica(atual?.nome ?? '');
          setConteudoPolitica(textoSimples(atual?.conteudo ?? ''));
        }));
      }
      if (permissoes.principal && tela === 'privacidade') {
        tarefas.push(buscarPrivacidadeAtiva().then((atual) => {
          setPolitica(atual);
          setNomePolitica(atual?.nome ?? '');
          setConteudoPolitica(textoSimples(atual?.conteudo ?? ''));
        }));
      }
      if (permissoes.principal && tela === 'convites') {
        tarefas.push(buscarConvites().then(setConvites), buscarConvitesPendentes().then(setPendentes));
      }
      if (permissoes.principal && tela === 'video') {
        tarefas.push(buscarVideoInicio().then((video) => setVideoInicio(video.vimeoUrl ?? '')));
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
  }, [tela, filtroRestricao]);

  useEffect(() => { queueMicrotask(carregarDados); }, [carregarDados]);

  function filtrarUsuarios(valor) {
    setErro('');
    setUsuarios([]);
    setCarregando(true);
    setFiltroRestricao(valor);
  }

  async function acionar(acao, sucesso) {
    if (emAndamento.current) return;
    emAndamento.current = true;
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
      emAndamento.current = false;
      setProcessando(false);
      setConfirmacao(null);
    }
  }

  function solicitar(acao, texto, sucesso) {
    if (processando || emAndamento.current) return;
    setConfirmacao({ acao, texto, sucesso });
  }

  function convidar(evento) {
    evento.preventDefault();
    if (!principal) return;
    if (!email.trim()) return;
    acionar(async () => { await criarConvite(email.trim(), perfil); setEmail(''); }, 'Convite enviado. A pessoa convidada cria a conta pelo link recebido no e-mail.');
  }

  function publicar(evento) {
    evento.preventDefault();
    const erroValidacao = validarDocumento(nomePolitica, conteudoPolitica);
    if (erroValidacao) { setErro(erroValidacao); return; }
    setErro('');
    const aviso = politica
      ? 'Publicar esta versão arquivará a atual. Os usuários precisarão revisar os documentos e confirmar o aceite após se autenticar. Deseja continuar?'
      : 'Publicar este documento para habilitar o cadastro e o aceite dos usuários?';
    solicitar(async () => {
      const publicarDocumento = tela === 'privacidade' ? publicarPrivacidade : publicarPolitica;
      await publicarDocumento(nomePolitica.trim(), conteudoPolitica.trim());

      setConteudoPolitica('');
    }, aviso, politica ? 'Nova versão publicada.' : 'Documento publicado.');
  }

  function salvarVideoInicio(evento) {
    evento.preventDefault();
    const url = videoInicio.trim();
    if (url) {
      try {
        const endereco = new URL(url);
        if (endereco.protocol !== 'https:'
          || !['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(endereco.hostname.toLowerCase())
          || !/(?:^|\/)(\d+)(?:\/|$)/.test(endereco.pathname)) throw new Error();
      } catch {
        setErro('Informe uma URL HTTPS válida de vídeo do Vimeo.');
        return;
      }
    }
    acionar(() => atualizarVideoInicio(url || null), url ? 'Vídeo de apresentação atualizado.' : 'Vídeo de apresentação removido.');
  }

  return <div className="app-container"><main className="main-content administracao">
    {tela !== 'geral' && <VoltarAdministracao />}
    <CabecalhoPagina etiqueta="Gestão da plataforma" titulo={({ termos: 'Termos de Aceite', privacidade: 'Política de Privacidade', usuarios: 'Moderação de usuários', convites: 'Convites', denuncias: 'Denúncias do fórum', video: 'Vídeo da página inicial' })[tela] ?? 'Administração'} descricao={`Administrador: ${sessao?.nome}`} />
    <nav className="administracao-navegacao" aria-label="Ferramentas administrativas">
      <NavLink to="/administracao/usuarios">Usuários</NavLink>
      <NavLink to="/administracao/forum/denuncias">Denúncias do fórum</NavLink>
      {principal && <NavLink to="/administracao/convites">Convites</NavLink>}
      {principal && <><NavLink to="/administracao/termos">Termos de Aceite</NavLink><NavLink to="/administracao/privacidade">Privacidade</NavLink></>}
      {principal && <NavLink to="/administracao/inicio">Vídeo da página inicial</NavLink>}
      <NavLink to="/administracao/dashboard">Dashboard</NavLink>
      <NavLink to="/administracao/comunicados">Comunicados</NavLink>
    </nav>
    {erro ? <div className="mensagem-erro" role="alert">{erro}<div><button className="btn btn-secondary" type="button" disabled={carregando} onClick={() => { setErro(''); carregarDados(); }}>Tentar novamente</button></div></div> : null}
    {mensagem ? <div className="mensagem-sucesso" role="status">{mensagem}</div> : null}
    {carregando && (tela !== "usuarios" || usuarios === null) ? <p className="texto-suave" role="status">Carregando administração...</p> : <>
      {tela === 'geral' ? <section className="card configuracoes-conta" aria-labelledby="perfil-administrador">
        <h2 className="titulo-detalhe" id="perfil-administrador">Meu perfil administrativo</h2>
        <p className="texto-suave">Dados do administrador conectado à plataforma.</p>
        <dl className="administracao-perfil">
          <div><dt>Nome</dt><dd>{sessao?.nome ?? 'Não informado'}</dd></div>
          <div><dt>Perfil</dt><dd>Administrador</dd></div>
          <div><dt>Identificação da conta</dt><dd>{sessao?.idUsuario ?? 'Não informada'}</dd></div>
          <div><dt>Permissão administrativa</dt><dd>{principal ? 'Root (conta protegida)' : 'Administrador'}</dd></div>
        </dl>
        <Link className="btn btn-secondary" to="/configuracoes">Configurações da minha conta</Link>
      </section> : null}
      {['termos', 'privacidade', 'video', 'convites'].includes(tela) && !principal ? <p className="mensagem-erro" role="alert">Esta tela está disponível apenas para o root.</p> : null}
      {principal ? <>
        {tela === 'convites' ? <>
          <section className="card configuracoes-conta">
            <h2 className="titulo-detalhe">Convidar professor ou administrador</h2>
            <form className="formulario-publico" onSubmit={convidar}>
              <label>E-mail<input required type="email" maxLength={254} value={email} onChange={(evento) => setEmail(evento.target.value)} /></label>
              <label>Perfil<select value={perfil} onChange={(evento) => setPerfil(evento.target.value)}><option value="PROFESSOR">Professor</option>{principal && <option value="ADMINISTRADOR">Administrador</option>}</select></label>
              <button className="btn btn-primary" disabled={processando}>{processando ? 'Enviando...' : 'Enviar convite'}</button>
            </form>
          </section>
        </> : null}
        {['termos', 'privacidade'].includes(tela) ? <section className="card configuracoes-conta">
          <h2 className="titulo-detalhe">{tela === 'privacidade' ? 'Editar política de privacidade' : 'Editar termos'}</h2>
          <p className="texto-suave">Versão vigente: {politica?.versao ?? 'Nenhuma versão publicada'}</p>
          <form className="formulario-publico" onSubmit={publicar}>
            <label>Nome do documento<input required maxLength={255} value={nomePolitica} onChange={(evento) => setNomePolitica(evento.target.value)} /></label>
            {!politica && <p className="texto-suave">Nenhum documento foi publicado. Cadastre aqui o conteúdo oficial para liberar o cadastro de usuários.</p>}
            <p className="texto-suave">A versão será incrementada automaticamente ao publicar.</p>
            <p className="texto-suave">O conteúdo pode ser escrito em texto simples ou HTML básico (títulos, parágrafos e listas).</p>
            <label>Conteúdo<textarea className="input-field" required maxLength={10000} rows={12} value={conteudoPolitica} onChange={(evento) => setConteudoPolitica(evento.target.value)} /></label>
            <button className="btn btn-primary" disabled={processando}>{politica ? 'Publicar nova versão' : 'Publicar documento'}</button>
          </form>
        </section> : null}
        {tela === 'video' ? <section className="card configuracoes-conta">
          <h2 className="titulo-detalhe">Vídeo de apresentação</h2>
          <p className="texto-suave">O vídeo será exibido centralizado na página inicial, logo abaixo do banner. Use um link HTTPS do Vimeo; links com hash de privacidade também são aceitos. Deixe o campo vazio para remover o vídeo.</p>
          <form className="formulario-publico" onSubmit={salvarVideoInicio}>
            <label htmlFor="video-inicio-vimeo">URL do vídeo no Vimeo</label>
            <input id="video-inicio-vimeo" type="url" maxLength={2048} value={videoInicio} onChange={(evento) => setVideoInicio(evento.target.value)} placeholder="https://vimeo.com/123456789" />
            <button className="btn btn-primary" type="submit" disabled={processando}>{processando ? 'Salvando...' : 'Salvar vídeo'}</button>
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
          {pendentes.length > 0 ? <section className="card configuracoes-conta">
            <h2 className="titulo-detalhe">Cadastros aguardando aprovação</h2>
            <p className="texto-suave">Cadastros feitos antes da mudança no fluxo de convite. Os novos convites já liberam o acesso ao concluir o cadastro.</p>
            {pendentes.map((item) => <div className="post-heading administracao-registro" key={item.id}>
              <p>{item.nomeCompleto ?? item.email} · {item.email} · {item.perfil}</p>
              <div className="acoes-topico">
                <button className="btn btn-primary btn-small" type="button" disabled={processando} onClick={() => solicitar(() => aprovarConvite(item.id), 'Aprovar este cadastro?', 'Cadastro aprovado.')}>Aprovar</button>
                <button className="btn btn-secondary btn-small" type="button" disabled={processando} onClick={() => solicitar(() => rejeitarConvite(item.id), 'Rejeitar este cadastro?', 'Cadastro rejeitado.')}>Rejeitar</button>
                <button className="btn btn-danger btn-small" type="button" disabled={processando} onClick={() => solicitar(() => removerPendenciaConvite(item.id), 'Remover esta pendência?', 'Pendência removida.')}>Remover</button>
              </div>
            </div>)}
          </section> : null}
        </> : null}
      </> : null}
      {tela === 'usuarios' ? <ModeracaoUsuarios usuarios={usuarios ?? []} processando={processando} carregando={carregando} filtroRestricao={filtroRestricao} onFiltrarRestricao={filtrarUsuarios} onExecutar={solicitar} /> : null}
      {tela === 'denuncias' ? <DenunciasForum /> : null}
    </>}
    {confirmacao ? <ConfirmacaoModal titulo="Confirmar ação" processando={processando} mensagem={confirmacao.texto} onConfirmar={() => { if (!processando) acionar(confirmacao.acao, confirmacao.sucesso); }} onCancelar={() => { if (!processando) setConfirmacao(null); }} /> : null}
  </main><Rodape /></div>;
}
