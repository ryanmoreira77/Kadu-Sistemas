# Kadu Camisas de Time — Sistema de Gestão de Estoque

Sistema web (HTML, CSS e JavaScript puro, sem necessidade de instalar nada)
para controle completo de estoque de camisas de time: cadastro, movimentações,
histórico, financeiro e relatórios.

## Como usar

1. Extraia a pasta `kadu-sistema` em qualquer lugar do seu computador.
2. Abra o arquivo **index.html** no navegador (duplo clique).
3. Faça login (qualquer e-mail e senha entram — é um login de demonstração,
   sem servidor por trás).
4. Use o menu lateral para navegar entre as seções.

> Os dados ficam salvos no armazenamento local do navegador (localStorage).
> Continuam lá mesmo se você fechar e abrir de novo, mas ficam só nesse
> navegador/computador — não são compartilhados entre dispositivos.

## Estrutura de pastas

```
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
