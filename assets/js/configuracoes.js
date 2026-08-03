/* =========================================================
   KADU CAMISAS DE TIME — Configurações
   ========================================================= */
renderShell('config');

let novoLogoDataUrl = null;
const CORES_DISPONIVEIS = ['#e11d2e', '#0c0c0c', '#1d4ed8', '#0f766e', '#7c3aed', '#c2410c'];
let corSelecionada = getSettings().accentColor;

function renderLogoPreview(){
  const settings = getSettings();
  const src = novoLogoDataUrl || settings.logoDataUrl || 'assets/img/logo.svg';
  document.getElementById('logoPreview').innerHTML = `<img src="${src}" alt="Pré-visualização da logo">`;
}

function renderLogoUpload(){
  document.getElementById('logoUploadArea').innerHTML = `
    <div class="upload-zone" style="min-height:90px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
      <span>Clique para enviar a logo oficial da empresa (PNG ou SVG)</span>
      <input type="file" accept="image/*" id="logoInput">
    </div>`;
  document.getElementById('logoInput').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      novoLogoDataUrl = reader.result;
      renderLogoPreview();
      showToast('Logo carregada. Clique em "Salvar configurações" para aplicar.', 'success');
    };
    reader.readAsDataURL(file);
  });
}

function renderColorSwatches(){
  document.getElementById('colorSwatches').innerHTML = CORES_DISPONIVEIS.map(cor=>`
    <button type="button" class="color-swatch ${cor===corSelecionada?'active':''}" style="background:${cor}" data-cor="${cor}" aria-label="Selecionar cor ${cor}"></button>
  `).join('');
  document.querySelectorAll('.color-swatch').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      corSelecionada = btn.dataset.cor;
      renderColorSwatches();
    });
  });
}

function carregarFormulario(){
  const s = getSettings();
  document.getElementById('cfgNome').value = s.companyName;
  document.getElementById('cfgTelefone').value = s.storeInfo.telefone || '';
  document.getElementById('cfgEndereco').value = s.storeInfo.endereco || '';
  document.getElementById('cfgInstagram').value = s.storeInfo.instagram || '';
  corSelecionada = s.accentColor;
  renderLogoPreview();
  renderLogoUpload();
  renderColorSwatches();
}

function salvarConfiguracoes(){
  const nome = document.getElementById('cfgNome').value.trim() || 'Kadu Camisas de Time';
  const settings = getSettings();

  saveSettings({
    ...settings,
    companyName: nome,
    logoDataUrl: novoLogoDataUrl || settings.logoDataUrl,
    accentColor: corSelecionada,
    storeInfo: {
      telefone: document.getElementById('cfgTelefone').value.trim(),
      endereco: document.getElementById('cfgEndereco').value.trim(),
      instagram: document.getElementById('cfgInstagram').value.trim(),
    }
  });

  applyBranding();
  showToast('Configurações salvas com sucesso!', 'success');
}

function restaurarPadrao(){
  saveSettings({
    companyName: 'Kadu Camisas de Time',
    logoDataUrl: null,
    accentColor: '#e11d2e',
    storeInfo: { telefone:'', endereco:'', instagram:'' }
  });
  novoLogoDataUrl = null;
  carregarFormulario();
  applyBranding();
  showToast('Configurações restauradas para o padrão.', 'success');
}

carregarFormulario();
