# Kadu Camisas de Time — Sistema de Gestão de Estoque

Sistema web (HTML, CSS e JavaScript puro, sem necessidade de instalar nada)
para controle completo de estoque de camisas de time: cadastro, movimentações,
histórico, financeiro e relatórios.

## 🔐 Login na nuvem (Supabase) — configuração inicial

O login agora é real, usando o [Supabase](https://supabase.com) (banco de dados
Postgres + autenticação, com plano gratuito). Siga estes passos uma única vez:

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um
   novo projeto (guarde a senha do banco que você definir).
2. No menu lateral do projeto, vá em **SQL Editor > New query**, cole todo o
   conteúdo do arquivo `database/schema.sql` deste projeto e clique em **Run**.
   Isso cria as tabelas que serão usadas na próxima etapa (produtos,
   movimentações e configurações) — pode rodar desde já.
3. Vá em **Authentication > Users** e clique em **Add user** para criar a
   sua conta (e-mail e senha que você vai usar para entrar no sistema).
   Marque a opção de já confirmar o e-mail automaticamente, para não precisar
   clicar em nenhum link de confirmação.
4. Vá em **Project Settings > API** e copie:
   - **Project URL**
   - **anon public** key
5. Abra o arquivo `assets/js/supabaseClient.js` neste projeto e cole esses
   dois valores nas variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
6. Pronto! Abra `index.html` e entre com o e-mail/senha criados no passo 3.

> Nesta etapa, apenas o **login** passou a ser real (na nuvem). Os produtos,
> movimentações e configurações continuam salvos no navegador (localStorage)
> — isso será migrado para o banco de dados na próxima etapa, usando as
> tabelas que você já criou no passo 2.

### Hospedando de verdade (opcional)
Como o sistema não depende de servidor próprio, dá pra publicar como site
estático em serviços gratuitos como [Netlify](https://netlify.com) (arraste a
pasta `kadu-sistema` no painel deles) ou [Vercel](https://vercel.com). Assim
você acessa de qualquer lugar, não só do seu computador.



## Como usar

1. Extraia a pasta `kadu-sistema` em qualquer lugar do seu computador.
2. Configure o Supabase seguindo os passos acima (só precisa fazer uma vez).
3. Abra o arquivo **index.html** no navegador (duplo clique) e faça login
   com o e-mail/senha que você criou no Supabase.
4. Use o menu lateral para navegar entre as seções.

> Produtos, movimentações e configurações ainda ficam salvos no navegador
> (localStorage) nesta etapa — a migração completa para o banco de dados
> vem a seguir.

## Estrutura de pastas

```
kadu-sistema/
├── index.html              → Tela de login
├── dashboard.html           → Dashboard com 8 indicadores e gráficos
├── produtos.html             → Cadastro completo + cards/tabela
├── estoque.html               → Movimentações (entrada/saída/venda/ajuste)
├── financeiro.html             → Valor investido, receita, lucro, parados
├── relatorios.html              → Exportação em PDF, Excel e CSV
├── catalogo.html                 → Catálogo em PDF com fotos para clientes
├── configuracoes.html            → Logo, nome da empresa, cor, dados da loja
├── README.md
├── database/
│   └── schema.sql             → Schema do Supabase (tabelas, RLS, funções)
└── assets/
    ├── css/style.css          → Design system completo
    ├── img/logo.svg           → Logo (substitua por sua logo oficial)
    └── js/
        ├── data.js             → Produtos, movimentações, configs, estatísticas
        ├── brand.js            → Aplica marca personalizada + toasts
        ├── supabaseClient.js    → Configuração de conexão com o Supabase
        ├── auth-cloud.js        → Login/sessão reais via Supabase Auth
        ├── shell.js            → Sidebar (6 seções) e header compartilhados
        ├── dashboard.js
        ├── produtos.js
        ├── estoque.js
        ├── financeiro.js
        ├── relatorios.js
        ├── catalogo.js
        └── configuracoes.js
```

## Funcionalidades

**Dashboard** — total de produtos, unidades em estoque, valor investido, valor
potencial de venda, lucro estimado, estoque baixo, vendidos no mês, camisa mais
vendida, gráficos por categoria/tamanho e lista de estoque baixo.

**Produtos** — cadastro com foto, nome, time, liga, temporada, marca, modelo,
categoria, custo, venda (lucro calculado automaticamente), código interno e
observações. **Cada camisa guarda todos os tamanhos (P, M, G, GG, XG, 2XG,
3XG, 4XG) com sua própria quantidade em estoque** — não precisa mais cadastrar
o mesmo modelo várias vezes por tamanho. Busca em tempo real, filtros, chips
rápidos (ex: "Apenas Flamengo", "Apenas tamanho G", "Estoque baixo"),
alternância entre visualização em cards ou tabela (com ordenação, paginação e
colunas ajustáveis) e lightbox ao clicar na foto.

**Estoque** — em vez de editar a quantidade na mão, toda alteração passa por
uma movimentação: Entrada, Saída, Venda ou Ajuste, **sempre associada a um
tamanho específico** daquele produto. Cada uma fica registrada com data,
motivo/fornecedor e observação, formando o histórico do produto (acessível
pelo botão "Histórico" em Produtos, já mostrando o tamanho de cada
movimentação).

**Financeiro** — valor investido, valor total do estoque, lucro estimado,
receita das vendas registradas, produtos mais caros e produtos parados (sem
vendas nos últimos 30 dias) — tudo somado corretamente através dos tamanhos.

**Relatórios** — geração de PDF, Excel (.xlsx) e CSV para Estoque (uma linha
por produto+tamanho), Produtos, Lucro e Vendas, prontos para baixar.

**Catálogo** — nova seção para montar um catálogo em PDF com fotos das
camisas, pronto para enviar aos clientes (WhatsApp, e-mail etc). Você escolhe
quais camisas entram (com busca e filtro por categoria) e o sistema gera um
PDF com capa, foto, time, marca, tamanhos disponíveis e preço de cada uma.
Só entram no catálogo camisas que já têm foto cadastrada em Produtos.

**Configurações** — troque a logo, o nome da empresa, a cor de destaque do
sistema e os dados da loja (telefone, endereço, Instagram). Tudo é aplicado
automaticamente em todas as telas, inclusive no login e no catálogo em PDF.

**Experiência do usuário** — animações de entrada, toasts de sucesso/erro,
confirmação antes de excluir, atalhos de teclado (`/` para buscar, `N` para
nova camisa, `Esc` para fechar modais) e layout responsivo para desktop,
notebook e tablet.

## Observações técnicas

- Não há back-end: tudo roda no navegador. Para dados compartilhados entre
  várias pessoas/dispositivos e login realmente seguro, seria necessário um
  servidor com banco de dados — próximo passo natural se isso virar um sistema
  usado por mais gente além do Kadu.
- Bibliotecas usadas via CDN: [Chart.js](https://www.chartjs.org/) (gráficos),
  [jsPDF](https://github.com/parallax/jsPDF) + autoTable (relatórios em PDF) e
  [SheetJS/xlsx](https://sheetjs.com/) (relatórios em Excel).
- Fontes: Anton (títulos), Inter (textos) e JetBrains Mono (dados/etiquetas).
- Fotos de produtos são salvas como imagem embutida (base64) no navegador —
  em grande volume, isso pode deixar o localStorage pesado; se o catálogo
  crescer muito, vale migrar para um servidor com armazenamento de arquivos.
