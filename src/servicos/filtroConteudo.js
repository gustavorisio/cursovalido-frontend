// Ocultação na interface; o servidor também filtra antes de salvar e devolver o conteúdo.
const TERMOS = [
  'porra', 'porras', 'caralho', 'caralhos', 'carai', 'caraio', 'krl', 'merda', 'merdas', 'bosta', 'bostas', 'cacete', 'foda', 'fodase', 'foder', 'fode',
  'fodeu', 'fodido', 'fodida', 'fuder', 'fudido', 'fudida', 'fdp', 'pqp', 'vsf', 'vtnc', 'tnc', 'puta', 'puto',
  'putaria', 'putinha', 'buceta', 'boceta', 'xoxota', 'piroca', 'cu', 'cuzao', 'cuzinho', 'arrombado', 'arrombada',
  'desgraca', 'desgracado', 'desgracada', 'otario', 'otaria', 'idiota', 'idiotas', 'imbecil', 'imbecis', 'retardado', 'retardada', 'retardados',
  'babaca', 'babacas', 'escroto', 'escrota', 'vagabundo', 'vagabunda', 'vadia', 'vadias', 'corno', 'cornos', 'corna', 'cornas', 'viado', 'viados', 'sapatao', 'sapatoes',
  'traveco', 'travecos', 'mongoloide', 'lixo', 'lixo humano', 'fodace', 'foda-se', 'pau no cu', 'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bitch', 'asshole',
  'cunt', 'nigger', 'niggers', 'nigga', 'niggas', 'faggot', 'faggots', 'retard',
];
const RADICAIS = [
  'caralh', 'arromb', 'desgracad', 'fodid', 'fudid', 'otari', 'retardad', 'escrot', 'viadinh', 'bucet', 'bocet',
  'putinh', 'putaria', 'cuza', 'merdinh', 'babac', 'imbecil', 'idiot', 'vagabund', 'motherfuck', 'fuck', 'bitch',
  'asshol',
];
const SUBSTITUICOES = { 0: 'o', 1: 'i', '!': 'i', 3: 'e', 4: 'a', '@': 'a', 5: 's', $: 's', 7: 't' };

function colapsar(palavra) {
  return palavra.replace(/(.)\1+/g, '$1');
}

function palavras(texto) {
  const normalizado = texto.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase()
    .replace(/[0134579!@$]/g, (caractere) => SUBSTITUICOES[caractere] ?? caractere);
  return normalizado.split(/[^a-z]+/).filter(Boolean).map(colapsar);
}

const termos = new Set(TERMOS.map((termo) => palavras(termo).join(' ')));
const radicais = RADICAIS.map((radical) => palavras(radical).join(''));

function ofensiva(palavra) {
  return termos.has(palavra) || (!palavra.includes(' ') && radicais.some((radical) => palavra.startsWith(radical)));
}

export function censurarConteudo(texto) {
  if (typeof texto !== 'string' || !texto.trim()) return texto;
  const tokens = [...texto.matchAll(/[\p{L}\p{M}\p{N}@$]+/gu)].map((item) => ({
    valor: palavras(item[0]).join(''), inicio: item.index, fim: item.index + item[0].length,
  }));
  const ocultos = new Uint8Array(texto.length);
  const marcar = (inicio, fim) => ocultos.fill(1, inicio, fim);
  for (let i = 0; i < tokens.length; i += 1) {
    let frase = '';
    for (let j = i; j < tokens.length && j < i + 4; j += 1) {
      frase += `${j > i ? ' ' : ''}${tokens[j].valor}`;
      if (ofensiva(frase)) marcar(tokens[i].inicio, tokens[j].fim);
    }
    if (tokens[i].valor.length === 1) {
      let letras = '';
      for (let j = i; j < tokens.length && j < i + 32 && tokens[j].valor.length === 1; j += 1) {
        letras += tokens[j].valor;
        if (ofensiva(colapsar(letras))) marcar(tokens[i].inicio, tokens[j].fim);
      }
    }
  }
  let resultado = '';
  for (let i = 0; i < texto.length; i += 1) {
    if (!ocultos[i]) resultado += texto[i];
    else if (i === 0 || !ocultos[i - 1]) resultado += '***';
  }
  return resultado;
}

export function contemTermoOfensivo(...textos) {
  return textos.some((texto) => typeof texto === 'string' && texto !== censurarConteudo(texto));
}

export const MENSAGEM_CONTEUDO_OFENSIVO = 'Palavras ofensivas são substituídas por *** ao publicar.';
