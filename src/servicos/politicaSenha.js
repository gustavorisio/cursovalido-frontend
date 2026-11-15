export const MENSAGEM_SENHA = 'Use letras maiúsculas, minúsculas e um símbolo, como ! ou @. Se a senha for longa, reduza o tamanho.';
export function senhaValida(senha) {
  return new TextEncoder().encode(senha).length <= 72 && /\p{Lu}/u.test(senha) && /\p{Ll}/u.test(senha)
    && /[^\p{L}\p{N}\p{Z}\p{C}\s]/u.test(senha);
}
