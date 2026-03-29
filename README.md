# Grão Mestre - Frontend Web (Painel Administrativo e E-commerce)

Este repositório contém o código-fonte do frontend web da plataforma **Grão Mestre**, um sistema completo para gestão de uma cafeteria / e-commerce de cafés especiais. A aplicação web é dividida em duas grandes áreas: um **Painel Administrativo** robusto para gerenciar usuários, produtos, categorias, pedidos e finanças, e uma **interface de E-commerce** para clientes navegarem, comprarem e acompanharem seus pedidos.

## 🚀 Tecnologias Utilizadas

O frontend web foi construído com um stack moderno e eficiente, focado em performance, escalabilidade e uma excelente experiência do usuário:

-   **React.js**: Biblioteca JavaScript para construção de interfaces de usuário.
-   **TypeScript**: Superset do JavaScript que adiciona tipagem estática, melhorando a robustez e manutenibilidade do código.
-   **Vite**: Ferramenta de build de nova geração que oferece um ambiente de desenvolvimento extremamente rápido.
-   **Tailwind CSS**: Framework CSS utilitário para estilização rápida e responsiva.
-   **Shadcn/ui**: Componentes de UI construídos com Tailwind CSS e React, oferecendo uma base sólida e customizável.
-   **Framer Motion**: Biblioteca para animações fluidas e interativas.
-   **React Query (TanStack Query)**: Para gerenciamento de estado assíncrono, cache de dados e otimização de requisições à API.
-   **Axios**: Cliente HTTP para fazer requisições à API REST do backend.
-   **React Router DOM**: Para gerenciamento de rotas na aplicação.
-   **date-fns**: Biblioteca leve para manipulação e formatação de datas.
-   **Mercado Pago SDK**: Integração para processamento de pagamentos.

## ✨ Principais Funcionalidades

A aplicação web oferece um conjunto abrangente de recursos:

### Painel Administrativo

-   **Gestão de Usuários (`UserManagement.tsx`)**:
    -   Visualização, criação, edição e remoção de usuários.
    -   Atribuição e gerenciamento de permissões (scopes).
    -   Gestão de endereços associados a cada usuário.
    -   Filtros avançados por status (ativos/inativos), permissões e busca textual.
    -   Design responsivo com tabela para desktop e cards expansíveis para mobile.
-   **Relatórios Financeiros (`FinancialReport.tsx`)**:
    -   Dashboard com métricas chave (receita, despesas, lucro, total de pedidos, status de pedidos).
    -   Análise de desempenho por período (hoje, semana, mês, personalizado).
    -   Top 5 produtos por receita e quantidade vendida.
    -   Receita detalhada por categoria e método de pagamento.
    -   Análise específica de receita e quantidade vendida para categorias e produtos individuais.
-   **Gestão de Produtos e Categorias**:
    -   CRUD completo para produtos (nome, descrição, estoque, preço, status, categoria, imagem).
    -   CRUD para categorias de produtos.
-   **Gestão de Pedidos**:
    -   Visualização e acompanhamento de todos os pedidos.
    -   Atualização de status de pedidos (pendente, em preparo, enviado, entregue, cancelado).
    -   Filtros por status, período e cliente.
-   **Gestão de Despesas**:
    -   Registro e acompanhamento de despesas operacionais.

### E-commerce (Área do Cliente)

-   **Catálogo de Produtos**:
    -   Navegação e busca por produtos e categorias.
    -   Visualização detalhada de cada produto.
-   **Carrinho de Compras**:
    -   Adição, remoção e ajuste de quantidade de itens.
-   **Checkout Integrado**:
    -   Processo de pagamento via Mercado Pago.
    -   Páginas de sucesso (`Sucess.tsx`) e falha (`Failure.tsx`) no pagamento.
-   **Autenticação e Perfil (`Register.tsx`, `Login.tsx`)**:
    -   Registro de novos usuários com validação de senha.
    -   Login seguro com JWT.
    -   Recuperação de senha.
    -   Gerenciamento de perfil e endereços do usuário.
-   **Histórico de Pedidos**:
    -   Visualização dos pedidos realizados e seus status.

## ⚙️ Como Rodar o Projeto (Desenvolvimento)

Para configurar e rodar o frontend web localmente, siga os passos abaixo:

### Pré-requisitos

-   Node.js (versão 18 ou superior)
-   npm ou Yarn
-   O backend do projeto deve estar rodando e acessível.

### Instalação

1.  Clone o repositório do frontend:
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_FRONTEND>
    cd grao-mestre-frontend-web
    ```
2.  Instale as dependências:
    ```bash
    npm install
    # ou
    yarn install
    ```

### Configuração do Ambiente

1.  Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example` (se houver).
2.  Defina a URL base da sua API de backend:
    ```
    VITE_API_BASE_URL=http://localhost:8080/api
    ```
    *Ajuste a URL conforme onde seu backend estiver rodando.*

### Execução

1.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
2.  A aplicação estará disponível em `http://localhost:5173` (ou outra porta indicada pelo Vite).

## 🤝 Contribuição

Sinta-se à vontade para explorar o código, sugerir melhorias ou reportar issues.

## 📄 Licença

Defina aqui a licença do projeto (ex.: MIT), se for público.

---

## ✨ Autor

Projeto desenvolvido por **Lucas** como aplicação full stack (backend + frontend web + mobile), com foco em arquitetura limpa, boas práticas de engenharia e integração real com meios de pagamento.
