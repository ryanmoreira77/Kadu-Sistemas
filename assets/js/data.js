/* =========================================================
   KADU CAMISAS DE TIME — Camada de dados
   Persistência via localStorage (sem backend)
   ========================================================= */
const STORAGE_KEY = 'kadu_estoque_produtos';
const MOV_KEY = 'kadu_movimentacoes';
const SETTINGS_KEY = 'kadu_settings';
const AUTH_KEY = 'kadu_auth';
const USER_KEY = 'kadu_user';
const LOW_STOCK = 5;
const PARADO_DIAS = 30;

/* =================== PRODUTOS =================== */
function seedProducts(){
  const now = Date.now();
  const day = 86400000;
  return [
    { id:1, sku:'KC-0001', nome:'Camisa Titular Flamengo 24/25', team:'Flamengo', liga:'Brasileirão', temporada:'24/25', marca:'Adidas', modelo:'Torcedor', categoria:'Titular',  tamanho:'G',  qtd:18, custo:120.00, preco:249.90, foto:null, observacoes:'', criadoEm: now-200*day },
    { id:2, sku:'KC-0002', nome:'Camisa Reserva Corinthians 24/25', team:'Corinthians', liga:'Brasileirão', temporada:'24/25', marca:'Nike', modelo:'Torcedor', categoria:'Reserva', tamanho:'M', qtd:4, custo:110.00, preco:229.90, foto:null, observacoes:'', criadoEm: now-150*day },
    { id:3, sku:'KC-0003', nome:'Camisa Titular São Paulo 24/25', team:'São Paulo', liga:'Brasileirão', temporada:'24/25', marca:'Adidas', modelo:'Jogador', categoria:'Titular', tamanho:'P', qtd:0, custo:120.00, preco:249.90, foto:null, observacoes:'', criadoEm: now-190*day },
    { id:4, sku:'KC-0004', nome:'Camisa Retrô Palmeiras 1999', team:'Palmeiras', liga:'Brasileirão', temporada:'1999', marca:'Reebok', modelo:'Torcedor', categoria:'Retrô', tamanho:'GG', qtd:9, custo:140.00, preco:289.90, foto:null, observacoes:'Edição comemorativa', criadoEm: now-60*day },
    { id:5, sku:'KC-0005', nome:'Camisa Titular Seleção Brasileira 24/25', team:'Seleção Brasileira', liga:'Seleções', temporada:'24/25', marca:'Nike', modelo:'Jogador', categoria:'Titular', tamanho:'M', qtd:32, custo:150.00, preco:299.90, foto:null, observacoes:'', criadoEm: now-30*day },
    { id:6, sku:'KC-0006', nome:'Camisa Titular Real Madrid 24/25', team:'Real Madrid', liga:'La Liga', temporada:'24/25', marca:'Adidas', modelo:'Torcedor', categoria:'Titular', tamanho:'G', qtd:3, custo:160.00, preco:319.90, foto:null, observacoes:'', criadoEm: now-100*day },
    { id:7, sku:'KC-0007', nome:'Camisa Terceiro Grêmio 24/25', team:'Grêmio', liga:'Brasileirão', temporada:'24/25', marca:'Umbro', modelo:'Torcedor', categoria:'Terceiro', tamanho:'XG', qtd:11, custo:115.00, preco:239.90, foto:null, observacoes:'', criadoEm: now-80*day },
    { id:8, sku:'KC-0008', nome:'Camisa Reserva Vasco da Gama 24/25', team:'Vasco da Gama', liga:'Brasileirão', temporada:'24/25', marca:'Kappa', modelo:'Torcedor', categoria:'Reserva', tamanho:'M', qtd:6, custo:110.00, preco:229.90, foto:null, observacoes:'', criadoEm: now-40*day },
  ];
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

/* =================== MOVIMENTAÇÕES DE ESTOQUE =================== */
function seedMovements(){
  const now = Date.now();
  const day = 86400000;
  return [
    { id:1, produtoId:1, tipo:'Entrada', quantidade:15, data:new Date(now-25*day).toISOString(), motivo:'Fornecedor ABC Imports', observacao:'' },
    { id:2, produtoId:1, tipo:'Venda',   quantidade:2,  data:new Date(now-18*day).toISOString(), motivo:'Venda balcão', observacao:'', valorUnitario:249.90 },
    { id:3, produtoId:5, tipo:'Venda',   quantidade:4,  data:new Date(now-10*day).toISOString(), motivo:'Venda online', observacao:'', valorUnitario:299.90 },
    { id:4, produtoId:4, tipo:'Ajuste',  quantidade:1,  data:new Date(now-6*day).toISOString(),  motivo:'Contagem de inventário', observacao:'Divergência encontrada' },
    { id:5, produtoId:8, tipo:'Venda',   quantidade:2,  data:new Date(now-3*day).toISOString(),  motivo:'Venda balcão', observacao:'', valorUnitario:229.90 },
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
 * Registra uma movimentação de estoque e atualiza a quantidade do produto.
 * tipo: 'Entrada' | 'Saída' | 'Venda' | 'Ajuste'
 * Para Ajuste, quantidade pode ser positiva (+) ou negativa (-).
 * Retorna { ok:true } ou { ok:false, erro:'mensagem' }
 */
function registrarMovimentacao({ produtoId, tipo, quantidade, motivo, observacao }){
  const produtos = getProducts();
  const produto = produtos.find(p => p.id === produtoId);
  if(!produto) return { ok:false, erro:'Produto não encontrado.' };

  let delta = 0;
  if(tipo === 'Entrada') delta = Math.abs(quantidade);
  else if(tipo === 'Saída' || tipo === 'Venda') delta = -Math.abs(quantidade);
  else if(tipo === 'Ajuste') delta = quantidade; // já vem com sinal

  const novaQtd = produto.qtd + delta;
  if(novaQtd < 0){
    return { ok:false, erro:`Estoque insuficiente. Disponível: ${produto.qtd} unidade(s).` };
  }

  updateProduct(produtoId, { qtd: novaQtd });

  const movs = getMovements();
  const nextId = movs.length ? Math.max(...movs.map(m=>m.id)) + 1 : 1;
  const registro = {
    id: nextId,
    produtoId,
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
  return getProducts().filter(p => p.qtd > 0 && !vendasRecentesPorProduto.has(p.id));
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

/* =================== AUTENTICAÇÃO (client-side, sem back-end) =================== */
function isLoggedIn(){ return localStorage.getItem(AUTH_KEY) === 'true'; }
function login(email){
  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.setItem(USER_KEY, email || 'Usuário');
}
function logout(){
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}
function requireAuth(){ if(!isLoggedIn()) window.location.href = 'index.html'; }
function currentUser(){ return localStorage.getItem(USER_KEY) || 'Usuário'; }
function userInitials(name){
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || 'U') + (parts[1]?.[0] || '')).toUpperCase();
}
