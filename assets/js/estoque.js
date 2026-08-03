/* =========================================================
   KADU CAMISAS DE TIME — Estoque (movimentações por tamanho)
   ========================================================= */
renderShell('estoque');

let produtosCache = getProducts();
let movPage = 1;
const MOV_PAGE_SIZE = 10;

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
}

/* ===== popular selects de produto e tamanho ===== */
function popularSelectProdutos(){
  const select = document.getElementById('movProduto');
  const selecionadoAntes = select.value;
  produtosCache = getProducts();
  select.innerHTML = [...produtosCache]
    .sort((a,b)=>a.team.localeCompare(b.team,'pt-BR'))
    .map(p=>`<option value="${p.id}">${escapeHtml(p.team)} — ${p.categoria} (${p.sku})</option>`)
    .join('');
  if(selecionadoAntes && produtosCache.some(p=>String(p.id)===selecionadoAntes)){
    select.value = selecionadoAntes;
  }
  popularSelectTamanhos();
}

function popularSelectTamanhos(){
  const produtoId = Number(document.getElementById('movProduto').value);
  const produto = produtosCache.find(p=>p.id===produtoId);
  const select = document.getElementById('movTamanho');
  const tamanhoAntes = select.value;

  if(!produto){
    select.innerHTML = '';
    return;
  }
  select.innerHTML = SIZES.map(t=>{
    const qtd = (produto.tamanhos && produto.tamanhos[t]) || 0;
    return `<option value="${t}">${t} (estoque atual: ${qtd})</option>`;
  }).join('');

  if(tamanhoAntes && SIZES.includes(tamanhoAntes)){
    select.value = tamanhoAntes;
  }
  atualizarEstoqueAtual();
}

function atualizarEstoqueAtual(){
  const produtoId = Number(document.getElementById('movProduto').value);
  const tamanho = document.getElementById('movTamanho').value;
  const produto = produtosCache.find(p=>p.id===produtoId);
  const tipo = document.getElementById('movTipo').value;
  const hint = document.getElementById('movEstoqueAtual');
  const label = document.getElementById('movQtdLabel');

  if(produto && tamanho){
    const qtd = (produto.tamanhos && produto.tamanhos[tamanho]) || 0;
    hint.textContent = `Estoque atual do tamanho ${tamanho}: ${qtd} unidade(s)`;
  }
  label.textContent = tipo === 'Ajuste' ? 'Quantidade (use negativo para reduzir)' : 'Quantidade';
}

/* ===== registrar movimentação ===== */
function registrarMov(){
  document.getElementById('f-qtdMov').classList.remove('invalid');

  const produtoId = Number(document.getElementById('movProduto').value);
  const tamanho = document.getElementById('movTamanho').value;
  const tipo = document.getElementById('movTipo').value;
  const qtdRaw = document.getElementById('movQtd').value;
  const motivo = document.getElementById('movMotivo').value.trim();
  const observacao = document.getElementById('movObs').value.trim();

  const qtd = Number(qtdRaw);
  const valido = qtdRaw !== '' && Number.isFinite(qtd) && (tipo === 'Ajuste' ? qtd !== 0 : qtd > 0);
  if(!valido){
    document.getElementById('f-qtdMov').classList.add('invalid');
    showToast('Informe uma quantidade válida para essa movimentação.', 'error');
    return;
  }

  const resultado = registrarMovimentacao({ produtoId, tamanho, tipo, quantidade: qtd, motivo, observacao });
  if(!resultado.ok){
    showToast(resultado.erro, 'error');
    return;
  }

  document.getElementById('movQtd').value = '';
  document.getElementById('movMotivo').value = '';
  document.getElementById('movObs').value = '';
  popularSelectProdutos();
  showToast(`Movimentação registrada! Novo estoque do tamanho ${tamanho}: ${resultado.novaQtd} unidade(s).`, 'success');
  movPage = 1;
  renderMovTable();
}

/* ===== tabela de movimentações ===== */
function getFilteredMovs(){
  const q = removeAccents(document.getElementById('searchMov').value.trim());
  const tipo = document.getElementById('filterTipo').value;
  const produtos = getProducts();

  return getMovements()
    .map(m => ({ ...m, produto: produtos.find(p=>p.id===m.produtoId) }))
    .filter(m => m.produto)
    .filter(m=>{
      const matchTipo = !tipo || m.tipo === tipo;
      const haystack = removeAccents(`${m.produto.team} ${m.motivo}`);
      const matchQ = !q || haystack.includes(q);
      return matchTipo && matchQ;
    })
    .sort((a,b)=> new Date(b.data) - new Date(a.data));
}

function renderMovTable(){
  const list = getFilteredMovs();
  const totalPages = Math.max(1, Math.ceil(list.length / MOV_PAGE_SIZE));
  movPage = Math.min(movPage, totalPages);
  const pageItems = list.slice((movPage-1)*MOV_PAGE_SIZE, movPage*MOV_PAGE_SIZE);

  const body = document.getElementById('movTableBody');
  if(pageItems.length === 0){
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:40px 10px;">Nenhuma movimentação encontrada.</td></tr>`;
  } else {
    body.innerHTML = pageItems.map(m=>`
      <tr>
        <td class="mono">${formatDataBR(m.data)}</td>
        <td>${escapeHtml(m.produto.team)}</td>
        <td class="mono">${m.tamanho || '-'}</td>
        <td><span class="mov-tag ${m.tipo}">${m.tipo}</span></td>
        <td class="mono">${m.tipo==='Entrada' ? '+' : (m.tipo==='Ajuste' ? '±' : '-')}${m.quantidade}</td>
        <td>${escapeHtml(m.motivo) || '—'}</td>
        <td style="color:var(--text-dim);font-size:12.5px;">${escapeHtml(m.observacao) || '—'}</td>
      </tr>`).join('');
  }

  const start = list.length === 0 ? 0 : (movPage-1)*MOV_PAGE_SIZE + 1;
  const end = Math.min(movPage*MOV_PAGE_SIZE, list.length);
  let pageButtons = '';
  for(let i=1;i<=totalPages;i++) pageButtons += `<button class="${i===movPage?'active':''}" data-page="${i}">${i}</button>`;

  document.getElementById('movPagination').innerHTML = `
    <div class="info">Mostrando ${start}–${end} de ${list.length}</div>
    <div class="pages">
      <button data-page="${movPage-1}" ${movPage<=1?'disabled':''}>‹</button>
      ${pageButtons}
      <button data-page="${movPage+1}" ${movPage>=totalPages?'disabled':''}>›</button>
    </div>`;

  document.querySelectorAll('#movPagination button[data-page]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const p = Number(btn.dataset.page);
      if(p>=1 && p<=totalPages){ movPage = p; renderMovTable(); }
    });
  });
}

/* ===== eventos ===== */
document.getElementById('movProduto').addEventListener('change', popularSelectTamanhos);
document.getElementById('movTamanho').addEventListener('change', atualizarEstoqueAtual);
document.getElementById('movTipo').addEventListener('change', atualizarEstoqueAtual);
document.getElementById('searchMov').addEventListener('input', ()=>{ movPage=1; renderMovTable(); });
document.getElementById('filterTipo').addEventListener('change', ()=>{ movPage=1; renderMovTable(); });

document.addEventListener('keydown', e=>{
  const tag = document.activeElement.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if(e.key === '/' && !isTyping){
    e.preventDefault();
    document.getElementById('searchMov').focus();
  }
});

popularSelectProdutos();
renderMovTable();
