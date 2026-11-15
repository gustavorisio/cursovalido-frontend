export const LIMITE_CAPA_BYTES = 2 * 1024 * 1024;
export const LARGURA_MAXIMA_CAPA = 550;
export const ALTURA_MAXIMA_CAPA = 250;

export function validarArquivoCapa(arquivo) {
  if (arquivo.type !== 'image/jpeg' || !/\.jpe?g$/i.test(arquivo.name)) {
    throw new Error('Selecione uma imagem JPEG (.jpg ou .jpeg).');
  }
  if (arquivo.size > LIMITE_CAPA_BYTES) throw new Error('A imagem deve ter no máximo 2 MB.');
}

export function validarResolucaoCapa(largura, altura) {
  if (!Number.isInteger(largura) || !Number.isInteger(altura) || largura < 1 || altura < 1 || largura > LARGURA_MAXIMA_CAPA || altura > ALTURA_MAXIMA_CAPA) {
    throw new Error('A imagem deve ter no máximo 550 px de largura e 250 px de altura. Imagens menores são aceitas.');
  }
}

export async function prepararCapaCurso(arquivo) {
  validarArquivoCapa(arquivo);
  const url = URL.createObjectURL(arquivo);
  try {
    const imagem = new Image();
    await new Promise((resolve, reject) => {
      imagem.onload = resolve;
      imagem.onerror = () => reject(new Error('Não foi possível ler a imagem. Selecione outro JPEG.'));
      imagem.src = url;
    });
    validarResolucaoCapa(imagem.naturalWidth, imagem.naturalHeight);
    const tela = document.createElement('canvas');
    tela.width = imagem.naturalWidth;
    tela.height = imagem.naturalHeight;
    tela.getContext('2d').drawImage(imagem, 0, 0);
    return tela.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
