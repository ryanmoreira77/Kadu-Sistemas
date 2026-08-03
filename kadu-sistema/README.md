# Kadu Camisas de Time — Sistema de Gestão de Estoque

**Atualização:** produtos, movimentações, financeiro e configurações agora
são salvos no banco de dados (Supabase), não mais no navegador. Isso
significa que você pode logar de qualquer computador ou celular e ver os
mesmos dados.

## ⚠️ Antes de usar esta versão

Esta pasta tem TODA a lógica migrada, mas **falta o visual** (ele não muda
em nada nessa migração, só a forma como os dados são salvos):

1. Copie o arquivo `assets/css/style.css` do seu projeto atual para dentro
   desta pasta, no mesmo lugar.
2. Copie o arquivo `assets/img/logo.svg` do seu projeto atual também.

Depois disso o sistema fica visualmente idêntico ao que você já usa.

## 🔐 Configuração do banco (se ainda não tiver feito)

As credenciais do Supabase já estão preenchidas em
`assets/js/supabaseClient.js` (as mesmas de sempre). Só falta garantir que
o banco tenha as tabelas novas:

1. No painel do Supabase, vá em **SQL Editor > New query**, cole todo o
   conteúdo de `database/schema.sql` e clique em **Run**. Isso cria (ou
   confirma que já existem) as tabelas `produtos`, `tamanhos_estoque`,
   `movimentacoes` e `configuracoes`, a segurança (RLS) e a função
   `registrar_movimentacao`.
2. Vá em **Storage** e crie um bucket chamado exatamente `fotos`, marcado
   como **público** (as fotos de produtos e a logo passam a ficar
   guardadas ali, em vez de no navegador).
3. Pronto — abra `index.html` e entre com o e-mail/senha de sempre.

> Como os produtos cadastrados antes ficavam só no navegador (localStorage),
> eles **não são migrados automaticamente** para o banco — meio inevitável,
> já que moram em lugares diferentes. Você vai precisar cadastrar as
> camisas de novo (ou me passar a lista que eu ajudo a montar um script de
> importação).

## O que mudou por dentro

- `assets/js/data.js` — reescrito para conversar com o Supabase em vez do
  `localStorage`. Os nomes das funções continuam praticamente os mesmos
  (`getProducts`, `addProduct`, `registrarMovimentacao` etc.), só que agora
  são todas assíncronas.
- Todas as páginas (Dashboard, Produtos, Estoque, Financeiro, Relatórios,
  Catálogo, Configurações) foram ajustadas para usar `await` ao carregar os
  dados.
- Fotos de produtos e a logo agora são enviadas para o Supabase Storage
  (bucket `fotos`) em vez de ficarem em base64 no navegador — mais leve e
  funciona de qualquer aparelho.
- `assets/js/produtos.js` foi reconstruído do zero (o original não estava
  disponível), seguindo a mesma tela e as mesmas funcionalidades descritas
  no restante do sistema: cards/tabela, filtros, chips rápidos, tamanhos,
  histórico, upload de foto e exclusão com confirmação.

## Estrutura de pastas

```
kadu-sistema/
├── index.html, dashboard.html, produtos.html, estoque.html,
│   financeiro.html, relatorios.html, catalogo.html, configuracoes.html
├── database/schema.sql
└── assets/
    ├── css/style.css       ← copie do seu projeto atual
    ├── img/logo.svg        ← copie do seu projeto atual
    └── js/
        ├── data.js              → NOVO: camada de dados via Supabase
        ├── supabaseClient.js, auth-cloud.js, brand.js, shell.js
        └── dashboard.js, produtos.js, estoque.js, financeiro.js,
            relatorios.js, catalogo.js, configuracoes.js
```
