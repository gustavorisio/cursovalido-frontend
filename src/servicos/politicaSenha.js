export const MENSAGEM_SENHA = 'A senha deve conter ao menos uma letra maiúscula, uma minúscula e um caractere especial, com no máximo 72 bytes.';
export function senhaValida(senha) {
  return new TextEncoder().encode(senha).length <= 72 && /\p{Lu}/u.test(senha) && /\p{Ll}/u.test(senha)
    && /[^\p{L}\p{N}\p{Z}\p{C}\s]/u.test(senha);
}
