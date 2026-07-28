/* =========================================================
   KADU CAMISAS DE TIME — Dashboard
   ========================================================= */
renderShell('dashboard');

const CHART_RED = getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#e11d2e';
const CHART_BLACK = '#0c0c0c';
const CHART_GRAY = '#c9c9c9';

function countUp(el, target, isCurrency){
  const duration = 700;
  const start = performance.now();
  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = isCurrency ? formatBRL(value) : Math.round(value).toString();
    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderKPIs(products){
  const totalProdutos = products.length;
  const totalUnidades = products.reduce((s,p)=>s+p.qtd,0);
  const valorInvestido = products.reduce((s,p)=>s+p.qtd*p.custo,0);
  const valorPotencial = products.reduce((s,p)=>s+p.qtd*p.preco,0);
  const lucroEstimado = valorPotencial - valorInvestido;
  const estoqueBaixo = products.filter(p=>p.qtd>0 && p.qtd<=LOW_STOCK).length;
  const vendidosMes = unidadesVendidasNoMes();
  const topVenda = camisasMaisVendidas(1)[0];

  const kpis = [
    { icon:'👕', label:'Produtos cadastrados', id:'kpiTotalProdutos', value:totalProdutos, currency:false },
    { icon:'📦', label:'Unidades em estoque', id:'kpiTotalUnidades', value:totalUnidades, currency:false },
    { icon:'💰', label:'Valor investido', id:'kpiValorInvestido', value:valorInvestido, currency:true },
    { icon:'💵', label:'Valor potencial de venda', id:'kpiValorPotencial', value:valorPotencial, currency:true },
    { icon:'📈', label:'Lucro estimado', id:'kpiLucro', value:lucroEstimado, currency:true },
    { icon:'⚠️', label:'Estoque baixo', id:'kpiBaixo', value:estoqueBaixo, currency:false, alert:estoqueBaixo>0 },
    { icon:'🛒', label:'Vendidos no mês', id:'kpiVendidosMes', value:vendidosMes, currency:false },
  ];

  document.getElementById('kpiGrid').innerHTML = kpis.map((k,i)=>`
    <div class="kpi-card anim-fade-up" style="animation-delay:${i*0.05}s">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value ${k.alert?'alert':''}" id="${k.id}">${k.currency?'R$ 0,00':'0'}</div>
    </div>
  `).join('') + `
    <div class="kpi-card anim-fade-up" style="animation-delay:.35s">
      <div class="kpi-icon">🔥</div>
      <div class="kpi-label">Camisa mais vendida</div>
      <div class="kpi-value" style="font-size:16px;line-height:1.3;">
        ${topVenda ? escapeHtml(topVenda.produto.team) : 'Sem vendas ainda'}
      </div>
      ${topVenda ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim);margin-top:4px;">${topVenda.qtd} unidade(s) vendidas</div>` : ''}
    </div>
  `;

  kpis.forEach(k => countUp(document.getElementById(k.id), k.value, k.currency));
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderCharts(products){
  const porCategoria = {};
  const porTamanho = {};
  products.forEach(p=>{
    porCategoria[p.categoria] = (porCategoria[p.categoria]||0) + p.qtd;
    porTamanho[p.tamanho] = (porTamanho[p.tamanho]||0) + p.qtd;
  });

  new Chart(document.getElementById('chartCategoria'), {
    type:'bar',
    data:{
      labels:Object.keys(porCategoria),
      datasets:[{ data:Object.values(porCategoria), backgroundColor:CHART_RED, borderRadius:6, maxBarThickness:46 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        y:{beginAtZero:true, grid:{color:'#eee'}, ticks:{font:{family:'Inter'}}},
        x:{grid:{display:false}, ticks:{font:{family:'Inter'}}}
      }
    }
  });

  new Chart(document.getElementById('chartTamanho'), {
    type:'doughnut',
    data:{
      labels:Object.keys(porTamanho),
      datasets:[{
        data:Object.values(porTamanho),
        backgroundColor:[CHART_RED, CHART_BLACK, '#5c5c5c', CHART_GRAY, '#f2a7ad'],
        borderWidth:2, borderColor:'#ffffff'
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'bottom', labels:{font:{family:'Inter'}, boxWidth:12, padding:14}}},
      cutout:'62%'
    }
  });
}

function renderRankingMaisVendidas(){
  const top = camisasMaisVendidas(5);
  const el = document.getElementById('rankMaisVendidas');
  if(top.length === 0){
    el.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Nenhuma venda registrada ainda. Registre vendas na tela de Estoque.</p>`;
    return;
  }
  el.innerHTML = top.map((item,i)=>`
    <div class="rank-item">
      <span class="rank-num">${i+1}</span>
      ${item.produto.foto
        ? `<img class="rank-thumb" src="${item.produto.foto}" alt="">`
        : `<div class="rank-thumb"></div>`}
      <div class="rank-info">
        <div class="name">${escapeHtml(item.produto.team)}</div>
        <div class="sub">${item.produto.categoria} • ${item.produto.tamanho}</div>
      </div>
      <span class="rank-value">${item.qtd} un.</span>
    </div>
  `).join('');
}

function renderLowStockTable(products){
  const baixo = products.filter(p=>p.qtd<=LOW_STOCK).sort((a,b)=>a.qtd-b.qtd);
  document.getElementById('lowStockSub').textContent = `Quantidade igual ou menor que ${LOW_STOCK} unidades`;

  const table = document.getElementById('lowStockTable');
  if(baixo.length===0){
    table.innerHTML = `<tr><td style="color:var(--text-dim);padding:16px 10px;">Nenhuma camisa com estoque baixo no momento.</td></tr>`;
    return;
  }
  table.innerHTML = `
    <tr><th>Time</th><th>Tamanho</th><th>Estoque</th><th>Status</th></tr>
    ${baixo.map(p=>`
      <tr>
        <td>${escapeHtml(p.team)}</td>
        <td>${p.tamanho}</td>
        <td class="mono">${p.qtd}</td>
        <td><span class="dot ${p.qtd===0?'out':'low'}"></span>${p.qtd===0?'Esgotado':'Estoque baixo'}</td>
      </tr>`).join('')}
  `;
}

const products = getProducts();
renderKPIs(products);
renderCharts(products);
renderRankingMaisVendidas();
renderLowStockTable(products);
