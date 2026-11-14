export function validarIdade(dataNascimento) {
  if (!dataNascimento) return 0;
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aniversarioAindaNaoChegou = hoje.getMonth() < nascimento.getMonth()
    || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aniversarioAindaNaoChegou) idade -= 1;
  return idade;
}
