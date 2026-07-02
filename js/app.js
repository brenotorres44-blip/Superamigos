// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/app.js
// ══════════════════════════════════════════════
import { db, collection, query, orderBy, onSnapshot } from './firebase.js';
import { familias, setFamilias, setUnsubFamilias, setCurrentView, setCurrentBairro,
         setSelectedFamId, setFiltroUrgencia, setFiltroTipoNec,
         currentView, currentBairro, selectedFamId, filtroUrgencia, filtroTipoNec,
         getAlertas, filtradas, urgenciaTag, toast, ini, calcIdade } from './utils.js';

export function iniciarListenerFamilias() {
  const q = query(collection(db, 'familias'), orderBy('criadoEm', 'asc'));
  const unsub = onSnapshot(q, snap => {
    setFamilias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    window.renderList();
    renderBairroNav();
    atualizarStats();
  }, err => {
    console.error('Erro Firestore:', err);
    toast('Erro ao carregar dados.');
  });
  setUnsubFamilias(unsub);
}

// ── Stats ──────────────────────────────────────
function atualizarStats() {
  const totalPessoas    = familias.reduce((a,f) => a+(f.pessoas||[]).length, 0);
  const totalPatologias = familias.reduce((a,f) => a+(f.pessoas||[]).filter(p=>p.doe).length, 0);
  const totalAlertas    = getAlertas().length;
  const s = (id, v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  s('s-familias',   familias.length);
  s('s-pessoas',    totalPessoas);
  s('s-patologias', totalPatologias);
  s('s-alertas',    totalAlertas);
  s('badge-alertas', totalAlertas);
  const nb = document.getElementById('bnav-badge-alertas');
  if(nb) { nb.textContent=totalAlertas; nb.style.display=totalAlertas>0?'flex':'none'; }
}

// ── Navegação por bairro ───────────────────────
function renderBairroNav() {
  const bairros = [...new Set(familias.map(f=>f.bairro).filter(Boolean))].sort();
  const el = document.getElementById('bairro-nav');
  if(el) el.innerHTML = bairros.map(b =>
    `<a class="nav-item" onclick="window.setBairro('${b}')">
       <i class="ti ti-map-pin"></i> ${b}
     </a>`
  ).join('');
}

// ── Views ──────────────────────────────────────
window.setView = (v, el) => {
  setCurrentView(v);
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  const titles = {
    familias: '🏠 Famílias cadastradas',
    saude:    '❤️ Saúde & Patologias',
    alertas:  '⚠️ Alertas ativos',
    relatorio:'📊 Relatório & Exportação'
  };
  const vt  = document.getElementById('view-title');
  const bnf = document.getElementById('btn-nova-familia');
  if(vt)  vt.textContent = titles[v];
  if(bnf) bnf.style.display = v === 'familias' ? '' : 'none';
  window.fecharDetalhe();
  window.renderList();
};

window.setBairro = b => {
  setCurrentBairro(b);
  window.renderList();
};

// Filtros avançados
window.aplicarFiltros = () => {
  const fu = document.getElementById('filtro-urgencia')?.value || '';
  const fn = document.getElementById('filtro-tipo-nec')?.value || '';
  setFiltroUrgencia(fu);
  setFiltroTipoNec(fn);
  window.renderList();
};

window.limparFiltros = () => {
  const fu = document.getElementById('filtro-urgencia');
  const fn = document.getElementById('filtro-tipo-nec');
  if(fu) fu.value='';
  if(fn) fn.value='';
  setFiltroUrgencia('');
  setFiltroTipoNec('');
  setCurrentBairro('');
  window.renderList();
};

// ── Render lista principal ─────────────────────
window.renderList = () => {
  atualizarStats();
  const el = document.getElementById('family-list');
  if(!el) return;

  // ─ Relatório ─
  if (currentView === 'relatorio') {
    renderRelatorio(el);
    return;
  }

  // ─ Famílias ─
  if (currentView === 'familias') {
    const list = filtradas();
    const ll = document.getElementById('list-label');
    if(ll) ll.textContent = currentBairro
      ? `Bairro: ${currentBairro} (${list.length})`
      : `Todas as famílias (${list.length})`;

    if (!list.length) {
      el.innerHTML = `<div class="empty-state">
        <i class="ti ti-users-off"></i><br>Nenhuma família encontrada.<br>
        <button class="btn btn-am" style="margin-top:12px" onclick="window.abrirModalFamilia()">
          <i class="ti ti-plus"></i> Cadastrar primeira família
        </button></div>`;
      return;
    }

    el.innerHTML = list.map(f => {
      const pessoas = f.pessoas||[];
      const alertas = pessoas.filter(p=>p.ss==='alert');
      const monit   = pessoas.filter(p=>p.ss==='monit');
      const doentes = pessoas.filter(p=>p.doe);
      return `<div class="fc ${f.id===selectedFamId?'sel':''}" onclick="window.selecionarFamilia('${f.id}')">
        <div class="fc-top">
          <div class="av">${ini(f.nome)}</div>
          <div style="flex:1;min-width:0">
            <div class="fc-name">${f.nome}</div>
            <div class="fc-meta">
              <i class="ti ti-map-pin" style="font-size:11px"></i> ${f.bairro||'—'}
              · ${pessoas.length} pessoa${pessoas.length!==1?'s':''}
              · ${f.atend||0} atend.
            </div>
          </div>
        </div>
        <div class="fc-tags">
          ${alertas.length?`<span class="tag tr">⚠ ${alertas.length} alerta${alertas.length>1?'s':''}</span>`:''}
          ${monit.length?`<span class="tag to">👁 ${monit.length} monit.</span>`:''}
          ${doentes.length&&!alertas.length&&!monit.length?`<span class="tag tb">❤️ ${doentes.length} patologia${doentes.length>1?'s':''}</span>`:''}
          ${!doentes.length?'<span class="tag tg">✓ Todos saudáveis</span>':''}
          ${urgenciaTag(f)}
          ${f.tipoNec?`<span class="tag tb">${f.tipoNec}</span>`:''}
          ${f.ben&&f.ben!=='Não recebe'?`<span class="tag ty">${f.ben}</span>`:''}
        </div>
      </div>`;
    }).join('');

  // ─ Saúde ─
  } else if (currentView === 'saude') {
    const q = (document.getElementById('searchInput')?.value||'').toLowerCase();
    const ll = document.getElementById('list-label');
    if(ll) ll.textContent = 'Patologias registradas';
    let todos = familias.flatMap(f =>
      (f.pessoas||[]).filter(p=>p.doe).map(p=>({...p, fn:f.nome, fobj:f}))
    );
    if (q) todos = todos.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.doe.toLowerCase().includes(q) ||
      p.fn.toLowerCase().includes(q)
    );
    if (!todos.length) {
      el.innerHTML = `<div class="empty-state"><i class="ti ti-heart"></i><br>Nenhuma patologia registrada.</div>`;
      return;
    }
    el.innerHTML = todos.map(p => {
      const cls   = p.ss==='alert'?'hcard-al':p.ss==='monit'?'hcard-mo':'hcard-ok';
      const badge = p.ss==='alert'?'⚠️ Atenção urgente':p.ss==='monit'?'👁 Em monitoramento':'✅ Estável';
      return `<div class="hcard ${cls}">
        <div class="hcard-top">
          <div style="flex:1">
            <div class="hcard-nome">${p.nome}</div>
            <div class="hcard-info">
              ${badge} · ${p.doe}${p.cid?' (CID: '+p.cid+')':''}
              ${p.med?'<br>💊 '+p.med:''}
              ${p.ajuda?'<br>🙏 Necessita: '+p.ajuda:''}
            </div>
            <div class="hcard-familia">👨‍👩‍👧 ${p.fn}</div>
          </div>
          <button class="btn btn-or btn-xs" onclick='window.abrirAnuncio(${JSON.stringify(p)},${JSON.stringify(p.fobj)})'>
            <i class="ti ti-speakerphone"></i> Pedir ajuda
          </button>
        </div>
      </div>`;
    }).join('');

  // ─ Alertas ─
  } else {
    const ll = document.getElementById('list-label');
    if(ll) ll.textContent = 'Precisam de atenção urgente';
    const q = (document.getElementById('searchInput')?.value||'').toLowerCase();
    let al = getAlertas();
    if (q) al = al.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      (p.doe||'').toLowerCase().includes(q) ||
      p.fn.toLowerCase().includes(q)
    );
    if (!al.length) {
      el.innerHTML = `<div class="empty-state"><i class="ti ti-circle-check"></i><br>✅ Nenhum alerta ativo!</div>`;
      return;
    }
    el.innerHTML = al.map(p => `
      <div class="alert-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div>
            <div class="alert-title">⚠️ ${p.nome}</div>
            <div style="font-size:12px;color:var(--tx2);margin-top:3px">
              ${p.doe}${p.cid?' (CID: '+p.cid+')':''}
              ${p.med?'<br>💊 '+p.med:''}
              ${p.ajuda?'<br>🙏 Necessita: '+p.ajuda:''}
            </div>
            <div style="font-size:11px;color:var(--tx3);margin-top:3px">👨‍👩‍👧 ${p.fn}</div>
            ${p.obs?`<div style="font-size:11px;color:#B71C1C;margin-top:3px">📋 ${p.obs}</div>`:''}
          </div>
          <button class="btn btn-or btn-xs" style="flex-shrink:0"
            onclick="window.abrirAnuncioById('${p.fid}','${p.id||''}')">
            <i class="ti ti-speakerphone"></i> Pedir ajuda
          </button>
        </div>
      </div>`).join('');
  }
};

// ── Relatório ──────────────────────────────────
function renderRelatorio(el) {
  const ll = document.getElementById('list-label');
  if(ll) ll.textContent = 'Visão geral dos dados';

  const totalF  = familias.length;
  const totalP  = familias.reduce((a,f)=>a+(f.pessoas||[]).length,0);
  const totalPat= familias.reduce((a,f)=>a+(f.pessoas||[]).filter(p=>p.doe).length,0);
  const totalAl = getAlertas().length;

  // Contagem por urgência
  const urg = {alta:0, media:0, baixa:0, sem:0};
  familias.forEach(f => {
    if (f.urgencia==='alta') urg.alta++;
    else if (f.urgencia==='media') urg.media++;
    else if (f.urgencia==='baixa') urg.baixa++;
    else urg.sem++;
  });

  // Contagem por bairro
  const bairroMap = {};
  familias.forEach(f => {
    const b = f.bairro||'Não informado';
    bairroMap[b] = (bairroMap[b]||0)+1;
  });
  const bairros = Object.entries(bairroMap).sort((a,b)=>b[1]-a[1]);

  // Contagem por tipo de necessidade
  const necMap = {};
  familias.forEach(f => {
    if (f.tipoNec) necMap[f.tipoNec] = (necMap[f.tipoNec]||0)+1;
  });
  const necessidades = Object.entries(necMap).sort((a,b)=>b[1]-a[1]);

  // Patologias mais comuns
  const doeMap = {};
  familias.forEach(f => (f.pessoas||[]).forEach(p => {
    if (p.doe) {
      const d = p.doe.toLowerCase().trim();
      doeMap[d] = (doeMap[d]||0)+1;
    }
  }));
  const doencas = Object.entries(doeMap).sort((a,b)=>b[1]-a[1]).slice(0,10);

  el.innerHTML = `
    <div class="rel-wrap">
      <div class="rel-header">
        <h3>📊 Relatório SuperAmigos</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-verde" onclick="window.exportarPDF()">
            <i class="ti ti-file-type-pdf"></i> Gerar PDF
          </button>
          <button class="btn btn-am" onclick="window.exportarCSV()">
            <i class="ti ti-file-spreadsheet"></i> Exportar CSV
          </button>
        </div>
      </div>

      <div class="rel-stats">
        <div class="rel-stat"><span class="rel-val">${totalF}</span><span class="rel-lbl">Famílias</span></div>
        <div class="rel-stat"><span class="rel-val">${totalP}</span><span class="rel-lbl">Pessoas</span></div>
        <div class="rel-stat"><span class="rel-val">${totalPat}</span><span class="rel-lbl">Patologias</span></div>
        <div class="rel-stat rel-stat-al"><span class="rel-val">${totalAl}</span><span class="rel-lbl">Alertas</span></div>
      </div>

      <div class="rel-section">🔴 Urgência das famílias</div>
      <div class="rel-bars">
        ${barraRel('🔴 Alta', urg.alta, totalF, '#C62828')}
        ${barraRel('🟠 Média', urg.media, totalF, '#E65100')}
        ${barraRel('🟡 Baixa', urg.baixa, totalF, '#F5C800')}
        ${barraRel('⚪ Sem urgência', urg.sem, totalF, '#aaa')}
      </div>

      <div class="rel-section">📍 Famílias por bairro</div>
      <div class="rel-bars">
        ${bairros.map(([b,n])=>barraRel(b,n,totalF,'#1565C0')).join('')}
      </div>

      ${necessidades.length ? `
      <div class="rel-section">🙏 Necessidades mais frequentes</div>
      <div class="rel-bars">
        ${necessidades.map(([n,v])=>barraRel(n,v,totalF,'#6A1B9A')).join('')}
      </div>` : ''}

      ${doencas.length ? `
      <div class="rel-section">❤️ Patologias mais comuns</div>
      <div class="rel-bars">
        ${doencas.map(([d,v])=>barraRel(d,v,totalPat||1,'#B71C1C')).join('')}
      </div>` : ''}

      <div class="rel-section">📋 Lista completa de famílias</div>
      <div class="rel-table-wrap">
        <table class="rel-table">
          <thead><tr>
            <th>Família</th><th>Bairro</th><th>Membros</th><th>Urgência</th><th>Atend.</th><th>Necessidade</th>
          </tr></thead>
          <tbody>
            ${familias.map(f=>`<tr>
              <td><strong>${f.nome}</strong><br><small>${f.responsavel||''}</small></td>
              <td>${f.bairro||'—'}</td>
              <td>${(f.pessoas||[]).length}</td>
              <td>${f.urgencia==='alta'?'🔴 Alta':f.urgencia==='media'?'🟠 Média':f.urgencia==='baixa'?'🟡 Baixa':'—'}</td>
              <td>${f.atend||0}</td>
              <td style="font-size:11px">${f.tipoNec||'—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function barraRel(label, val, total, cor) {
  const pct = total > 0 ? Math.round((val/total)*100) : 0;
  return `<div class="rel-bar-row">
    <div class="rel-bar-label">${label}</div>
    <div class="rel-bar-track">
      <div class="rel-bar-fill" style="width:${pct}%;background:${cor}"></div>
    </div>
    <div class="rel-bar-val">${val}</div>
  </div>`;
}

// ── Exportar CSV ────────────────────────────────
window.exportarCSV = () => {
  const linhas = [
    ['Família','Responsável','Bairro','Cidade','Tel','WhatsApp','Membros','Renda','Benefício','Urgência','Tipo Necessidade','Necessidade','Atendimentos','Último Atend.'],
    ...familias.map(f => [
      f.nome, f.responsavel, f.bairro, f.cidade, f.tel, f.wpp,
      (f.pessoas||[]).length, f.renda, f.ben, f.urgencia,
      f.tipoNec, f.nec, f.atend||0, f.ultimoAtend||''
    ])
  ];
  // Ponto-e-vírgula: separador padrão do Excel em português (BR)
  const csv = linhas.map(l => l.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(';')).join('\r\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'superamigos_familias.csv';
  a.click(); URL.revokeObjectURL(url);
  toast('✅ CSV exportado!');
};

// ── Exportar PDF ────────────────────────────────
window.exportarPDF = () => {
  if (!window.jspdf) { toast('⚠️ Recarregue a página e tente novamente'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W = doc.internal.pageSize.getWidth();
  const azul   = [21, 101, 192];
  const cinza  = [100, 100, 100];
  const hoje   = new Date();
  const dataStr = hoje.toLocaleDateString('pt-BR') + ' às ' + hoje.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});

  // ── Cabeçalho ──
  doc.setFillColor(...azul);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(20);
  doc.text('SuperAmigos', 14, 14);
  doc.setFontSize(11);
  doc.setFont('helvetica','normal');
  doc.text('Relatório Geral de Famílias', 14, 22);
  doc.setFontSize(9);
  doc.text('Gerado em ' + dataStr, W - 14, 22, { align:'right' });

  // ── Estatísticas gerais ──
  const totalF   = familias.length;
  const totalP   = familias.reduce((a,f)=>a+(f.pessoas||[]).length,0);
  const totalPat = familias.reduce((a,f)=>a+(f.pessoas||[]).filter(p=>p.doe).length,0);
  const totalAl  = getAlertas().length;
  const totalAt  = familias.reduce((a,f)=>a+(f.atend||0),0);

  let y = 40;
  doc.setTextColor(...azul);
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.text('Resumo Geral', 14, y);
  y += 4;

  const cards = [
    ['Famílias', totalF], ['Pessoas', totalP], ['Patologias', totalPat],
    ['Alertas', totalAl], ['Atendimentos', totalAt]
  ];
  const cw = (W - 28 - 4*4) / 5;
  cards.forEach(([lbl,val],i)=>{
    const x = 14 + i*(cw+4);
    doc.setFillColor(240, 245, 252);
    doc.setDrawColor(...azul);
    doc.roundedRect(x, y, cw, 18, 2, 2, 'FD');
    doc.setTextColor(...azul);
    doc.setFontSize(15);
    doc.setFont('helvetica','bold');
    doc.text(String(val), x + cw/2, y + 8, { align:'center' });
    doc.setTextColor(...cinza);
    doc.setFontSize(8);
    doc.setFont('helvetica','normal');
    doc.text(lbl, x + cw/2, y + 14, { align:'center' });
  });
  y += 28;

  // ── Urgência ──
  const urg = {alta:0, media:0, baixa:0, sem:0};
  familias.forEach(f=>{
    if (f.urgencia==='alta') urg.alta++;
    else if (f.urgencia==='media') urg.media++;
    else if (f.urgencia==='baixa') urg.baixa++;
    else urg.sem++;
  });

  doc.setTextColor(...azul);
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.text('Urgência das Famílias', 14, y);

  doc.autoTable({
    startY: y + 3,
    head: [['Nível','Famílias','% do total']],
    body: [
      ['Alta',   urg.alta,  pctStr(urg.alta, totalF)],
      ['Média',  urg.media, pctStr(urg.media, totalF)],
      ['Baixa',  urg.baixa, pctStr(urg.baixa, totalF)],
      ['Sem urgência', urg.sem, pctStr(urg.sem, totalF)],
    ],
    theme:'grid',
    headStyles:{ fillColor: azul, fontSize: 9 },
    bodyStyles:{ fontSize: 9 },
    columnStyles:{ 1:{halign:'center'}, 2:{halign:'center'} },
    margin:{ left:14, right:14 },
    didParseCell: d => {
      if (d.section==='body' && d.column.index===0) {
        const cores = { 'Alta':[198,40,40], 'Média':[230,81,0], 'Baixa':[180,150,0] };
        const c = cores[d.cell.raw];
        if (c) { d.cell.styles.textColor = c; d.cell.styles.fontStyle = 'bold'; }
      }
    }
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Famílias por bairro ──
  const bairroMap = {};
  familias.forEach(f=>{ const b=f.bairro||'Não informado'; bairroMap[b]=(bairroMap[b]||0)+1; });
  const bairros = Object.entries(bairroMap).sort((a,b)=>b[1]-a[1]);

  if (bairros.length) {
    doc.setTextColor(...azul);
    doc.setFont('helvetica','bold');
    doc.setFontSize(13);
    doc.text('Famílias por Bairro', 14, y);
    doc.autoTable({
      startY: y + 3,
      head: [['Bairro','Famílias','% do total']],
      body: bairros.map(([b,n])=>[b, n, pctStr(n, totalF)]),
      theme:'grid',
      headStyles:{ fillColor: azul, fontSize: 9 },
      bodyStyles:{ fontSize: 9 },
      columnStyles:{ 1:{halign:'center'}, 2:{halign:'center'} },
      margin:{ left:14, right:14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Necessidades ──
  const necMap = {};
  familias.forEach(f=>{ if (f.tipoNec) necMap[f.tipoNec]=(necMap[f.tipoNec]||0)+1; });
  const necessidades = Object.entries(necMap).sort((a,b)=>b[1]-a[1]);

  if (necessidades.length) {
    doc.setTextColor(...azul);
    doc.setFont('helvetica','bold');
    doc.setFontSize(13);
    doc.text('Necessidades Mais Frequentes', 14, y);
    doc.autoTable({
      startY: y + 3,
      head: [['Tipo de necessidade','Famílias']],
      body: necessidades.map(([n,v])=>[n, v]),
      theme:'grid',
      headStyles:{ fillColor:[106,27,154], fontSize: 9 },
      bodyStyles:{ fontSize: 9 },
      columnStyles:{ 1:{halign:'center'} },
      margin:{ left:14, right:14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Patologias ──
  const doeMap = {};
  familias.forEach(f=>(f.pessoas||[]).forEach(p=>{
    if (p.doe) { const d=p.doe.toLowerCase().trim(); doeMap[d]=(doeMap[d]||0)+1; }
  }));
  const doencas = Object.entries(doeMap).sort((a,b)=>b[1]-a[1]).slice(0,10);

  if (doencas.length) {
    doc.setTextColor(...azul);
    doc.setFont('helvetica','bold');
    doc.setFontSize(13);
    doc.text('Patologias Mais Comuns', 14, y);
    doc.autoTable({
      startY: y + 3,
      head: [['Patologia','Pessoas']],
      body: doencas.map(([d,v])=>[d.charAt(0).toUpperCase()+d.slice(1), v]),
      theme:'grid',
      headStyles:{ fillColor:[183,28,28], fontSize: 9 },
      bodyStyles:{ fontSize: 9 },
      columnStyles:{ 1:{halign:'center'} },
      margin:{ left:14, right:14 },
    });
  }

  // ── Lista completa (nova página) ──
  doc.addPage();
  doc.setFillColor(...azul);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.text('Lista Completa de Famílias', 14, 12);

  const urgTxt = u => u==='alta'?'Alta':u==='media'?'Média':u==='baixa'?'Baixa':'—';
  doc.autoTable({
    startY: 24,
    head: [['Família','Responsável','Bairro','Telefone','Membros','Urgência','Atend.','Necessidade']],
    body: familias.map(f=>[
      f.nome||'—', f.responsavel||'—', f.bairro||'—', f.tel||f.wpp||'—',
      (f.pessoas||[]).length, urgTxt(f.urgencia), f.atend||0, f.tipoNec||'—'
    ]),
    theme:'striped',
    headStyles:{ fillColor: azul, fontSize: 8 },
    bodyStyles:{ fontSize: 8 },
    columnStyles:{ 4:{halign:'center'}, 6:{halign:'center'} },
    margin:{ left:10, right:10 },
    didParseCell: d => {
      if (d.section==='body' && d.column.index===5) {
        const cores = { 'Alta':[198,40,40], 'Média':[230,81,0], 'Baixa':[180,150,0] };
        const c = cores[d.cell.raw];
        if (c) { d.cell.styles.textColor = c; d.cell.styles.fontStyle = 'bold'; }
      }
    }
  });

  // ── Rodapé em todas as páginas ──
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220,220,220);
    doc.line(14, H-12, W-14, H-12);
    doc.setTextColor(...cinza);
    doc.setFontSize(8);
    doc.setFont('helvetica','normal');
    doc.text('SuperAmigos — Sistema de Gestão de Famílias', 14, H-7);
    doc.text(`Página ${i} de ${pages}`, W-14, H-7, { align:'right' });
  }

  const nomeArq = `relatorio_superamigos_${hoje.toISOString().slice(0,10)}.pdf`;
  doc.save(nomeArq);
  toast('✅ PDF gerado!');
};

function pctStr(v, total) {
  return total > 0 ? Math.round((v/total)*100) + '%' : '0%';
}

// ── Detalhe família ────────────────────────────
window.selecionarFamilia = id => {
  setSelectedFamId(id);
  const f = familias.find(x => x.id === id);
  if (!f) return;
  const panel = document.getElementById('detail-panel');
  const backBtn = panel?.querySelector('.det-back-btn');
  const isMobile = window.innerWidth <= 640;
  if(panel) {
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    if(isMobile) {
      requestAnimationFrame(() => panel.classList.add('open'));
      if(backBtn) backBtn.style.display = '';
      document.body.style.overflow = 'hidden';
    }
  }
  import('./familias.js').then(m => m.renderDetalhe(f));
  window.renderList();
};

window.fecharDetalhe = () => {
  setSelectedFamId(null);
  const panel = document.getElementById('detail-panel');
  const isMobile = window.innerWidth <= 640;
  if(panel) {
    if(isMobile) {
      panel.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => panel.style.display = 'none', 300);
    } else {
      panel.style.display = 'none';
    }
  }
};

window.setViewMobile = (v, el) => {
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  setCurrentView(v);
  const titles = {
    familias:'🏠 Famílias cadastradas', saude:'❤️ Saúde & Patologias',
    alertas:'⚠️ Alertas ativos', relatorio:'📊 Relatório'
  };
  const vt = document.getElementById('view-title');
  if(vt) vt.textContent = titles[v];
  const bnf = document.getElementById('btn-nova-familia');
  if(bnf) bnf.style.display = v==='familias' ? '' : 'none';
  window.fecharDetalhe();
  window.renderList();
};

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop'))
    e.target.style.display = 'none';
});
