export function correspondeAoTema(curso, idTema) {
  if (!idTema) return true;
  if (idTema === 'sem-tema') return curso.idTema == null;
  return String(curso.idTema) === String(idTema);
}
