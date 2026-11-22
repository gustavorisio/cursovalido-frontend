import { test } from 'vitest';
import assert from 'node:assert/strict';
import { prepararTela, simularApi } from './apoio/tela.js';

let Video;
const { renderizar } = prepararTela(async (carregar) => {
  Video = (await carregar('componentes/comuns/VideoApresentacaoInicio.jsx')).default;
});

for (const [url, hash] of [['https://vimeo.com/123456/abc123', 'abc123'],
  ['https://player.vimeo.com/video/123456?h=abc456', 'abc456']]) {
  test(`vídeo inicial preserva privacidade do link ${url}`, async () => {
    simularApi(() => Response.json({ vimeoUrl: url }));
    await renderizar(Video);
    const iframe = document.querySelector('iframe');
    assert.ok(iframe);
    const embed = new URL(iframe.src);
    assert.equal(embed.origin, 'https://player.vimeo.com');
    assert.equal(embed.pathname, '/video/123456');
    assert.equal(embed.searchParams.get('h'), hash);
    assert.equal(iframe.getAttribute('loading'), 'lazy');
  });
}

test('vídeo indisponível ou link sem identificador não produz iframe', async () => {
  simularApi(() => Response.json({ vimeoUrl: 'https://vimeo.com/sem-video' }));
  await renderizar(Video);
  assert.equal(document.querySelector('iframe'), null);
});

test('falha da API mantém a página sem um player quebrado', async () => {
  simularApi(() => new Response(null, { status: 503 }));
  await renderizar(Video);
  assert.equal(document.querySelector('iframe'), null);
});
