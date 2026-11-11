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

// Verifica estrutura e digitos; nao comprova titularidade ou situacao cadastral.
export function validarCpf(valor) {
  const cpf = String(valor ?? '').trim();
  if (!/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(cpf)) return false;
  const digitos = cpf.replace(/\D/g, '');
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(digitos[i]) * (tamanho + 1 - i);
    const resto = soma % 11;
    if (Number(digitos[tamanho]) !== (resto < 2 ? 0 : 11 - resto)) return false;
  }
  return true;
}
