Repositorio FrontEnd https://github.com/gustavorisio/cursovalido-frontend

Repositorio Backend https://github.com/gustavorisio/cursovalido-backend

# Curso Válido - Front-end

Repositório da interface web do **Curso Válido**, meu Projeto Final de Curso (PFC) do Bacharelado em Engenharia de Software na Universidade de Mogi das Cruzes (UMC).

## O que é o projeto?
O **Curso Válido** é uma plataforma web de aprendizagem focada na área de tecnologia. Diferente do que o nome pode sugerir inicialmente, não é um sistema de validação de diplomas do MEC. A ideia é ser um ambiente completo onde o usuário pode consumir conteúdos educacionais, acompanhar seu progresso, interagir com outros alunos e, ao final, emitir um certificado de conclusão do próprio curso feito na plataforma.

## O que tem na plataforma? (Funcionalidades)
O sistema é dividido em três principais funcionalidades:

*   **Aulas:**
    *   Só quem tem a conta de "Professor" consegue cadastrar aulas e subir vídeos.
    *   Para não derrubar o servidor e otimizar o I/O, os vídeos precisam ser obrigatoriamente em `.mp4` e respeitam um limite rigoroso de tamanho.
    *   O streaming rola direto no front-end.
    *   Para uma aula dar como "concluída", o aluno precisa bater uma % mínima de tempo assistido e clicar para registrar a conclusão.
*   **Certificados:**
    *   Terminou tudo? Passou nas avaliações e assistiu as aulas? O sistema gera um certificado em PDF automaticamente.
    *   Para evitar fraudes, cada certificado ganha um ID único. Tem até uma rota pública para qualquer pessoa consultar se aquele certificado é real e válido.
    *   O documento serve exclusivamente para comprovar a conclusão dos cursos da nossa plataforma.
*   **Fórum (Comunidade):**
    *   Um espaço para todo mundo (Alunos, Professores e Admins) trocar uma ideia, tirar dúvidas de código e criar uma base de conhecimento massa.
    *   As postagens e comentários têm um limite de 5000 caracteres.
    *   Só o próprio autor pode editar o que escreveu. Se o assunto morrer, o autor ou um admin podem "fechar" o tópico, bloqueando novos comentários.
    *   Fizemos tudo com *soft delete* (exclusão lógica). Se alguém apagar um tópico ou comentário, ele só fica inativo no banco de dados e some das consultas, para mantermos o histórico íntegro.

## Stack de Front-end

* **React (v19)**: Construção da interface em formato SPA (Single Page Application).
* **Vite**: Ferramenta de build e servidor de desenvolvimento local.
* **Tailwind CSS**: Estilização responsiva (Mobile First) e ágil.
* **ESLint**: Padronização e qualidade do código JavaScript/JSX.

---

## Como rodar o projeto na sua máquina

1. Clone este repositório:
   ```bash
   git clone https://github.com/gustavorisio/cursovalido-frontend.git
   cd cursovalido-frontend
   ```

2. Instale as dependências usando o npm:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

A aplicação vai rodar localmente, geralmente no endereço `http://localhost:5173`.

---

## Scripts do Projeto

* `npm run dev` - Sobe o ambiente para desenvolvimento.
* `npm run build` - Gera o empacotamento otimizado para produção.
* `npm run lint` - Checa a formatação e possíveis erros no código.


---

Orientador: Lucas Santos da Silva

Contribuido e desenvolvido por: Gustavo Di Risio
