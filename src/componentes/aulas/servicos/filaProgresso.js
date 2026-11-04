// Mantém posição e conclusão na ordem em que o aluno as enviou.
// Uma falha não impede as próximas tentativas.
export function criarFilaProgresso() {
  let anterior = Promise.resolve();
  return function executar(operacao) {
    const resultado = anterior.then(operacao);
    anterior = resultado.catch(() => {});
    return resultado;
  };
}
