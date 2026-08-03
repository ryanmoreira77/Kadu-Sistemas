/* =========================================================
   KADU CAMISAS DE TIME — Camada de dados
   Persistência via localStorage (sem backend)
   Cada produto (modelo de camisa) guarda um mapa de tamanhos,
   cada um com sua própria quantidade em estoque.
   ========================================================= */
const STORAGE_KEY = 'kadu_estoque_produtos';
const MOV_KEY = 'kadu_movimentacoes';
const SETTINGS_KEY = 'kadu_settings';
const AUTH_KEY = 'kadu_auth';
const USER_KEY = 'kadu_user';
const LOW_STOCK = 5;
const PARADO_DIAS = 30;

const SIZES = ['PP','P','M','G','XL','2XL','3XL','4XL'];

/* =================== PRODUTOS =================== */
function seedProducts(){
  const now = Date.now();
  const day = 86400000;
  const z = ()=>({ PP:0,P:0,M:0,G:0,XL:0,'2XL':0,'3XL':0,'4XL':0 });
  return [
    { id:1, sku:'KC-0001', nome:'Camisa Titular Flamengo 24/25', team:'Flamengo', liga:'Brasileirão', temporada:'24/25', marca:'Adidas', modelo:'Torcedor', categoria:'Titular', tamanhos:{...z(), P:4, M:8, G:18, XL:6, '2XL':2}, custo:120.00, preco:249.90, foto:null, observacoes:'', criadoEm: now-200*day },
    { id:2, sku:'KC-0002', nome:'Camisa Reserva Corinthians 24/25', team:'Corinthians', liga:'Brasileirão', temporada:'24/25', marca:'Nike', modelo:'Torcedor', categoria:'Reserva', tamanhos:{...z(), M:4, G:1}, custo:110.00, preco:229.90, foto:null, observacoes:'', criadoEm: now-150*day },
    { id:3, sku:'KC-0003', nome:'Camisa Titular São Paulo 24/25', team:'São Paulo', liga:'Brasileirão', temporada:'24/25', marca:'Adidas', modelo:'Jogador', categoria:'Titular', tamanhos:{...z(), P:0, M:0, G:0}, custo:120.00, preco:249.90, foto:null, observacoes:'', criadoEm: now-190*day },
    { id:4, sku:'KC-0004', nome:'Camisa Retrô Palmeiras 1999', team:'Palmeiras', liga:'Brasileirão', temporada:'1999', marca:'Reebok', modelo:'Torcedor', categoria:'Retrô', tamanhos:{...z(), G:5, XL:9, '2XL':1}, custo:140.00, preco:289.90, foto:null, observacoes:'Edição comemorativa', criadoEm: now-60*day },
    { id:5, sku:'KC-0005', nome:'Camisa Titular Seleção Brasileira 24/25', team:'Seleção Brasileira', liga:'Seleções', temporada:'24/25', marca:'Nike', modelo:'Jogador', categoria:'Titular', tamanhos:{...z(), P:6, M:14, G:32, XL:10, '2XL':4, '3XL':2}, custo:150.00, preco:299.90, foto:null, observacoes:'', criadoEm: now-30*day },
    { id:6, sku:'KC-0006', nome:'Camisa Titular Real Madrid 24/25', team:'Real Madrid', liga:'La Liga', temporada:'24/25', marca:'Adidas', modelo:'Torcedor', categoria:'Titular', tamanhos:{...z(), G:3}, custo:160.00, preco:319.90, foto:null, observacoes:'', criadoEm: now-100*day },
    { id:7, sku:'KC-0007', nome:'Camisa Terceiro Grêmio 24/25', team:'Grêmio', liga:'Brasileirão', temporada:'24/25', marca:'Umbro', modelo:'Torcedor', categoria:'Terceiro', tamanhos:{...z(), XL:5, '2XL':6, '3XL':1}, custo:115.00, preco:239.90, foto:null, observacoes:'', criadoEm: now-80*day },
    { id:8, sku:'KC-0008', nome:'Camisa Reserva Vasco da Gama 24/25', team:'Vasco da Gama', liga:'Brasileirão', temporada:'24/25', marca:'Kappa', modelo:'Torcedor', categoria:'Reserva', tamanhos:{...z(), M:6}, custo:110.00, preco:229.90, foto:null, observacoes:'', criadoEm: now-40*day },
  ];
}

function tamanhosVazios(){
  const obj = {};
  SIZES.forEach(t => obj[t] = 0);
  return obj;
}

function totalQtd(produto){
  return Object.values(produto.tamanhos || {}).reduce((s,n)=>s+(Number(n)||0), 0);
}

function getProducts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    const seed = seedProducts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try{ return JSON.parse(raw); }
  catch(e){
    const seed = seedProducts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveProducts(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addProduct(p){
  const list = getProducts();
  const nextId = list.length ? Math.max(...list.map(x=>x.id)) + 1 : 1;
  p.id = nextId;
  if(!p.sku){
    const nextSkuNum = list.length
      ? Math.max(...list.map(x=>parseInt((x.sku||'KC-0000').split('-')[1], 10) || 0)) + 1
      : 1;
    p.sku = 'KC-' + String(nextSkuNum).padStart(4, '0');
  }
  p.tamanhos = { ...tamanhosVazios(), ...(p.tamanhos || {}) };
  p.criadoEm = Date.now();
  list.push(p);
  saveProducts(list);
  return p;
}

function updateProduct(id, patch){
  const list = getProducts();
  const idx = list.findIndex(x => x.id === id);
  if(idx > -1){
    list[idx] = { ...list[idx], ...patch };
    saveProducts(list);
  }
}

function deleteProduct(id){
  saveProducts(getProducts().filter(x => x.id !== id));
  saveMovements(getMovements().filter(m => m.produtoId !== id));
}

function getProduct(id){
  return getProducts().find(p => p.id === id) || null;
}

/**
 * "Achata" todos os produtos em linhas de produto+tamanho — a unidade
 * usada para estoque baixo, movimentações e relatório de estoque.
 * Só inclui tamanhos que já tiveram alguma quantidade definida (>0 em
 * algum momento) ou que estão com estoque agora, para não poluir a
 * lista com tamanhos que aquele modelo nunca teve.
 */
function getEstoqueLinhas(){
  const produtos = getProducts();
  const linhas = [];
  produtos.forEach(p=>{
    SIZES.forEach(tamanho=>{
      const qtd = (p.tamanhos && p.tamanhos[tamanho]) || 0;
      if(qtd > 0) linhas.push({ produtoId: p.id, produto: p, tamanho, qtd });
    });
  });
  return linhas;
}

/* =================== MOVIMENTAÇÕES DE ESTOQUE =================== */
function seedMovements(){
  const now = Date.now();
  const day = 86400000;
  return [
    { id:1, produtoId:1, tamanho:'G', tipo:'Entrada', quantidade:15, data:new Date(now-25*day).toISOString(), motivo:'Fornecedor ABC Imports', observacao:'' },
    { id:2, produtoId:1, tamanho:'G', tipo:'Venda',   quantidade:2,  data:new Date(now-18*day).toISOString(), motivo:'Venda balcão', observacao:'', valorUnitario:249.90 },
    { id:3, produtoId:5, tamanho:'G', tipo:'Venda',   quantidade:4,  data:new Date(now-10*day).toISOString(), motivo:'Venda online', observacao:'', valorUnitario:299.90 },
    { id:4, produtoId:4, tamanho:'XL',tipo:'Ajuste',  quantidade:1,  data:new Date(now-6*day).toISOString(),  motivo:'Contagem de inventário', observacao:'Divergência encontrada' },
    { id:5, produtoId:8, tamanho:'M', tipo:'Venda',   quantidade:2,  data:new Date(now-3*day).toISOString(),  motivo:'Venda balcão', observacao:'', valorUnitario:229.90 },
  ];
}

function getMovements(){
  const raw = localStorage.getItem(MOV_KEY);
  if(!raw){
    const seed = seedMovements();
    localStorage.setItem(MOV_KEY, JSON.stringify(seed));
    return seed;
  }
  try{ return JSON.parse(raw); }
  catch(e){ return []; }
}

function saveMovements(list){
  localStorage.setItem(MOV_KEY, JSON.stringify(list));
}

/**
 * Registra uma movimentação de estoque para um tamanho específico de
 * um produto, e atualiza a quantidade desse tamanho.
 * tipo: 'Entrada' | 'Saída' | 'Venda' | 'Ajuste'
 * Para Ajuste, quantidade pode ser positiva (+) ou negativa (-).
 */
function registrarMovimentacao({ produtoId, tamanho, tipo, quantidade, motivo, observacao }){
  const produtos = getProducts();
  const produto = produtos.find(p => p.id === produtoId);
  if(!produto) return { ok:false, erro:'Produto não encontrado.' };
  if(!SIZES.includes(tamanho)) return { ok:false, erro:'Tamanho inválido.' };

  let delta = 0;
  if(tipo === 'Entrada') delta = Math.abs(quantidade);
  else if(tipo === 'Saída' || tipo === 'Venda') delta = -Math.abs(quantidade);
  else if(tipo === 'Ajuste') delta = quantidade;

  const qtdAtual = (produto.tamanhos && produto.tamanhos[tamanho]) || 0;
  const novaQtd = qtdAtual + delta;
  if(novaQtd < 0){
    return { ok:false, erro:`Estoque insuficiente no tamanho ${tamanho}. Disponível: ${qtdAtual} unidade(s).` };
  }

  const novosTamanhos = { ...tamanhosVazios(), ...produto.tamanhos, [tamanho]: novaQtd };
  updateProduct(produtoId, { tamanhos: novosTamanhos });

  const movs = getMovements();
  const nextId = movs.length ? Math.max(...movs.map(m=>m.id)) + 1 : 1;
  const registro = {
    id: nextId,
    produtoId,
    tamanho,
    tipo,
    quantidade: Math.abs(quantidade),
    data: new Date().toISOString(),
    motivo: motivo || '',
    observacao: observacao || ''
  };
  if(tipo === 'Venda') registro.valorUnitario = produto.preco;
  movs.push(registro);
  saveMovements(movs);

  return { ok:true, novaQtd };
}

function getHistoricoProduto(produtoId){
  return getMovements()
    .filter(m => m.produtoId === produtoId)
    .sort((a,b) => new Date(b.data) - new Date(a.data));
}

/* =================== ESTATÍSTICAS =================== */
function isMesmoMes(dataISO){
  const d = new Date(dataISO);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function vendasDoMes(){
  return getMovements().filter(m => m.tipo === 'Venda' && isMesmoMes(m.data));
}

function unidadesVendidasNoMes(){
  return vendasDoMes().reduce((s,m)=>s+m.quantidade, 0);
}

function camisasMaisVendidas(limit){
  const vendas = getMovements().filter(m => m.tipo === 'Venda');
  const porProduto = {};
  vendas.forEach(m=>{
    porProduto[m.produtoId] = (porProduto[m.produtoId] || 0) + m.quantidade;
  });
  const produtos = getProducts();
  return Object.entries(porProduto)
    .map(([id, qtd]) => ({ produto: produtos.find(p=>p.id===Number(id)), qtd }))
    .filter(x => x.produto)
    .sort((a,b)=>b.qtd-a.qtd)
    .slice(0, limit || 5);
}

function receitaTotal(){
  return getMovements()
    .filter(m => m.tipo === 'Venda')
    .reduce((s,m)=>s + m.quantidade * (m.valorUnitario || 0), 0);
}

function produtosParados(){
  const limite = Date.now() - PARADO_DIAS*86400000;
  const vendasRecentesPorProduto = new Set(
    getMovements()
      .filter(m => m.tipo === 'Venda' && new Date(m.data).getTime() >= limite)
      .map(m => m.produtoId)
  );
  return getProducts().filter(p => totalQtd(p) > 0 && !vendasRecentesPorProduto.has(p.id));
}

function formatBRL(v){
  return Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

function formatDataBR(iso){
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function removeAccents(str){
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* =================== CONFIGURAÇÕES / MARCA =================== */
function getSettings(){
  const raw = localStorage.getItem(SETTINGS_KEY);
  const defaults = {
    companyName: 'Kadu Camisas de Time',
    logoDataUrl: null,
    accentColor: '#e11d2e',
    storeInfo: { telefone:'', endereco:'', instagram:'' }
  };
  if(!raw) return defaults;
  try{ return { ...defaults, ...JSON.parse(raw) }; }
  catch(e){ return defaults; }
}

function saveSettings(settings){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* =================== AUTENTICAÇÃO (client-side, legado) =================== */
function isLoggedIn(){ return localStorage.getItem(AUTH_KEY) === 'true'; }
function requireAuth(){ if(!isLoggedIn()) window.location.href = 'index.html'; }
