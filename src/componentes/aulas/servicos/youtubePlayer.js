let carregamento = null;

export function carregarYoutube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (carregamento) return carregamento;

  carregamento = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const callbackAnterior = window.onYouTubeIframeAPIReady;
    const tempoLimite = window.setTimeout(() => falhar(), 15000);

    function limpar() {
      window.clearTimeout(tempoLimite);
      script.onerror = null;
      window.onYouTubeIframeAPIReady = callbackAnterior;
    }

    function falhar() {
      limpar();
      script.remove();
      carregamento = null;
      reject(new Error('Não foi possível carregar o player do YouTube. Verifique sua conexão e tente novamente.'));
    }

    window.onYouTubeIframeAPIReady = () => {
      limpar();
      resolve(window.YT);
      if (typeof callbackAnterior === 'function') callbackAnterior();
    };
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = falhar;
    document.head.appendChild(script);
  });
  return carregamento;
}

export function mensagemErroPlayer(codigo) {
  if (codigo === 100) return 'Este vídeo foi removido, está privado ou não está disponível.';
  if ([101, 150].includes(codigo)) return 'O responsável pelo vídeo bloqueou a reprodução em outros sites.';
  if (codigo === 153) return 'O YouTube não conseguiu identificar o site. Verifique as restrições de privacidade do navegador.';
  if (codigo === 2) return 'O identificador deste vídeo é inválido.';
  return 'Não foi possível reproduzir este vídeo. Ele pode ter restrições de acesso. Tente novamente ou avise o professor.';
}
