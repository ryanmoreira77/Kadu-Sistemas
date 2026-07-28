/* =========================================================
   KADU CAMISAS DE TIME — Financeiro
   ========================================================= */
renderShell('financeiro');

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
}

const products = getProducts();

function renderFinStats(){
  const valorInvestido = products.reduce((s,p)=>s+p.qtd*p.custo,0);
  const valorEstoque = products.reduce((s,p)=>s+p.qtd*p.preco,0);
  const lucroEstimado = valorEstoque - valorInvestido;
  const receita = receitaTotal();

  document.getElementById('finStats').innerHTML = `
    <div class="stat-card anim-fade-up" style="animation-delay:.02s">
      <div class="stat-label">Valor investido</div>
      <div class="stat-value" style="font-size:24px;">${formatBRL(valorInvestido)}</div>
    </div>
    <div class="stat-card anim-fade-up" style="animation-delay:.08s">
      <div class="stat-label">Valor total do estoque</div>
      <div class="stat-value" style="font-size:24px;">${formatBRL(valorEstoque)}</div>
    </div>
    <div class="stat-card anim-fade-up" style="animation-delay:.14s">
      <div class="stat-label">Lucro estimado</div>
      <div class="stat-value" style="font-size:24px;">${formatBRL(lucroEstimado)}</div>
    </div>
    <div class="stat-card anim-fade-up" style="animation-delay:.2s">
      <div class="stat-label">Receita (vendas registradas)</div>
      <div class="stat-value" style="font-size:24px;">${formatBRL(receita)}</div>
    </div>
  `;
}

function renderMaisCaros(){
  const top = [...products].sort((a,b)=>b.preco-a.preco).slice(0,5);
  document.getElementById('rankMaisCaros').innerHTML = top.map((p,i)=>`
    <div class="rank-item">
      <span class="rank-num">${i+1}</span>
      ${p.foto ? `<img class="rank-thumb" src="${p.foto}" alt="">` : `<div class="rank-thumb"></div>`}
      <div class="rank-info">
        <div class="name">${escapeHtml(p.team)}</div>
        <div class="sub">${p.marca || ''} • ${p.tamanho}</div>
      </div>
      <span class="rank-value">${formatBRL(p.preco)}</span>
    </div>
  `).join('') || `<p style="color:var(--text-dim);font-size:13.5px;">Nenhum produto cadastrado ainda.</p>`;
}

function renderParados(){
  document.getElementById('paradosSub').textContent = `Sem vendas nos últimos ${PARADO_DIAS} dias`;
  const parados = produtosParados().slice(0,5);
  document.getElementById('rankParados').innerHTML = parados.map((p,i)=>`
    <div class="rank-item">
      <span class="rank-num">${i+1}</span>
      ${p.foto ? `<img class="rank-thumb" src="${p.foto}" alt="">` : `<div class="rank-thumb"></div>`}
      <div class="rank-info">
        <div class="name">${escapeHtml(p.team)}</div>
        <div class="sub">${p.qtd} unidade(s) em estoque</div>
      </div>
      <span class="rank-value" style="color:var(--red-dark)">Parado</span>
    </div>
  `).join('') || `<p style="color:var(--text-dim);font-size:13.5px;">Nenhum produto parado — bom sinal! 🎉</p>`;
}

renderFinStats();
renderMaisCaros();
renderParados();
