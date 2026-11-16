import { isAbsolute, relative, resolve, sep } from 'node:path';
import instrumentacao from 'istanbul-lib-instrument';

export function arquivoDaAplicacao(caminho) {
  const arquivo = relative(resolve('src'), caminho);
  return !isAbsolute(arquivo) && !arquivo.startsWith('..' + sep) && /\.(js|jsx)$/.test(arquivo);
}

export function criarInstrumentador() {
  return instrumentacao.createInstrumenter({ esModules: true, compact: false, parserPlugins: ['jsx'] });
}

export function instrumentar(codigo, caminho) {
  return criarInstrumentador().instrumentSync(codigo, resolve(caminho));
}
