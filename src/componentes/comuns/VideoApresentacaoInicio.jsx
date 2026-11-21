import { useEffect, useState } from 'react';
import { buscarVideoInicio } from '../../servicos/servicoVideoInicio';

function urlIncorporacao(vimeoUrl) {
  const endereco = new URL(vimeoUrl);
  const id = endereco.pathname.match(/(?:^|\/)(\d+)(?:\/|$)/)?.[1];
  if (!id) return null;
  const hash = endereco.searchParams.get('h') || endereco.pathname.match(/\/(\d+)\/([a-f\d]+)/i)?.[2];
  const incorporacao = new URL(`https://player.vimeo.com/video/${id}`);
  if (hash) incorporacao.searchParams.set('h', hash);
  return incorporacao.toString();
}

export default function VideoApresentacaoInicio() {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let ativo = true;
    buscarVideoInicio()
      .then((dados) => { if (ativo) setUrl(dados.vimeoUrl || ''); })
      .catch(() => { if (ativo) setUrl(''); });
    return () => { ativo = false; };
  }, []);

  if (url === null || !url) return null;
  const embed = urlIncorporacao(url);
  if (!embed) return null;

  return <section aria-labelledby="video-apresentacao-titulo" className="mx-auto w-full max-w-[1120px]">
    <h2 id="video-apresentacao-titulo" className="mb-4 text-center text-xl font-semibold text-slate-800">Conheça o Curso Válido</h2>
    <div className="mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
      <iframe
        className="h-full w-full"
        src={embed}
        title="Vídeo de apresentação do Curso Válido"
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  </section>;
}
