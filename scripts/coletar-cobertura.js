import process from 'node:process';
import { Buffer } from 'node:buffer';
import { registerHooks } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arquivoDaAplicacao, instrumentar } from './instrumentacao.js';

registerHooks({
  load(url, contexto, proximo) {
    const resultado = proximo(url, contexto);
    if (url.startsWith('file:')) {
      const caminho = fileURLToPath(url);
      if (arquivoDaAplicacao(caminho)) resultado.source = instrumentar(Buffer.from(resultado.source).toString(), caminho);
    }
    return resultado;
  },
});

process.on('exit', () => {
  if (globalThis.__coverage__) {
    writeFileSync(join(process.env.COBERTURA_FRONTEND, process.pid + '.json'), JSON.stringify(globalThis.__coverage__));
  }
});
