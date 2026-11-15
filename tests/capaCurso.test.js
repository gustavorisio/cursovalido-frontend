import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararCapaCurso, validarArquivoCapa, validarResolucaoCapa, LIMITE_CAPA_BYTES } from '../src/componentes/aulas/servicos/capaCurso.js';

test('capa aceita somente JPEG até 2 MB e resolução entre 320 e 2048 px', () => {
  validarArquivoCapa({ type: 'image/jpeg', name: 'curso.jpeg', size: LIMITE_CAPA_BYTES });
  validarResolucaoCapa(320, 2048);
  assert.throws(() => validarArquivoCapa({ type: 'image/png', name: 'curso.png', size: 100 }), /JPEG/);
  assert.throws(() => validarArquivoCapa({ type: 'image/jpeg', name: 'curso.jpg', size: LIMITE_CAPA_BYTES + 1 }), /2 MB/);
  assert.throws(() => validarResolucaoCapa(319, 640), /320 e 2048/);
  assert.throws(() => validarResolucaoCapa(640, 2049), /320 e 2048/);
});

test('preparação recorta o centro, exporta JPEG quadrado e libera a URL temporária', async () => {
  const originais = { Image: globalThis.Image, document: globalThis.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  let desenho, exportacao, liberada;
  const tela = { getContext: () => ({ drawImage: (...args) => { desenho = args; } }), toDataURL: (...args) => { exportacao = args; return 'data:image/jpeg;base64,capa'; } };
  globalThis.Image = class {
    naturalWidth = 1200;
    naturalHeight = 800;
    set src(valor) { this.url = valor; queueMicrotask(() => this.onload()); }
  };
  globalThis.document = { createElement: () => tela };
  URL.createObjectURL = () => 'blob:capa';
  URL.revokeObjectURL = url => { liberada = url; };
  try {
    assert.equal(await prepararCapaCurso({ name: 'curso.jpg', type: 'image/jpeg', size: 1000 }), 'data:image/jpeg;base64,capa');
    assert.deepEqual(desenho.slice(1), [200, 0, 800, 800, 0, 0, 640, 640]);
    assert.equal(tela.width, 640);
    assert.equal(tela.height, 640);
    assert.deepEqual(exportacao, ['image/jpeg', 0.85]);
    assert.equal(liberada, 'blob:capa');
  } finally {
    URL.createObjectURL = originais.create;
    URL.revokeObjectURL = originais.revoke;
    for (const chave of ['Image', 'document']) {
      if (originais[chave] === undefined) delete globalThis[chave];
      else globalThis[chave] = originais[chave];
    }
  }
});
