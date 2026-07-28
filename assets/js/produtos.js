/* =========================================================
   KADU CAMISAS DE TIME — Produtos
   ========================================================= */
renderShell('produtos');

let products = getProducts();
let editingId = null;
let deletingId = null;
let currentPhoto = null;
let viewMode = 'cards'; // 'cards' | 'table'
let activeChip = null;  // { type:'team'|'marca'|'baixo'|'temporada', value }
let sortKey = 'team';
let sortDir = 'asc';
let currentPage = 1;
const PAGE_SIZE = 8;

const COLUMNS = [
  { key:'nome',      label:'Nome',      default:true  },
  { key:'team',      label:'Time',      default:true  },
  { key:'liga',      label:'Liga',      default:false },
  { key:'temporada', label:'Temporada', default:false },
  { key:'marca',     label:'Marca',     default:true  },
  { key:'tamanho',   label:'Tamanho',   default:true  },
  { key:'categoria', label:'Categoria', default:false },
  { key:'qtd',       label:'Estoque',   default:true  },
  { key:'custo',     label:'Custo',     default:false },
  { key:'preco',     label:'Venda',     default:true  },
  { key:'lucro',     label:'Lucro',     default:false },
];
const COL_KEY = 'kadu_produtos_colunas';

function getVisibleColumns(){
  const raw = localStorage.getItem(COL_KEY);
  if(!raw) return COLUMNS.filter(c=>c.default).map(c=>c.key);
  try{ return JSON.parse(raw); } catch(e){ return COLUMNS.filter(c=>c.default).map(c=>c.key); }
}
function setVisibleColumns(keys){
  localStorage.setItem(COL_KEY, JSON.stringify(keys));
}

function jerseyIcon(categoria){
  const shirtPath = "M18 4 L8 10 L4 20 L11 24 L11 58 L45 58 L45 24 L52 20 L48 10 L38 4 L32 10 L26 10 Z";
  let fills;
  if(categoria === "Titular")       fills = { body:"#e11d2e", trim:"#0c0c0c" };
  else if(categoria === "Reserva")  fills = { body:"#ffffff", trim:"#0c0c0c" };
  else if(categoria === "Terceiro") fills = { body:"#0c0c0c", trim:"#e11d2e" };
  else                               fills = { body:"#f3f1ee", trim:"#e11d2e" };
  return `<svg class="jersey-icon" viewBox="0 0 56 62" fill="none">
    <path d="${shirtPath}" fill="${fills.body}" stroke="${fills.trim}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 10 Q28 16 34 10" stroke="${fills.trim}" stroke-width="2" fill="none"/>
  </svg>`;
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
}

/* ===== busca inteligente em tempo real ===== */
function smartMatch(product, query){
  if(!query) return true;
  const tokens = removeAccents(query).split(/\s+/).filter(Boolean);
  const haystack = removeAccents(`${product.nome} ${product.team} ${product.liga} ${product.temporada} ${product.marca} ${product.tamanho} ${product.sku}`);
  return tokens.every(t => haystack.includes(t));
}

function getFiltered(){
  const q = document.getElementById('searchInput').value.trim();
  const cat = document.getElementById('filterCategoria').value;
  const tam = document.getElementById('filterTamanho').value;
  const status = document.getElementById('filterStatus').value;

  let list = products.filter(p=>{
    const matchQ = smartMatch(p, q);
    const matchCat = !cat || p.categoria === cat;
    const matchTam = !tam || p.tamanho === tam;
    let matchStatus = true;
    if(status === 'ok') matchStatus = p.qtd > LOW_STOCK;
    if(status === 'low') matchStatus = p.qtd > 0 && p.qtd <= LOW_STOCK;
    if(status === 'out') matchStatus = p.qtd === 0;
    return matchQ && matchCat && matchTam && matchStatus;
  });

  if(activeChip){
    if(activeChip.type === 'baixo') list = list.filter(p=>p.qtd>0 && p.qtd<=LOW_STOCK);
    else if(activeChip.type === 'team') list = list.filter(p=>p.team===activeChip.value);
    else if(activeChip.type === 'marca') list = list.filter(p=>p.marca===activeChip.value);
    else if(activeChip.type === 'temporada') list = list.filter(p=>p.temporada===activeChip.value);
  }
  return list;
}

/* ===== chips de filtro rápido (gerados a partir dos dados atuais) ===== */
function topValues(field, limit){
  const counts = {};
  products.forEach(p=>{ if(p[field]) counts[p[field]] = (counts[field] ? counts[field] : (counts[p[field]]||0)+1) || (counts[p[field]]||0)+1; });
  // contagem simples
  const map = {};
  products.forEach(p=>{ if(p[field]) map[p[field]] = (map[p[field]]||0)+1; });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(x=>x[0]);
}

function renderChips(){
  const chips = [];
  chips.push({ type:'baixo', label:'⚠ Estoque baixo' });
  topValues('team', 3).forEach(t => chips.push({ type:'team', value:t, label:`Apenas ${t}` }));
  topValues('marca', 2).forEach(m => chips.push({ type:'marca', value:m, label:`Apenas ${m}` }));
  topValues('temporada', 1).forEach(s => chips.push({ type:'temporada', value:s, label:`Temporada ${s}` }));

  document.getElementById('chipsRow').innerHTML = chips.map(c=>{
    const isActive = activeChip && activeChip.type===c.type && activeChip.value===c.value;
    return `<button class="chip ${isActive?'active':''}" data-type="${c.type}" data-value="${c.value||''}">${c.label}</button>`;
  }).join('');

  document.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const type = btn.dataset.type;
      const value = btn.dataset.value;
      if(activeChip && activeChip.type===type && activeChip.value===value){
        activeChip = null;
      } else {
        activeChip = { type, value };
      }
      currentPage = 1;
      renderChips();
      renderCurrentView();
    });
  });
}

/* ===== VIEW: CARDS ===== */
function renderGridCards(list){
  const grid = document.getElementById('grid');
  if(list.length === 0){
    grid.innerHTML = emptyStateHTML();
    return;
  }
  grid.innerHTML = list.map((p, i)=>{
    const isOut = p.qtd === 0;
    const isLow = p.qtd > 0 && p.qtd <= LOW_STOCK;
    const scoreClass = isOut ? 'zero' : (isLow ? 'low' : '');
    let statusTag = '';
    if(isOut) statusTag = `<span class="status-tag out">Esgotado</span>`;
    else if(isLow) statusTag = `<span class="status-tag low">Estoque baixo</span>`;

    const media = p.foto
      ? `<img src="${p.foto}" alt="Foto da camisa ${escapeHtml(p.team)}" style="cursor:pointer" onclick="openLightbox('${p.foto}')">`
      : jerseyIcon(p.categoria);

    return `
      <div class="card" style="animation-delay:${Math.min(i*0.04,0.4)}s">
        <div class="card-top">
          <span class="sku-tag mono">${p.sku}</span>
          ${media}
          <div class="card-name">
            <div class="team">${escapeHtml(p.team)}</div>
            <div class="cat">${p.marca || ''} • ${p.categoria}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="row-between">
            <span class="size-pill">${p.tamanho}</span>
            <span class="price">${formatBRL(p.preco)}<small>Custo: ${formatBRL(p.custo)}</small></span>
          </div>
          <div class="scoreboard ${scoreClass}">
            <span class="label">Estoque</span>
            <span class="digits">${String(p.qtd).padStart(2,'0')}</span>
          </div>
          ${statusTag ? `<div class="tag-row">${statusTag}</div>` : ''}
          <div class="card-actions">
            <button class="icon-btn" onclick="openHistoricoModal(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
              Histórico
            </button>
            <button class="icon-btn" onclick="openEditModal(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Editar
            </button>
            <button class="icon-btn danger" onclick="openConfirmModal(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function emptyStateHTML(){
  return `
    <div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <h3>Nenhuma camisa encontrada</h3>
      <p>Ajuste os filtros de busca ou cadastre uma nova camisa no estoque.</p>
      <button class="btn-primary" style="margin:0 auto;" onclick="openAddModal()">Cadastrar camisa</button>
    </div>`;
}

/* ===== VIEW: TABELA ===== */
function renderColToggle(){
  const visible = getVisibleColumns();
  document.getElementById('colTogglePanel').innerHTML = COLUMNS.map(c=>`
    <label>
      <input type="checkbox" data-col="${c.key}" ${visible.includes(c.key)?'checked':''}>
      ${c.label}
    </label>
  `).join('');
  document.querySelectorAll('#colTogglePanel input').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      let v = getVisibleColumns();
      if(inp.checked) v = [...new Set([...v, inp.dataset.col])];
      else v = v.filter(k=>k!==inp.dataset.col);
      setVisibleColumns(v);
      renderTable(getSortedFiltered());
    });
  });
}

function getSortedFiltered(){
  const list = getFiltered();
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...list].sort((a,b)=>{
    let va = a[sortKey], vb = b[sortKey];
    if(typeof va === 'string') va = removeAccents(va);
    if(typeof vb === 'string') vb = removeAccents(vb);
    if(va < vb) return -1*dir;
    if(va > vb) return 1*dir;
    return 0;
  });
}

function renderTable(list){
  const visible = getVisibleColumns();
  const cols = COLUMNS.filter(c=>visible.includes(c.key));

  const headRow = document.getElementById('tableHeadRow');
  headRow.innerHTML = `<th>Foto</th>` + cols.map(c=>`
    <th data-key="${c.key}" class="${sortKey===c.key?'sorted':''}">
      ${c.label}<span class="sort-arrow">${sortKey===c.key ? (sortDir==='asc'?'▲':'▼') : '▲'}</span>
    </th>`).join('') + `<th>Ações</th>`;

  headRow.querySelectorAll('th[data-key]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.key;
      if(sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'asc'; }
      renderCurrentView();
    });
  });

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const pageItems = list.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  const body = document.getElementById('tableBody');
  if(pageItems.length === 0){
    body.innerHTML = `<tr><td colspan="${cols.length+2}" style="text-align:center;color:var(--text-dim);padding:40px 10px;">Nenhuma camisa encontrada com esses filtros.</td></tr>`;
  } else {
    body.innerHTML = pageItems.map(p=>{
      const cells = cols.map(c=>{
        if(c.key === 'qtd') return `<td class="mono">${p.qtd}</td>`;
        if(c.key === 'custo') return `<td>${formatBRL(p.custo)}</td>`;
        if(c.key === 'preco') return `<td>${formatBRL(p.preco)}</td>`;
        if(c.key === 'lucro') return `<td>${formatBRL(p.preco-p.custo)}</td>`;
        return `<td>${escapeHtml(p[c.key] ?? '')}</td>`;
      }).join('');

      const thumb = p.foto
        ? `<div class="thumb" onclick="openLightbox('${p.foto}')"><img src="${p.foto}" alt=""></div>`
        : `<div class="thumb">${jerseyIcon(p.categoria)}</div>`;

      return `<tr>
        <td>${thumb}</td>
        ${cells}
        <td>
          <div class="table-actions">
            <button class="table-icon-btn" title="Histórico" onclick="openHistoricoModal(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
            </button>
            <button class="table-icon-btn" title="Editar" onclick="openEditModal(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="table-icon-btn" title="Remover" onclick="openConfirmModal(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  renderPagination(list.length, totalPages);
}

function renderPagination(totalItems, totalPages){
  const start = totalItems === 0 ? 0 : (currentPage-1)*PAGE_SIZE + 1;
  const end = Math.min(currentPage*PAGE_SIZE, totalItems);
  let pageButtons = '';
  for(let i=1;i<=totalPages;i++){
    pageButtons += `<button class="${i===currentPage?'active':''}" data-page="${i}">${i}</button>`;
  }
  document.getElementById('pagination').innerHTML = `
    <div class="info">Mostrando ${start}–${end} de ${totalItems}</div>
    <div class="pages">
      <button data-page="${currentPage-1}" ${currentPage<=1?'disabled':''}>‹</button>
      ${pageButtons}
      <button data-page="${currentPage+1}" ${currentPage>=totalPages?'disabled':''}>›</button>
    </div>`;
  document.querySelectorAll('#pagination button[data-page]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const p = Number(btn.dataset.page);
      if(p>=1 && p<=totalPages){ currentPage = p; renderCurrentView(); }
    });
  });
}

/* ===== controle geral de renderização ===== */
function renderCurrentView(){
  if(viewMode === 'cards'){
    currentPage = 1;
    renderGridCards(getFiltered());
  } else {
    renderTable(getSortedFiltered());
  }
}

function setViewMode(mode){
  viewMode = mode;
  document.getElementById('grid').style.display = mode==='cards' ? 'grid' : 'none';
  document.getElementById('tableWrap').style.display = mode==='table' ? 'block' : 'none';
  document.getElementById('btnViewCards').classList.toggle('active', mode==='cards');
  document.getElementById('btnViewTable').classList.toggle('active', mode==='table');
  if(mode==='table') renderColToggle();
  renderCurrentView();
}

/* ===== Lightbox ===== */
function openLightbox(src){
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
}

/* ===== Histórico ===== */
function openHistoricoModal(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('historicoTitle').textContent = `Histórico — ${p.team}`;
  const hist = getHistoricoProduto(id);
  const body = document.getElementById('timelineBody');
  if(hist.length === 0){
    body.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Nenhuma movimentação registrada para esse produto ainda. Registre entradas, saídas, vendas ou ajustes na tela de Estoque.</p>`;
  } else {
    body.innerHTML = hist.map(m=>{
      const sinal = (m.tipo==='Entrada' || (m.tipo==='Ajuste'))
        ? (m.quantidade>=0 && m.tipo==='Ajuste' ? '+' : (m.tipo==='Entrada' ? '+' : ''))
        : '-';
      return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-body">
          <div class="timeline-date">${formatDataBR(m.data)}</div>
          <div class="timeline-desc">
            <span class="mov-tag ${m.tipo}">${m.tipo}</span>
            <b>${sinal}${m.quantidade}</b> unidade(s)
            ${m.motivo ? ` • ${escapeHtml(m.motivo)}` : ''}
          </div>
          ${m.observacao ? `<div style="font-size:12.5px;color:var(--text-dim);margin-top:3px;">${escapeHtml(m.observacao)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }
  document.getElementById('historicoOverlay').classList.add('open');
}
function closeHistoricoModal(){
  document.getElementById('historicoOverlay').classList.remove('open');
}

/* ===== upload de foto ===== */
function renderUploadArea(){
  const area = document.getElementById('uploadArea');
  if(currentPhoto){
    area.innerHTML = `
      <div class="upload-preview">
        <img src="${currentPhoto}" alt="Pré-visualização da foto">
        <button type="button" id="removePhotoBtn">Remover foto</button>
      </div>`;
    document.getElementById('removePhotoBtn').addEventListener('click', ()=>{
      currentPhoto = null;
      renderUploadArea();
    });
  } else {
    area.innerHTML = `
      <div class="upload-zone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
        <span>Clique ou arraste uma foto aqui (JPG ou PNG)</span>
        <input type="file" accept="image/*" id="photoInput">
      </div>`;
    document.getElementById('photoInput').addEventListener('change', handlePhotoInput);
  }
}
function handlePhotoInput(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ currentPhoto = reader.result; renderUploadArea(); };
  reader.readAsDataURL(file);
}

/* ===== lucro automático (preview ao vivo) ===== */
function updateLucroPreview(){
  const custo = Number(document.getElementById('inCusto').value) || 0;
  const preco = Number(document.getElementById('inPreco').value) || 0;
  const lucro = preco - custo;
  const box = document.getElementById('lucroPreview');
  box.textContent = formatBRL(lucro);
  box.className = 'readonly-box ' + (lucro >= 0 ? 'positive' : 'negative');
}

/* ===== modal de cadastro/edição ===== */
function clearErrors(){
  ['f-team','f-nome','f-qtd','f-custo','f-preco'].forEach(id=>document.getElementById(id).classList.remove('invalid'));
}

function openAddModal(){
  editingId = null;
  currentPhoto = null;
  document.getElementById('formTitle').textContent = 'Nova Camisa';
  ['inNome','inTeam','inLiga','inTemporada','inMarca','inSku','inQtd','inCusto','inPreco','inObs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('inModelo').value = 'Torcedor';
  document.getElementById('inCategoria').value = 'Titular';
  document.getElementById('inTamanho').value = 'M';
  document.getElementById('inSku').disabled = false;
  document.getElementById('inSku').placeholder = 'Gerado automaticamente (ou digite o seu)';
  document.getElementById('inQtd').disabled = false;
  document.getElementById('qtdHint').textContent = '';
  clearErrors();
  updateLucroPreview();
  renderUploadArea();
  document.getElementById('formOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('inNome').focus(), 50);
}

function openEditModal(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  editingId = id;
  currentPhoto = p.foto || null;
  document.getElementById('formTitle').textContent = 'Editar Camisa';
  document.getElementById('inNome').value = p.nome || '';
  document.getElementById('inTeam').value = p.team || '';
  document.getElementById('inLiga').value = p.liga || '';
  document.getElementById('inTemporada').value = p.temporada || '';
  document.getElementById('inMarca').value = p.marca || '';
  document.getElementById('inModelo').value = p.modelo || 'Torcedor';
  document.getElementById('inCategoria').value = p.categoria;
  document.getElementById('inTamanho').value = p.tamanho;
  document.getElementById('inSku').value = p.sku;
  document.getElementById('inSku').disabled = true;
  document.getElementById('inCusto').value = p.custo;
  document.getElementById('inPreco').value = p.preco;
  document.getElementById('inObs').value = p.observacoes || '';
  document.getElementById('inQtd').value = p.qtd;
  document.getElementById('inQtd').disabled = true;
  document.getElementById('qtdHint').textContent = 'Para alterar a quantidade, registre uma movimentação na tela de Estoque.';
  clearErrors();
  updateLucroPreview();
  renderUploadArea();
  document.getElementById('formOverlay').classList.add('open');
}

function closeFormModal(){
  document.getElementById('formOverlay').classList.remove('open');
}

function saveProduct(){
  clearErrors();
  const nome = document.getElementById('inNome').value.trim();
  const team = document.getElementById('inTeam').value.trim();
  const liga = document.getElementById('inLiga').value.trim();
  const temporada = document.getElementById('inTemporada').value.trim();
  const marca = document.getElementById('inMarca').value.trim();
  const modelo = document.getElementById('inModelo').value;
  const categoria = document.getElementById('inCategoria').value;
  const tamanho = document.getElementById('inTamanho').value;
  const sku = document.getElementById('inSku').value.trim();
  const custo = document.getElementById('inCusto').value;
  const preco = document.getElementById('inPreco').value;
  const observacoes = document.getElementById('inObs').value.trim();
  const qtd = document.getElementById('inQtd').value;

  let valid = true;
  if(!nome){ document.getElementById('f-nome').classList.add('invalid'); valid = false; }
  if(!team){ document.getElementById('f-team').classList.add('invalid'); valid = false; }
  if(custo === '' || Number(custo) < 0 || !Number.isFinite(Number(custo))){ document.getElementById('f-custo').classList.add('invalid'); valid = false; }
  if(preco === '' || Number(preco) < 0 || !Number.isFinite(Number(preco))){ document.getElementById('f-preco').classList.add('invalid'); valid = false; }
  if(!editingId && (qtd === '' || Number(qtd) < 0 || !Number.isFinite(Number(qtd)))){ document.getElementById('f-qtd').classList.add('invalid'); valid = false; }
  if(!valid){
    showToast('Verifique os campos destacados no formulário.', 'error');
    return;
  }

  const payload = {
    nome, team, liga, temporada, marca, modelo, categoria, tamanho,
    custo: Number(custo), preco: Number(preco),
    observacoes, foto: currentPhoto
  };
  if(sku) payload.sku = sku;

  if(editingId){
    updateProduct(editingId, payload);
    showToast('Camisa atualizada com sucesso!', 'success');
  } else {
    payload.qtd = Math.round(Number(qtd));
    addProduct(payload);
    showToast('Camisa cadastrada com sucesso!', 'success');
  }
  products = getProducts();
  closeFormModal();
  renderChips();
  renderCurrentView();
}

/* ===== remoção ===== */
function openConfirmModal(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  deletingId = id;
  document.getElementById('confirmTeamName').textContent = `${p.team} — ${p.categoria} ${p.tamanho}`;
  document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirmModal(){
  document.getElementById('confirmOverlay').classList.remove('open');
  deletingId = null;
}
function confirmDelete(){
  deleteProduct(deletingId);
  products = getProducts();
  closeConfirmModal();
  showToast('Camisa removida do estoque.', 'success');
  renderChips();
  renderCurrentView();
}

/* ===== eventos ===== */
document.getElementById('searchInput').addEventListener('input', ()=>{ currentPage=1; renderCurrentView(); });
document.getElementById('filterCategoria').addEventListener('change', ()=>{ currentPage=1; renderCurrentView(); });
document.getElementById('filterTamanho').addEventListener('change', ()=>{ currentPage=1; renderCurrentView(); });
document.getElementById('filterStatus').addEventListener('change', ()=>{ currentPage=1; renderCurrentView(); });
document.getElementById('inCusto').addEventListener('input', updateLucroPreview);
document.getElementById('inPreco').addEventListener('input', updateLucroPreview);
document.getElementById('btnViewCards').addEventListener('click', ()=>setViewMode('cards'));
document.getElementById('btnViewTable').addEventListener('click', ()=>setViewMode('table'));
document.getElementById('colToggleBtn').addEventListener('click', ()=>{
  document.getElementById('colTogglePanel').classList.toggle('open');
});
document.addEventListener('click', (e)=>{
  const panel = document.getElementById('colTogglePanel');
  const btn = document.getElementById('colToggleBtn');
  if(panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)){
    panel.classList.remove('open');
  }
});
document.querySelectorAll('.overlay').forEach(ov=>{
  ov.addEventListener('click', e=>{ if(e.target === ov) ov.classList.remove('open'); });
});
document.getElementById('lightbox').addEventListener('click', e=>{
  if(e.target.id === 'lightbox') closeLightbox();
});

/* ===== atalhos de teclado ===== */
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){
    document.getElementById('formOverlay').classList.remove('open');
    document.getElementById('confirmOverlay').classList.remove('open');
    document.getElementById('historicoOverlay').classList.remove('open');
    closeLightbox();
  }
  const tag = document.activeElement.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if(e.key === '/' && !isTyping){
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  if((e.key === 'n' || e.key === 'N') && !isTyping){
    openAddModal();
  }
});

renderChips();
renderCurrentView();
