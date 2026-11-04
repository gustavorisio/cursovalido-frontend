export function correspondeAoNome(titulo, busca) {
  const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  return normalizar(titulo).includes(normalizar(busca));
}

