// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/sacolinhas.js
//  Área de Sacolinhas (cadastro de crianças + etiquetas)
// ══════════════════════════════════════════════
import { db, collection, doc, addDoc, updateDoc, deleteDoc,
         onSnapshot, query, orderBy, serverTimestamp } from './firebase.js';
import { familias, toast, confirmar } from './utils.js';

export let sacolinhas = [];
let unsubSac = null;
let filtroStatusSac = '';
let buscaSac = '';

export function iniciarListenerSacolinhas() {
  if (unsubSac) return;
  const q = query(collection(db, 'sacolinhas'), orderBy('criadoEm', 'asc'));
  unsubSac = onSnapshot(q, snap => {
    sacolinhas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (window.currentViewIsSacolinhas?.()) window.renderList();
    atualizarBadgeSac();
  }, err => {
    console.error('Erro Firestore (sacolinhas):', err);
  });
}

function atualizarBadgeSac() {
  const pend = sacolinhas.filter(s => s.status !== 'entregue').length;
  const b = document.getElementById('badge-sacolinhas');
  if (b) { b.textContent = pend; b.style.display = pend > 0 ? '' : 'none'; }
}

// ── Render da view ─────────────────────────────
window.renderSacolinhas = (el) => {
  const ll = document.getElementById('list-label');

  let list = sacolinhas;
  if (filtroStatusSac) list = list.filter(s => (s.status||'aguardando') === filtroStatusSac);
  if (buscaSac) {
    const t = buscaSac.toLowerCase();
    list = list.filter(s =>
      (s.nome||'').toLowerCase().includes(t) ||
      (s.familia||'').toLowerCase().includes(t) ||
      (s.sugestao||'').toLowerCase().includes(t));
  }

  const total    = sacolinhas.length;
  const entregues= sacolinhas.filter(s=>s.status==='entregue').length;
  const aguard   = total - entregues;

  if (ll) ll.textContent = `${list.length} sacolinha${list.length!==1?'s':''}`;

  el.innerHTML = `
    <div class="sac-wrap">
      <div class="sac-header">
        <div class="sac-stats">
          <div class="sac-stat"><span class="sac-val">${total}</span><span class="sac-lbl">Total</span></div>
          <div class="sac-stat sac-stat-ag"><span class="sac-val">${aguard}</span><span class="sac-lbl">Aguardando</span></div>
          <div class="sac-stat sac-stat-ok"><span class="sac-val">${entregues}</span><span class="sac-lbl">Entregues</span></div>
        </div>
        <div class="sac-actions">
          <button class="btn btn-am" onclick="window.abrirModalSacolinha()">
            <i class="ti ti-plus"></i> Nova sacolinha
          </button>
          ${total ? `<button class="btn btn-verde" onclick="window.etiquetasTodasPDF()">
            <i class="ti ti-file-type-pdf"></i> Imprimir etiquetas
          </button>` : ''}
        </div>
      </div>

      <div class="sac-filtros">
        <input class="fi" style="flex:1;min-width:140px" placeholder="🔍 Buscar por nome, família ou presente…"
               value="${buscaSac.replace(/"/g,'&quot;')}"
               oninput="window.buscarSacolinha(this.value)">
        <select class="fi" style="max-width:170px" onchange="window.filtrarSacolinha(this.value)">
          <option value=""            ${filtroStatusSac===''           ?'selected':''}>Todas</option>
          <option value="aguardando"  ${filtroStatusSac==='aguardando' ?'selected':''}>🎁 Aguardando</option>
          <option value="entregue"    ${filtroStatusSac==='entregue'   ?'selected':''}>✅ Entregues</option>
        </select>
      </div>

      ${!list.length ? `
        <div class="empty-state">
          <i class="ti ti-gift-off"></i><br>Nenhuma sacolinha ${total ? 'encontrada com esses filtros' : 'cadastrada'}.<br>
          <button class="btn btn-am" style="margin-top:12px" onclick="window.abrirModalSacolinha()">
            <i class="ti ti-plus"></i> Cadastrar primeira sacolinha
          </button>
        </div>` : `
        <div class="sac-grid">
          ${list.map(s => cardSacolinha(s)).join('')}
        </div>`}
    </div>`;
};

function cardSacolinha(s) {
  const entregue = s.status === 'entregue';
  const sexoIcon = s.sexo === 'Menina' ? '👧' : s.sexo === 'Menino' ? '👦' : '🧒';
  return `
  <div class="sac-card ${entregue?'sac-entregue':''}">
    <div class="sac-num">Nº ${s.numero || '—'}</div>
    <div class="sac-card-top">
      <div class="sac-avatar">${sexoIcon}</div>
      <div style="flex:1;min-width:0">
        <div class="sac-nome">${s.nome||'—'}</div>
        <div class="sac-meta">${s.idade!=null&&s.idade!==''?s.idade+' anos':'Idade —'} · ${s.sexo||'—'}</div>
        ${s.familia ? `<div class="sac-meta"><i class="ti ti-home" style="font-size:11px"></i> ${s.familia}</div>` : ''}
      </div>
      <span class="tag ${entregue?'tag-ok':'tag-ag'}">${entregue?'✅ Entregue':'🎁 Aguardando'}</span>
    </div>
    <div class="sac-info">
      <div><i class="ti ti-shirt"></i> Roupa: <strong>${s.roupa||'—'}</strong></div>
      <div><i class="ti ti-shoe"></i> Calçado: <strong>${s.calcado||'—'}</strong></div>
    </div>
    ${s.sugestao ? `<div class="sac-presente"><i class="ti ti-gift"></i> ${s.sugestao}</div>` : ''}
    ${s.obs ? `<div class="sac-obs">${s.obs}</div>` : ''}
    <div class="sac-btns">
      <button class="btn btn-sm" onclick="window.etiquetaSacolinhaPDF('${s.id}')" title="Gerar etiqueta">
        <i class="ti ti-tag"></i> Etiqueta
      </button>
      ${!entregue ? `
      <button class="btn btn-gn btn-sm" onclick="window.marcarEntregueSacolinha('${s.id}')">
        <i class="ti ti-check"></i> Entregar
      </button>` : `
      <button class="btn btn-sm" onclick="window.desfazerEntregaSacolinha('${s.id}')">
        <i class="ti ti-arrow-back-up"></i> Desfazer
      </button>`}
      <button class="btn btn-sm" onclick="window.abrirModalSacolinha('${s.id}')">
        <i class="ti ti-edit"></i>
      </button>
      <button class="btn btn-red btn-sm" onclick="window.excluirSacolinha('${s.id}')">
        <i class="ti ti-trash"></i>
      </button>
    </div>
  </div>`;
}

window.buscarSacolinha  = v => { buscaSac = v; refresh(); };
window.filtrarSacolinha = v => { filtroStatusSac = v; refresh(); };
function refresh() {
  const el = document.getElementById('family-list');
  if (el) window.renderSacolinhas(el);
}

// ── Modal cadastro/edição ──────────────────────
window.abrirModalSacolinha = (id=null) => {
  const s = id ? sacolinhas.find(x => x.id === id) : null;
  const g = i => document.getElementById(i);

  g('sac-id').value      = s?.id || '';
  g('sac-nome').value    = s?.nome || '';
  g('sac-idade').value   = s?.idade ?? '';
  g('sac-sexo').value    = s?.sexo || '';
  g('sac-roupa').value   = s?.roupa || '';
  g('sac-calcado').value = s?.calcado || '';
  g('sac-sugestao').value= s?.sugestao || '';
  g('sac-obs').value     = s?.obs || '';

  // Select de famílias
  const sel = g('sac-familia');
  sel.innerHTML = `<option value="">Sem vínculo</option>` +
    familias.map(f => `<option value="${f.nome.replace(/"/g,'&quot;')}" ${s?.familia===f.nome?'selected':''}>${f.nome}</option>`).join('');

  document.getElementById('modal-sacolinha-titulo').textContent =
    s ? 'Editar sacolinha' : 'Cadastrar nova sacolinha';
  document.getElementById('modal-sacolinha').style.display = 'flex';
  setTimeout(() => g('sac-nome').focus(), 100);
};

window.salvarSacolinha = async () => {
  const g = i => document.getElementById(i).value.trim();
  const id   = document.getElementById('sac-id').value;
  const nome = g('sac-nome');
  if (!nome) { toast('⚠️ Informe o nome da criança'); return; }

  const dados = {
    nome,
    idade:    g('sac-idade'),
    sexo:     g('sac-sexo'),
    roupa:    g('sac-roupa'),
    calcado:  g('sac-calcado'),
    sugestao: g('sac-sugestao'),
    familia:  g('sac-familia'),
    obs:      g('sac-obs'),
  };

  try {
    if (id) {
      await updateDoc(doc(db,'sacolinhas',id), dados);
      toast('✅ Sacolinha atualizada!');
    } else {
      const maxNum = sacolinhas.reduce((m,s)=>Math.max(m, s.numero||0), 0);
      await addDoc(collection(db,'sacolinhas'), {
        ...dados,
        numero: maxNum + 1,
        status: 'aguardando',
        criadoEm: serverTimestamp()
      });
      toast('🎁 Sacolinha cadastrada!');
    }
    window.fecharModal('modal-sacolinha');
  } catch(e) {
    console.error(e);
    toast('❌ Erro ao salvar. Tente novamente.');
  }
};

window.marcarEntregueSacolinha = async id => {
  try {
    await updateDoc(doc(db,'sacolinhas',id), {
      status:'entregue',
      entregueEm: serverTimestamp()
    });
    toast('✅ Sacolinha marcada como entregue!');
  } catch(e){ toast('❌ Erro ao atualizar.'); }
};

window.desfazerEntregaSacolinha = async id => {
  try {
    await updateDoc(doc(db,'sacolinhas',id), { status:'aguardando' });
    toast('↩️ Entrega desfeita.');
  } catch(e){ toast('❌ Erro ao atualizar.'); }
};

window.excluirSacolinha = async id => {
  const s = sacolinhas.find(x=>x.id===id);
  const ok = await confirmar(`Excluir a sacolinha de "${s?.nome||''}"? Esta ação não pode ser desfeita.`);
  if (!ok) return;
  try {
    await deleteDoc(doc(db,'sacolinhas',id));
    toast('🗑️ Sacolinha excluída.');
  } catch(e){ toast('❌ Erro ao excluir.'); }
};

// ── Etiqueta PDF (modelo da sacolinha) ─────────
function desenharEtiqueta(pdfDoc, s, x, y, w, h) {
  const verde    = [27, 94, 32];
  const vermelho = [198, 40, 40];
  const escuro   = [40, 40, 40];

  // Borda dupla decorativa
  pdfDoc.setDrawColor(...vermelho);
  pdfDoc.setLineWidth(1.2);
  pdfDoc.roundedRect(x, y, w, h, 3, 3);
  pdfDoc.setDrawColor(...verde);
  pdfDoc.setLineWidth(0.4);
  pdfDoc.roundedRect(x+2, y+2, w-4, h-4, 2, 2);

  // Cabeçalho
  pdfDoc.setFillColor(...vermelho);
  pdfDoc.roundedRect(x+2, y+2, w-4, 12, 2, 2, 'F');
  pdfDoc.setTextColor(255,255,255);
  pdfDoc.setFont('helvetica','bold');
  pdfDoc.setFontSize(12);
  pdfDoc.text('SACOLINHA SUPERAMIGOS', x + w/2, y + 9, { align:'center' });

  // Número
  pdfDoc.setFillColor(...verde);
  pdfDoc.circle(x + w - 10, y + 8, 6, 'F');
  pdfDoc.setFontSize(10);
  pdfDoc.text(String(s.numero||'—'), x + w - 10, y + 9.5, { align:'center' });

  // Campos
  const campos = [
    ['Nome',      s.nome || ''],
    ['Idade',     s.idade !== '' && s.idade != null ? s.idade + ' anos' : ''],
    ['Sexo',      s.sexo || ''],
    ['Roupa',     s.roupa || ''],
    ['Calçado',   s.calcado || ''],
    ['Sugestão de presente', s.sugestao || ''],
  ];

  let cy = y + 21;
  const lh = (h - 26) / campos.length;
  campos.forEach(([lbl, val]) => {
    pdfDoc.setFont('helvetica','bold');
    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor(...verde);
    pdfDoc.text(lbl + ':', x + 7, cy);

    const lblW = pdfDoc.getTextWidth(lbl + ': ');
    pdfDoc.setFont('helvetica','normal');
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor(...escuro);
    const maxW = w - 14 - lblW;
    const txt  = pdfDoc.splitTextToSize(String(val), maxW);
    pdfDoc.text(txt[0] || '', x + 7 + lblW, cy);

    // Linha pontilhada
    pdfDoc.setDrawColor(180,180,180);
    pdfDoc.setLineWidth(0.2);
    pdfDoc.setLineDashPattern([1,1], 0);
    pdfDoc.line(x + 7 + lblW + pdfDoc.getTextWidth(txt[0]||'') + 2, cy + 0.5, x + w - 7, cy + 0.5);
    pdfDoc.setLineDashPattern([], 0);

    cy += lh;
  });
}

window.etiquetaSacolinhaPDF = id => {
  const s = sacolinhas.find(x=>x.id===id);
  if (!s) return;
  if (!window.jspdf) { toast('⚠️ Recarregue a página e tente novamente'); return; }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:[100,150] });
  desenharEtiqueta(pdf, s, 5, 5, 140, 90);
  pdf.save(`etiqueta_sacolinha_${s.numero||''}_${(s.nome||'').replace(/\s+/g,'_')}.pdf`);
  toast('🏷️ Etiqueta gerada!');
};

window.etiquetasTodasPDF = () => {
  if (!window.jspdf) { toast('⚠️ Recarregue a página e tente novamente'); return; }
  const list = sacolinhas.filter(s => s.status !== 'entregue');
  const alvo = list.length ? list : sacolinhas;
  if (!alvo.length) { toast('Nenhuma sacolinha para imprimir.'); return; }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W = 210, H = 297;
  const ew = 190, eh = 66, mx = 10, my = 10, gap = 6;
  const porPagina = 4;

  alvo.forEach((s, i) => {
    const pos = i % porPagina;
    if (i > 0 && pos === 0) pdf.addPage();
    const y = my + pos * (eh + gap);
    desenharEtiqueta(pdf, s, mx, y, ew, eh);
  });

  pdf.save(`etiquetas_sacolinhas_${new Date().toISOString().slice(0,10)}.pdf`);
  toast(`🏷️ ${alvo.length} etiqueta${alvo.length!==1?'s':''} gerada${alvo.length!==1?'s':''}!`);
};
