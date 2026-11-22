import { useEffect, useRef, useState } from 'react';
import { carregarYoutube, mensagemErroPlayer } from '../servicos/youtubePlayer';

let carregamentoVimeo;

function carregarVimeo() {
  if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo);
  if (carregamentoVimeo) return carregamentoVimeo;
  carregamentoVimeo = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const limite = window.setTimeout(() => falhar(), 15000);
    function limpar() { window.clearTimeout(limite); script.onerror = null; }
    function falhar() { limpar(); script.remove(); carregamentoVimeo = null; reject(new Error('Não foi possível carregar o player do Vimeo.')); }
    script.src = 'https://player.vimeo.com/api/player.js';
    script.onload = () => { limpar(); window.Vimeo?.Player ? resolve(window.Vimeo) : falhar(); };
    script.onerror = falhar;
    document.head.appendChild(script);
  });
  return carregamentoVimeo;
}

function urlDeIncorporacao(url) {
  const endereco = new URL(url);
  const id = endereco.pathname.match(/(?:^|\/)(\d+)(?:\/|$)/)?.[1];
  if (!id) throw new Error('A URL do Vimeo não contém um identificador de vídeo válido.');
  const hash = endereco.searchParams.get('h') || endereco.pathname.match(/\/(\d+)\/([a-f\d]+)/i)?.[2];
  const embed = new URL(`https://player.vimeo.com/video/${id}`);
  if (hash) embed.searchParams.set('h', hash);
  return embed.toString();
}

export default function PlayerAula({ videoId, vimeoUrl, posicaoInicial = 0, onSalvar }) {
  const recipiente = useRef(null);
  const player = useRef(null);
  const retomada = useRef(posicaoInicial);
  const [inicio] = useState(posicaoInicial);
  const [tentativa, setTentativa] = useState(0);
  const [usarReserva, setUsarReserva] = useState(!vimeoUrl);
  const [erro, setErro] = useState('');
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    let iniciou = false;
    let falhou = false;
    let intervalo;
    let tempoListener;
    const posicaoDeInicio = retomada.current;
    let ultimaEnviada = posicaoDeInicio;
    const local = recipiente.current;

    function lerPosicao() {
      if (!iniciou || falhou) return null;
      if (usarReserva) {
        try {
          const segundos = player.current?.getCurrentTime();
          if (Number.isFinite(segundos)) retomada.current = Math.max(0, Math.floor(segundos));
        } catch { return null; }
      }
      return retomada.current;
    }

    async function salvar(aoSair = false) {
      if (typeof onSalvar !== 'function') return;
      const posicao = lerPosicao();
      if (posicao === null || posicao === ultimaEnviada) return;
      ultimaEnviada = posicao;
      const sucesso = await onSalvar(posicao, aoSair);
      if (!sucesso) ultimaEnviada = -1;
    }

    function aoOcultar() { if (document.visibilityState === 'hidden') salvar(true); }
    function aoSair() { salvar(true); }

    async function iniciarVimeo() {
      const Vimeo = await carregarVimeo();
      if (!ativo) return;
      const iframe = document.createElement('iframe');
      iframe.src = urlDeIncorporacao(vimeoUrl);
      iframe.title = 'Vídeo da aula no Vimeo';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.className = 'player-video-frame';
      local.replaceChildren(iframe);
      const instancia = new Vimeo.Player(iframe);
      player.current = instancia;
      tempoListener = (dados) => { if (Number.isFinite(dados.seconds)) retomada.current = Math.floor(dados.seconds); };
      instancia.on('timeupdate', tempoListener);
      instancia.on('play', () => { iniciou = true; falhou = false; });
      instancia.on('pause', () => salvar());
      instancia.on('ended', () => salvar());
      instancia.on('error', () => { if (ativo) { falhou = true; setPronto(false); setUsarReserva(true); } });
      await instancia.ready();
      if (posicaoDeInicio > 0) await instancia.setCurrentTime(posicaoDeInicio);
      if (ativo) setPronto(true);
      intervalo = window.setInterval(() => salvar(), 10000);
    }

    async function iniciarYouTube() {
      const elemento = document.createElement('div');
      local.replaceChildren(elemento);
      const YT = await carregarYoutube();
      if (!ativo) return;
      player.current = new YT.Player(elemento, {
        width: '100%', height: '100%', videoId,
        playerVars: { origin: window.location.origin, playsinline: 1, start: posicaoDeInicio },
        events: {
          onReady: (evento) => { if (ativo) { evento.target.getIframe().title = 'Vídeo da aula no YouTube'; setPronto(true); } },
          onStateChange: (evento) => {
            if (!ativo) return;
            if (evento.data === YT.PlayerState.PLAYING) { iniciou = true; falhou = false; }
            if ([YT.PlayerState.PAUSED, YT.PlayerState.ENDED].includes(evento.data)) salvar();
          },
          onError: (evento) => { if (ativo) { falhou = true; setErro(mensagemErroPlayer(evento.data)); } },
        },
      });
      intervalo = window.setInterval(() => salvar(), 10000);
    }

    document.addEventListener('visibilitychange', aoOcultar);
    window.addEventListener('pagehide', aoSair);
    (async () => {
      try {
        if (!usarReserva && vimeoUrl) await iniciarVimeo();
        else if (videoId) await iniciarYouTube();
        else throw new Error('Esta aula não tem um vídeo reserva configurado no YouTube.');
      } catch (falha) {
        if (!ativo) return;
        if (!usarReserva && videoId) { falhou = true; setPronto(false); setUsarReserva(true); }
        else setErro(falha.message || 'Não foi possível reproduzir este vídeo.');
      }
    })();

    return () => {
      ativo = false;
      salvar(true);
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoOcultar);
      window.removeEventListener('pagehide', aoSair);
      if (tempoListener) player.current?.off?.('timeupdate', tempoListener);
      player.current?.destroy?.();
      player.current = null;
      local?.replaceChildren();
    };
  }, [videoId, vimeoUrl, inicio, tentativa, usarReserva, onSalvar]);

  return <>
    <div className="acoes-topico" role="group" aria-label="Escolher servidor do vídeo">
      <button className={!usarReserva ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'} type="button" aria-pressed={!usarReserva} onClick={() => { setErro(''); setPronto(false); setUsarReserva(false); }}>Server 1 · Vimeo</button>
      <button className={usarReserva ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'} type="button" aria-pressed={usarReserva} onClick={() => { setErro(''); setPronto(false); setUsarReserva(true); }}>Server 2 · YouTube</button>
    </div>
    {erro ? <div className="mensagem-erro" role="alert">
      <p>{erro}</p>
      <button className="btn btn-secondary" type="button" onClick={() => { setErro(''); setPronto(false); setUsarReserva(!vimeoUrl); setTentativa((valor) => valor + 1); }}>Tentar carregar novamente</button>
    </div> : pronto ? null : <p className="texto-suave" role="status">Carregando vídeo{usarReserva ? ' de reserva' : ''}...</p>}
    <div className="video-wrapper min-h-[200px]" ref={recipiente} />
  </>;
}
