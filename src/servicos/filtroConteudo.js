// Conferência prévia na interface; a validação definitiva é feita pelo servidor.
const TERMOS = [
  'porra', 'porras', 'caralho', 'caralhos', 'carai', 'caraio', 'krl', 'merda', 'merdas', 'bosta', 'bostas', 'cacete', 'foda', 'fodase', 'foder', 'fode',
  'fodeu', 'fodido', 'fodida', 'fuder', 'fudido', 'fudida', 'fdp', 'pqp', 'vsf', 'vtnc', 'tnc', 'puta', 'puto',
  'putaria', 'putinha', 'buceta', 'boceta', 'xoxota', 'piroca', 'cu', 'cuzao', 'cuzinho', 'arrombado', 'arrombada',
  'desgraca', 'desgracado', 'desgracada', 'otario', 'otaria', 'idiota', 'idiotas', 'imbecil', 'imbecis', 'retardado', 'retardada', 'retardados',
  'babaca', 'babacas', 'escroto', 'escrota', 'vagabundo', 'vagabunda', 'vadia', 'vadias', 'corno', 'cornos', 'corna', 'cornas', 'viado', 'viados', 'sapatao', 'sapatoes',
  'traveco', 'travecos', 'mongoloide', 'lixo humano', 'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bitch', 'asshole',
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
  return termos.has(palavra) || radicais.some((radical) => palavra.startsWith(radical));
}

export function contemTermoOfensivo(...textos) {
  return textos.some((texto) => {
    if (typeof texto !== 'string' || !texto.trim()) return false;
    const lista = palavras(texto);
    if (lista.some(ofensiva)) return true;
    const juncoes = [];
    let letras = '';
    for (const palavra of lista) {
      if (palavra.length === 1) { letras += palavra; continue; }
      if (letras.length > 1) juncoes.push(colapsar(letras));
      letras = '';
    }
    if (letras.length > 1) juncoes.push(colapsar(letras));
    for (let i = 0; i + 1 < lista.length; i += 1) juncoes.push(`${lista[i]} ${lista[i + 1]}`);
    return juncoes.some(ofensiva);
  });
}

export const MENSAGEM_CONTEUDO_OFENSIVO = 'Seu texto contém palavras ofensivas, xingamentos ou termos pejorativos. Revise o conteúdo antes de publicar.';
