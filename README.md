# Curso Válido - Front-end

Interface web do **Curso Válido**, plataforma de aprendizagem na área de tecnologia desenvolvida como Projeto Final de Curso (PFC) do Bacharelado em Engenharia de Software da Universidade de Mogi das Cruzes (UMC).

A aplicação reúne cursos, aulas, acompanhamento de progresso, fórum, notícias, suporte e áreas específicas para alunos, professores e administradores.

- [Repositório do front-end](https://github.com/gustavorisio/cursovalido-frontend)
- [Repositório do back-end](https://github.com/gustavorisio/cursovalido-backend)

## Funcionalidades implementadas

### Cadastro e conta

- Cadastro de alunos com validação de formulário, CPF, data de nascimento, declaração de maioridade e aceite dos documentos legais.
- Confirmação de e-mail, login em duas etapas com código enviado por e-mail e recuperação e redefinição de senha.
- Cadastro por convite para professores e administradores, com confirmação de e-mail e aprovação administrativa.
- Consulta e download dos dados pessoais, revogação do aceite dos termos e exclusão da conta mediante código enviado por e-mail.
- Controle de sessão e proteção de rotas conforme os perfis `ALUNO`, `PROFESSOR` e `ADMINISTRADOR`.

### Cursos e aulas

- Catálogo público e área do aluno com matrícula gratuita e consulta dos cursos em que está matriculado.
- Organização em cursos, módulos e aulas, com pesquisa de conteúdo.
- Área do professor para cadastrar, editar e excluir cursos, módulos e aulas.
- Cadastro de aulas por link HTTPS do YouTube e reprodução pela YouTube IFrame Player API.
- Salvamento da posição de reprodução e retomada da aula a partir do progresso registrado.
- Conclusão manual pelo botão **Marcar como concluída**.
- Área administrativa para consulta de cursos e aulas, edição, arquivamento e reabertura de aulas.

### Fórum

- Listagem e consulta de tópicos e comentários, com paginação.
- Criação de tópicos e comentários por usuários autenticados, respeitando as restrições da conta.
- Títulos com até 255 caracteres; descrições e comentários com até 5.000 caracteres.
- Edição de tópicos e comentários pelo próprio autor.
- Fechamento de tópicos pelo autor ou administrador.
- Arquivamento por administradores ou pelo professor autor do tópico.
- Exclusão de tópicos por administradores e de comentários pelo autor ou administrador.

### Notícias e suporte

- Listagem, pesquisa e leitura de notícias.
- Publicação de notícias por administradores; edição e exclusão pela conta administrativa autora.
- Formulário público de suporte com validação dos campos, protocolo e encaminhamento por e-mail por meio da API.

### Administração

- Dashboard com indicadores e gráficos.
- Consulta de usuários e aplicação ou revogação de suspensões.
- Convites e aprovação de cadastros da equipe pelo administrador principal.
- Gestão dos termos de uso e da política de privacidade pelo administrador principal.

As operações dependem da API do back-end, responsável por validar permissões, persistir os dados e executar integrações como envio de e-mails e consulta cadastral. Este repositório contém a interface e os clientes HTTP desses serviços.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| React 19 e React DOM | Interface em JavaScript/JSX |
| React Router DOM 7 | Navegação da SPA e organização de rotas |
| Vite 8 | Servidor de desenvolvimento e build |
| Tailwind CSS 4 e CSS próprio | Estilização da interface |
| AdminLTE 4 | Estilos da área administrativa |
| Chart.js 4 | Gráficos do dashboard |
| Fetch API | Comunicação HTTP com o back-end |
| ESLint 10 | Análise estática do código |
| Node.js Test Runner e jsdom | Testes automatizados |

## Como executar localmente

### Pré-requisitos

- **Node.js** compatível com as dependências. Para a linha 22, utilize **22.22.2 ou superior**; para a linha 24, **24.15.0 ou superior**, considerando também o jsdom usado nos testes.
- **npm**, normalmente incluído na instalação do Node.js, para instalar as dependências e executar os scripts.
- **Git**, para clonar o repositório pelos comandos abaixo. Também é possível baixar e extrair o ZIP do projeto pelo GitHub.
- **Navegador atualizado**, para acessar a interface.
- Acesso à internet para instalar as dependências, utilizar as integrações e carregar os vídeos do YouTube.

Confira as instalações no terminal:

```bash
node --version
npm --version
git --version
```

React, Vite, Tailwind CSS, AdminLTE, Chart.js e as demais bibliotecas são instalados localmente pelo npm a partir do `package.json`. Não precisam de instalação global.

### Requisitos da plataforma completa

Para utilizar os fluxos integrados, mantenha o back-end em execução e configure a API conforme a próxima seção. Segundo a arquitetura descrita na monografia, o ambiente do back-end utiliza:

- **JDK 21** para executar a aplicação Java com Spring Boot.
- **Maven**, ou o Maven Wrapper quando disponibilizado pelo repositório, para construir e executar o back-end.
- **PostgreSQL**, com banco e credenciais configurados; as migrações são gerenciadas pelo Flyway no back-end.
- Configuração das integrações **Resend** (e-mails de confirmação, login, recuperação e suporte), **CPF.CNPJ** (verificação cadastral) e **YouTube Data API** (validação dos vídeos).

Esses requisitos pertencem ao servidor. Se você utilizar uma API já hospedada, não precisa instalar Java, Maven ou PostgreSQL na máquina do front-end. As credenciais dos serviços externos devem ser configuradas no back-end.

Consulte os comandos de inicialização, variáveis de ambiente e requisitos específicos no [repositório do back-end](https://github.com/gustavorisio/cursovalido-backend).

### Instalação

```bash
git clone https://github.com/gustavorisio/cursovalido-frontend.git
cd cursovalido-frontend
npm install
```

O comando `npm install` instala as dependências de desenvolvimento e da aplicação em `node_modules/`. Para uma instalação reproduzível a partir do `package-lock.json`, como em integração contínua, utilize `npm ci` como alternativa.

### Configuração da API

Crie um arquivo `.env.local` na raiz do projeto, se precisar definir o endereço da API:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

Esse também é o endereço padrão quando a variável não está definida. Informe a URL base com o prefixo `/api` e reinicie o servidor de desenvolvimento após alterar a configuração.

O cliente HTTP utiliza tokens de sessão no cabeçalho `Authorization: Bearer ...` nas requisições autenticadas. O back-end deve permitir a origem do front-end na configuração de CORS.

### Inicialização

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A porta está fixada em `3000` com `strictPort: true` no `vite.config.js`: se estiver ocupada, o Vite encerra a inicialização em vez de escolher outra porta.

## Scripts e verificações

| Comando | Descrição |
| --- | --- |
| `npm install` | Instala as dependências do projeto |
| `npm ci` | Instala as versões do lockfile em um ambiente limpo |
| `npm run dev` | Inicia o servidor de desenvolvimento na porta 3000 |
| `npm run build` | Gera os arquivos de produção em `dist/` |
| `npm run preview` | Disponibiliza uma prévia local do build de produção |
| `npm run lint` | Executa a análise estática com ESLint |
| `node --test` | Executa os testes automatizados em `tests/` |

Para visualizar o build localmente:

```bash
npm run build
npm run preview
```

## Principais rotas

| Área | Rotas |
| --- | --- |
| Conteúdo público | `/`, `/cursos`, `/forum`, `/noticias`, `/noticias/:id`, `/suporte` |
| Autenticação | `/login`, `/cadastro`, `/convites/cadastro`, `/confirmacao-email` |
| Recuperação de senha | `/solicitar-alteracao-senha`, `/redefinir-senha` |
| Documentos legais | `/termos`, `/termos-aceite`, `/privacidade` |
| Conta autenticada | `/configuracoes` |
| Aluno | `/aluno/cursos`, `/aluno/cursos/:idCurso`, `/aluno/cursos/:idCurso/aulas/:idAula` |
| Professor | `/professor/cursos`, `/professor/cursos/:idCurso/modulos`, `/professor/cursos/:idCurso/modulos/:idModulo/aulas` |
| Administração | `/administracao`, `/administracao/dashboard`, `/administracao/usuarios`, `/administracao/convites`, `/administracao/cursos`, `/administracao/termos`, `/administracao/privacidade` |
| Edição de notícias | `/noticias/nova`, `/noticias/:id/editar` |

As rotas de aluno, professor e administração exigem o perfil correspondente. As rotas de edição de notícias exigem perfil de administrador.

## Estrutura do projeto

```text
src/
├── assets/          # Imagens e recursos visuais
├── componentes/     # Componentes comuns e módulos de aulas, fórum, suporte e administração
├── contextos/       # Autenticação e restrições da conta
├── paginas/         # Páginas de autenticação, conta, notícias e administração
├── servicos/        # Cliente HTTP, sessão, validações e serviços compartilhados
├── App.jsx          # Rotas e composição principal
├── index.css        # Estilos globais
└── main.jsx         # Entrada da aplicação
tests/               # Testes automatizados
```

## Publicação

O build gera uma SPA estática em `dist/`. Configure `VITE_API_URL` antes de executar `npm run build`, pois as variáveis do Vite são incorporadas ao bundle. O servidor de hospedagem deve encaminhar as rotas da aplicação para `index.html`, permitindo acesso direto às URLs gerenciadas pelo `BrowserRouter`.

## Autoria

**Desenvolvido por:** Gustavo Di Risio

**Orientador:** Lucas Santos da Silva

**Coorientador:** Alessandro Aparecido da Silva Horas

**Instituição:** Universidade de Mogi das Cruzes (UMC) - Bacharelado em Engenharia de Software.
