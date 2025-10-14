# Épicos do projeto

## Introdução

Este documento apresenta os **épicos** que estruturam o desenvolvimento do projeto. Épicos são grandes blocos de funcionalidades que agrupam features relacionadas e representam objetivos de alto nível do sistema.

### O que são épicos?

Épicos são conjuntos de funcionalidades interligadas que entregam valor significativo aos usuários. Cada épico pode ser dividido em features menores e, posteriormente, em histórias de usuário e tarefas específicas durante o processo de desenvolvimento.

### Estrutura dos épicos

Cada épico apresentado contém:
- **Descrição**: O que o épico contempla e qual seu propósito principal
- **Motivação**: Por que esse épico é importante e qual problema resolve
- **Features**: Lista de funcionalidades específicas que compõem o épico


## Lista de épicos

### Épico 1 - Autenticação e acesso

**Descrição:**

Permitir que os usuários possam se cadastrar, fazer login e acessar o sistema com seguranca, garantindo um controle de acesso baseado nos papeis de  cada um (scrum master, product owner, dev, admin).

**Motivação**

Para assegurar que só usuarios autorizados consigam usar o sistema e acessar as funcionalidades de acordo com o seu perfil.

**Features**

1. **Cadastro de usuário**
    - O usuário pode criar conta com nome, email e senha.
    - Validação básica do email e senha (tamanho minimo, etc).
2. **Login seguro**
    - Fazer login usando email e senha.
    - Mensagem de erro se tiver algo inválido.
3. **Gerenciamento de sessão**
    - Manter o usuário logado enquanto navega.
    - Possibilitar logout a qualquer momento.

---

### Épico 2 - Gestão de organizações e times

**Descrição:**

Criar e gerenciar organizações e times de trabalho, vinculando usuários a equipes especificas.

**Motivação**

Organizar os times Scrum dentro do app, deixando tudo centralizado e mantendo a hierarquia certa.

**Features**

1. **Criação de organização**
    - Criar organização com nome único.
    - Quem criou vira admin automatico.
2. **Gerenciamento de times**
    - Criar times dentro da organização.
    - Adicionar/remover usuarios do time.
    - Ver lista de membros e seus papeis.
3. **Gerenciamento de papeis e permissões**
    - Atribuir funções (Admin, SM, PO, Dev).
    - Editar permissões conforme a role.

---

### Épico 3 - Backlog e sprints

**Descrição:**

Gerenciar o backlog do produto e as sprints, criando, editando e vendo as tarefas relacionadas.

**Motivação**

Facilitar o planejamento e acompanhamento das sprints, organizando as atividades do time de forma clara.

**Features**

1. **Gerenciamento do backlog**
    - Criar, editar e excluir tarefas.
    - Atribuir responsável, prioridade e descrição.
2. **Criação de sprints**
    - Criar sprint com nome, data inicial e final.
    - Associar tarefas do backlog à sprint.
3. **Visualização de sprints**
    - Listar todas as sprints (futuras, atuais, fechadas).
    - Mostrar progresso e % de conclusão.
4. **Edição de sprints**
    - Reatribuir tarefas durante o planejamento.

---

### Épico 4 - Quadro kanban

**Descrição:**

Implementar um quadro Kanban pra visualizar e gerenciar as tarefas do time durante a sprint.

**Motivação**

Acompanhar o fluxo de trabalho visualmente, deixando tudo transparente e colaborativo.

**Features**

1. **Visualização das tarefas no kanban**
    - Tarefas nas colunas: Backlog da Sprint, A Fazer, Fazendo, Revisão, Feito.
2. **Movimentação de tarefas (Drag and drop)**
    - Arrastar tarefas entre colunas, atualizando status automaticamente.
3. **Atualização automática de status**
    - Atualizar progresso da sprint conforme movimento.
    - Mostrar % de conclusão geral.
4. **Filtro e busca**
    - Buscar tarefas por nome ou responsável.
    - Filtrar por prioridade, status ou tag.

---

### Épico 5 - Métricas e dashboard

**Descrição:**

Oferecer um painel com métricas e indicadores de desempenho do time e de cada membro.

**Motivação**

Ajudar a analisar o desempenho do time e apoiar decisões nas retrospectivas e planejamentos.

**Features**

1. **Dashboard do time**
    - Gráficos de desempenho coletivo (velocidade, tarefas feitas, taxa de conclusão da sprint).
2. **Métricas individuais**
    - Produtividade de cada um (tarefas entregues, tempo médio por tarefa).
3. **Comparativo de desempenho**
    - Comparar indicadores entre sprints seguidas.

---

### Épico 6 - Configurações e administração

**Descrição:**

Gerenciar configurações gerais do sistema, personalizações da organização e permissões de acesso.

**Motivação**

Permitir que os admins possam ajustar o sistema conforme a necessidade de cada equipe e organização.

**Features**

1. **Configurações da organização**
    - Editar dados gerais da org.
2. **Gerenciamento de acesso**
    - Adicionar/remover usuários da organização.
    - Alterar papeis e permissões.