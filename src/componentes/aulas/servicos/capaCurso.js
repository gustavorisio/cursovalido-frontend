export const LIMITE_CAPA_BYTES = 2 * 1024 * 1024;
export const RESOLUCAO_CAPA = 640;

export function validarArquivoCapa(arquivo) {
  if (arquivo.type !== 'image/jpeg' || !/\.jpe?g$/i.test(arquivo.name)) {
    throw new Error('Selecione uma imagem JPEG (.jpg ou .jpeg).');
  }
  if (arquivo.size > LIMITE_CAPA_BYTES) throw new Error('A imagem deve ter no máximo 2 MB.');
}

export function validarResolucaoCapa(largura, altura) {
  if (largura < 320 || altura < 320 || largura > 2048 || altura > 2048) {
    throw new Error('A imagem deve ter entre 320 e 2048 pixels de largura e de altura.');
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
    tela.width = tela.height = RESOLUCAO_CAPA;
    const lado = Math.min(imagem.naturalWidth, imagem.naturalHeight);
    tela.getContext('2d').drawImage(imagem,
      (imagem.naturalWidth - lado) / 2, (imagem.naturalHeight - lado) / 2,
      lado, lado, 0, 0, RESOLUCAO_CAPA, RESOLUCAO_CAPA);
    return tela.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
