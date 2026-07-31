/* =========================================================
   KADU CAMISAS DE TIME — Relatórios (PDF / Excel / CSV)
   ========================================================= */
renderShell('relatorios');

const REPORT_TITLES = {
  estoque:  'Relatório de Estoque',
  produtos: 'Relatório de Produtos',
  lucro:    'Relatório de Lucro',
  vendas:   'Relatório de Vendas',
};

function getReportData(type){
  const produtos = getProducts();

  if(type === 'estoque'){
    const headers = ['Time','Categoria','Tamanho','Código','Quantidade','Status'];
    const rows = getEstoqueLinhas().map(l=>[
      l.produto.team, l.produto.categoria, l.tamanho, l.produto.sku, l.qtd,
      l.qtd===0 ? 'Esgotado' : (l.qtd<=LOW_STOCK ? 'Estoque baixo' : 'Em estoque')
    ]);
    return { headers, rows };
  }

  if(type === 'produtos'){
    const headers = ['Nome','Time','Liga','Temporada','Marca','Modelo','Categoria','Tamanhos disponíveis','Estoque total','Código','Custo (R$)','Venda (R$)'];
    const rows = produtos.map(p=>[
      p.nome||'', p.team, p.liga||'', p.temporada||'', p.marca||'', p.modelo||'',
      p.categoria, tamanhosResumoTexto(p), totalQtd(p), p.sku, p.custo.toFixed(2), p.preco.toFixed(2)
    ]);
    return { headers, rows };
  }

  if(type === 'lucro'){
    const headers = ['Time','Custo unit. (R$)','Venda unit. (R$)','Lucro unit. (R$)','Estoque total','Lucro potencial (R$)'];
    const rows = produtos.map(p=>{
      const lucroUnit = p.preco - p.custo;
      const qtd = totalQtd(p);
      return [p.team, p.custo.toFixed(2), p.preco.toFixed(2), lucroUnit.toFixed(2), qtd, (lucroUnit*qtd).toFixed(2)];
    });
    return { headers, rows };
  }

  if(type === 'vendas'){
    const headers = ['Data','Time','Tamanho','Quantidade','Valor unitário (R$)','Total (R$)'];
    const vendas = getMovements().filter(m=>m.tipo==='Venda').sort((a,b)=>new Date(b.data)-new Date(a.data));
    const rows = vendas.map(m=>{
      const produto = produtos.find(p=>p.id===m.produtoId);
      const unit = m.valorUnitario || 0;
      return [
        formatDataBR(m.data),
        produto ? produto.team : '(produto removido)',
        m.tamanho || '-',
        m.quantidade,
        unit.toFixed(2),
        (unit*m.quantidade).toFixed(2)
      ];
    });
    return { headers, rows };
  }

  return { headers:[], rows:[] };
}

function tamanhosResumoTexto(p){
  return SIZES.filter(t => (p.tamanhos && p.tamanhos[t]) > 0)
    .map(t => `${t}:${p.tamanhos[t]}`)
    .join(', ') || '-';
}

function baixarRelatorio(type, formato){
  const { headers, rows } = getReportData(type);
  const nomeArquivo = `kadu-${type}-${new Date().toISOString().slice(0,10)}`;

  if(rows.length === 0){
    showToast('Não há dados suficientes para gerar esse relatório ainda.', 'error');
    return;
  }

  if(formato === 'csv') exportCSV(headers, rows, nomeArquivo);
  else if(formato === 'xlsx') exportXLSX(headers, rows, nomeArquivo, REPORT_TITLES[type]);
  else if(formato === 'pdf') exportPDF(headers, rows, nomeArquivo, REPORT_TITLES[type]);

  showToast(`${REPORT_TITLES[type]} gerado em ${formato.toUpperCase()}!`, 'success');
}

function exportCSV(headers, rows, filename){
  const linhas = [headers, ...rows].map(linha =>
    linha.map(v => {
      const s = String(v ?? '');
      return /[;"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(';')
  );
  const csv = '\uFEFF' + linhas.join('\n'); // BOM para acentuação correta no Excel
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  baixarBlob(blob, filename + '.csv');
}

function exportXLSX(headers, rows, filename, titulo){
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, titulo.slice(0,31));
  XLSX.writeFile(wb, filename + '.xlsx');
}

function exportPDF(headers, rows, filename, titulo){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });
  const settings = getSettings();

  doc.setFontSize(16);
  doc.text(settings.companyName, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(titulo, 14, 25);
  doc.text('Gerado em ' + new Date().toLocaleDateString('pt-BR'), 14, 31);

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 38,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [12,12,12], textColor: 255 },
    alternateRowStyles: { fillColor: [243,241,238] },
  });

  doc.save(filename + '.pdf');
}

function baixarBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
