export const LIMITE_BYTES_SENHA = 72;
export const MINIMO_CARACTERES_SENHA = 8;

export const MENSAGEM_SENHA = 'Use pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula e um caractere especial, como ! ou @. A senha aceita até 72 bytes em UTF-8.';

// Mesmas regras do backend, na mesma ordem, para que a mensagem exibida seja igual nos dois lados.
export const REGRAS_SENHA = [
  { id: 'minimo', texto: 'Pelo menos 8 caracteres', mensagem: 'A senha deve ter pelo menos 8 caracteres.', atende: (senha) => Array.from(senha).length >= MINIMO_CARACTERES_SENHA },
  { id: 'tamanho', texto: 'Até 72 bytes em UTF-8', mensagem: 'A senha deve ter no máximo 72 bytes em UTF-8. Use uma senha mais curta.', atende: (senha) => new TextEncoder().encode(senha).length <= LIMITE_BYTES_SENHA },
  { id: 'maiuscula', texto: 'Uma letra maiúscula', mensagem: 'A senha deve ter pelo menos uma letra maiúscula.', atende: (senha) => /\p{Lu}/u.test(senha) },
  { id: 'minuscula', texto: 'Uma letra minúscula', mensagem: 'A senha deve ter pelo menos uma letra minúscula.', atende: (senha) => /\p{Ll}/u.test(senha) },
  { id: 'especial', texto: 'Um caractere especial, como ! ou @', mensagem: 'A senha deve ter pelo menos um caractere especial, como ! ou @.', atende: (senha) => /[^\p{L}\p{N}\p{Z}\p{C}\s]/u.test(senha) },
];

export function problemasSenha(senha = '') {
  return REGRAS_SENHA.filter((regra) => !regra.atende(senha ?? '')).map((regra) => regra.mensagem);
}

export function mensagemSenha(senha = '') {
  return problemasSenha(senha)[0] ?? '';
}

export function senhaValida(senha = '') {
  return problemasSenha(senha).length === 0;
}
