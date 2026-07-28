# Kadu Camisas de Time — Sistema de Gestão de Estoque

Sistema web (HTML, CSS e JavaScript puro, sem necessidade de instalar nada)
para controle completo de estoque de camisas de time: cadastro, movimentações,
histórico, financeiro e relatórios.


kadu-sistema/
├── index.html              → Tela de login
├── dashboard.html           → Dashboard com 8 indicadores e gráficos
├── produtos.html             → Cadastro completo + cards/tabela
├── estoque.html               → Movimentações (entrada/saída/venda/ajuste)
├── financeiro.html             → Valor investido, receita, lucro, parados
├── relatorios.html              → Exportação em PDF, Excel e CSV
├── configuracoes.html            → Logo, nome da empresa, cor, dados da loja
├── README.md
└── assets/
    ├── css/style.css          → Design system completo
    ├── img/logo.svg           → Logo (substitua por sua logo oficial)
    └── js/
        ├── data.js             → Produtos, movimentações, configs, estatísticas
        ├── brand.js            → Aplica marca personalizada + toasts
        ├── shell.js            → Sidebar (6 seções) e header compartilhados
        ├── dashboard.js
        ├── produtos.js
        ├── estoque.js
        ├── financeiro.js
        ├── relatorios.js
        └── configuracoes.js
```

## Funcionalidades

**Dashboard** — total de produtos, unidades em estoque, valor investido, valor
potencial de venda, lucro estimado, estoque baixo, vendidos no mês, camisa mais
vendida, gráficos por categoria/tamanho e lista de estoque baixo.

**Produtos** — cadastro com foto, nome, time, liga, temporada, marca, modelo,
tamanho, categoria, custo, venda (lucro calculado automaticamente), código
interno e observações. Busca em tempo real, filtros, chips rápidos (ex: "Apenas
Flamengo", "Apenas Nike", "Estoque baixo"), alternância entre visualização em
cards ou tabela (com ordenação, paginação e colunas ajustáveis) e lightbox ao
clicar na foto.

**Estoque** — em vez de editar a quantidade na mão, toda alteração passa por
uma movimentação: Entrada, Saída, Venda ou Ajuste. Cada uma fica registrada
com data, motivo/fornecedor e observação, formando o histórico do produto
(acessível pelo botão "Histórico" em Produtos).

**Financeiro** — valor investido, valor total do estoque, lucro estimado,
receita das vendas registradas, produtos mais caros e produtos parados (sem
vendas nos últimos 30 dias).

**Relatórios** — geração de PDF, Excel (.xlsx) e CSV para Estoque, Produtos,
Lucro e Vendas, prontos para baixar.

**Configurações** — troque a logo, o nome da empresa, a cor de destaque do
sistema e os dados da loja (telefone, endereço, Instagram). Tudo é aplicado
automaticamente em todas as telas, inclusive no login.

**Experiência do usuário** — animações de entrada, toasts de sucesso/erro,
confirmação antes de excluir, atalhos de teclado (`/` para buscar, `N` para
nova camisa, `Esc` para fechar modais) e layout responsivo para desktop,
notebook e tablet.


