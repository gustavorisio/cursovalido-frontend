import { useEffect, useRef, useState } from 'react';
import { carregarYoutube, mensagemErroPlayer } from '../servicos/youtubePlayer';

export default function PlayerAula({ videoId, posicaoInicial = 0, onSalvar }) {
  const recipiente = useRef(null);
  const player = useRef(null);
  const retomada = useRef(posicaoInicial);
  const [inicio] = useState(posicaoInicial);
  const [tentativa, setTentativa] = useState(0);
  const [erro, setErro] = useState('');
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    let iniciou = false;
    let falhou = false;
    let intervalo;
    const posicaoDeInicio = retomada.current;
    let ultimaEnviada = posicaoDeInicio;
    const elemento = document.createElement('div');
    const local = recipiente.current;
    local.appendChild(elemento);

    function lerPosicao() {
      if (!iniciou) return null;
      if (falhou) return null;
      let segundos;
      try {
        segundos = player.current?.getCurrentTime();
      } catch {
        return null;
      }
      if (!Number.isFinite(segundos)) return null;
      retomada.current = Math.max(0, Math.floor(segundos));
      return retomada.current;
    }

    async function salvar(aoSair = false) {
      if (typeof onSalvar !== 'function') return;
      const posicao = lerPosicao();
      if (posicao === null) return;
      if (posicao === ultimaEnviada) return;
      ultimaEnviada = posicao;
      const sucesso = await onSalvar(posicao, aoSair);
      if (!sucesso) ultimaEnviada = -1;
    }

    function aoOcultar() {
      if (document.visibilityState === 'hidden') salvar(true);
    }

    function aoSair() { salvar(true); }

    async function criarPlayer() {
      try {
        const YT = await carregarYoutube();
        if (!ativo) return;
        player.current = new YT.Player(elemento, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: { origin: window.location.origin, playsinline: 1, start: posicaoDeInicio },
          events: {
            onReady: (evento) => {
              if (!ativo) return;
              evento.target.getIframe().title = 'Vídeo da aula';
              setPronto(true);
            },
            onStateChange: (evento) => {
              if (!ativo) return;
              if (evento.data === YT.PlayerState.PLAYING) {
                iniciou = true;
                falhou = false;
              }
              if ([YT.PlayerState.PAUSED, YT.PlayerState.ENDED].includes(evento.data)) salvar();
            },
            onError: (evento) => {
              if (!ativo) return;
              falhou = true;
              setErro(mensagemErroPlayer(evento.data));
            },
          },
        });
        intervalo = window.setInterval(() => salvar(), 10000);
      } catch (falha) {
        if (ativo) setErro(falha.message);
      }
    }

    document.addEventListener('visibilitychange', aoOcultar);
    window.addEventListener('pagehide', aoSair);
    criarPlayer();

    return () => {
      ativo = false;
      salvar(true);
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoOcultar);
      window.removeEventListener('pagehide', aoSair);
      player.current?.destroy();
      player.current = null;
      local.replaceChildren();
    };
  }, [videoId, inicio, tentativa, onSalvar]);

  return <>
    {erro ? <div className="mensagem-erro" role="alert">
      <p>{erro}</p>
      <button className="btn btn-secondary" type="button" onClick={() => { setErro(''); setPronto(false); setTentativa((valor) => valor + 1); }}>Tentar carregar novamente</button>
    </div> : pronto ? null : <p className="texto-suave" role="status">Carregando vídeo...</p>}
    <div className="video-wrapper min-h-[200px]" ref={recipiente} />
  </>;
}
