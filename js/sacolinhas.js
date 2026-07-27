// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/sacolinhas.js
//  Ação Especial de Natal — Sacolinhas
// ══════════════════════════════════════════════
import { db, collection, doc, addDoc, updateDoc, deleteDoc,
         onSnapshot, query, orderBy, serverTimestamp } from './firebase.js';
import { toast, confirmar } from './utils.js';

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

  let list = [...sacolinhas].sort((a,b)=>(a.numero||0)-(b.numero||0));
  if (filtroStatusSac) list = list.filter(s => (s.status||'aguardando') === filtroStatusSac);
  if (buscaSac) {
    const t = buscaSac.toLowerCase();
    list = list.filter(s =>
      (s.nome||'').toLowerCase().includes(t) ||
      (s.comunidade||'').toLowerCase().includes(t) ||
      String(s.numero||'').includes(t));
  }

  const total     = sacolinhas.length;
  const entregues = sacolinhas.filter(s=>s.status==='entregue').length;
  const aguard    = total - entregues;

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
          <button class="btn" onclick="window.importarSacolinhas()" title="Importar lista oficial">
            <i class="ti ti-database-import"></i> Importar lista
          </button>
          ${total ? `<button class="btn btn-verde" onclick="window.etiquetasTodasPDF()">
            <i class="ti ti-file-type-pdf"></i> Imprimir fichas
          </button>` : ''}
        </div>
      </div>

      <div class="sac-filtros">
        <input class="fi" style="flex:1;min-width:140px" placeholder="🔍 Buscar por nome, comunidade ou nº…"
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
  const sexoIcon = s.sexo === 'FEMININO' ? '👧' : s.sexo === 'MASCULINO' ? '👦' : '🧒';
  return `
  <div class="sac-card ${entregue?'sac-entregue':''}">
    <div class="sac-num">CADASTRO ${s.numero || '—'}</div>
    <div class="sac-card-top">
      <div class="sac-avatar">${sexoIcon}</div>
      <div style="flex:1;min-width:0">
        <div class="sac-nome">${s.nome||'—'}</div>
        <div class="sac-meta">${s.sexo||'—'} · ${s.idade!=null&&s.idade!==''?s.idade+' anos':'idade —'}</div>
        ${s.comunidade ? `<div class="sac-meta"><i class="ti ti-map-pin" style="font-size:11px"></i> ${s.comunidade}</div>` : ''}
      </div>
      <span class="tag ${entregue?'tag-ok':'tag-ag'}">${entregue?'✅ Entregue':'🎁 Aguardando'}</span>
    </div>
    <div class="sac-info">
      <div><i class="ti ti-shirt"></i> Roupa: <strong>${s.roupa||'—'}</strong></div>
      <div><i class="ti ti-shoe"></i> Calçado: <strong>${s.calcado||'—'}</strong></div>
    </div>
    ${s.necesp && s.necesp.toLowerCase()!=='não' && s.necesp.toLowerCase()!=='nao'
      ? `<div class="sac-presente"><i class="ti ti-wheelchair"></i> Necessidade especial: ${s.necesp}</div>` : ''}
    ${s.obs ? `<div class="sac-obs">${s.obs}</div>` : ''}
    <div class="sac-btns">
      <button class="btn btn-sm" onclick="window.etiquetaSacolinhaPDF('${s.id}')" title="Gerar ficha">
        <i class="ti ti-file-type-pdf"></i> Ficha
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
  const ultima = sacolinhas[sacolinhas.length-1];

  const proxNum = sacolinhas.reduce((m,x)=>Math.max(m, Number(x.numero)||0), 0) + 1;

  g('sac-id').value        = s?.id || '';
  g('sac-numero').value    = s?.numero ?? proxNum;
  g('sac-comunidade').value= s?.comunidade ?? (ultima?.comunidade || '');
  g('sac-nome').value      = s?.nome || '';
  g('sac-sexo').value      = s?.sexo || '';
  g('sac-idade').value     = s?.idade ?? '';
  g('sac-roupa').value     = s?.roupa || '';
  g('sac-calcado').value   = s?.calcado || '';
  g('sac-necesp').value    = s?.necesp ?? 'Não';
  g('sac-entrega').value   = s?.entrega ?? (ultima?.entrega || '');
  g('sac-obs').value       = s?.obs || '';

  document.getElementById('modal-sacolinha-titulo').textContent =
    s ? 'Editar sacolinha' : 'Cadastrar nova sacolinha';
  document.getElementById('modal-sacolinha').style.display = 'flex';
  setTimeout(() => g('sac-nome').focus(), 100);
};

window.salvarSacolinha = async () => {
  const g = i => document.getElementById(i).value.trim();
  const id   = document.getElementById('sac-id').value;
  const nome = g('sac-nome');
  const numero = Number(g('sac-numero'));
  if (!nome)   { toast('⚠️ Informe o nome da criança'); return; }
  if (!numero) { toast('⚠️ Informe o número do cadastro'); return; }

  const dados = {
    numero,
    comunidade: g('sac-comunidade'),
    nome,
    sexo:       g('sac-sexo'),
    idade:      g('sac-idade'),
    roupa:      g('sac-roupa'),
    calcado:    g('sac-calcado'),
    necesp:     g('sac-necesp') || 'Não',
    entrega:    g('sac-entrega'),
    obs:        g('sac-obs'),
  };

  try {
    if (id) {
      await updateDoc(doc(db,'sacolinhas',id), dados);
      toast('✅ Sacolinha atualizada!');
    } else {
      await addDoc(collection(db,'sacolinhas'), {
        ...dados,
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

// ══════════════════════════════════════════════
//  FICHA PDF — modelo oficial da Ação de Natal
//  (usa a arte img/ficha_fundo.png como fundo)
// ══════════════════════════════════════════════
let fundoFichaCache = null;

async function carregarFundoFicha() {
  if (fundoFichaCache !== null) return fundoFichaCache;
  try {
    const resp = await fetch('img/ficha_fundo.png');
    if (!resp.ok) throw new Error('não encontrado');
    const blob = await resp.blob();
    fundoFichaCache = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload  = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch(e) {
    console.warn('Arte da ficha não encontrada (img/ficha_fundo.png):', e);
    fundoFichaCache = false;
  }
  return fundoFichaCache;
}

// Logos oficiais (embutidos, não precisam de arquivo externo)
const LOGO_FB = 'data:image/png;base64,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';
const LOGO_IG = 'data:image/png;base64,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';

function desenharFicha(pdf, s, fundo) {
  const W = 210;
  const vermelho = [220, 30, 30];
  const preto    = [20, 20, 20];

  // Moldura da página
  pdf.setDrawColor(...preto);
  pdf.setLineWidth(0.6);
  pdf.rect(6, 6, W-12, 285);

  // ── Arte de fundo (logo + personagens + faixa) ──
  // Imagem original: 817 x 659 px → 196 x 158 mm no topo da página
  if (fundo) {
    pdf.addImage(fundo, 'PNG', 7, 7, 196, 158);
  } else {
    // Fallback sem a arte: desenha logo e faixa em vetor
    pdf.setTextColor(...preto);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(28);
    pdf.text('SUPER', 75, 24, { align:'center' });
    pdf.text('AMIGOS', 135, 34, { align:'center' });
    pdf.setFillColor(...vermelho);
    pdf.rect(45, 140, 120, 13, 'F');
    pdf.triangle(35, 140, 45, 146.5, 35, 153, 'F');
    pdf.triangle(175, 140, 165, 146.5, 175, 153, 'F');
    pdf.setTextColor(255,255,255);
    pdf.setFontSize(13);
    pdf.text('INFORMAÇÕES IMPORTANTES', W/2, 148.5, { align:'center' });
  }

  // ── Título ──
  pdf.setTextColor(...vermelho);
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(13.5);
  pdf.text('AÇÃO ESPECIAL DE NATAL SUPERAMIGOS', W/2, 42, { align:'center' });

  // ── Cadastro NR ──
  pdf.setTextColor(...preto);
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(11.5);
  pdf.text('CADASTRO NR', W/2 - 12, 50, { align:'center' });
  pdf.setLineWidth(0.5);
  pdf.rect(W/2 - 30, 53, 36, 10);
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(15);
  pdf.text(String(s.numero||''), W/2 - 12, 60.5, { align:'center' });

  // ── Comunidade ──
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(11.5);
  pdf.text('COMUNIDADE:', 26, 70);
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(12);
  pdf.text(String(s.comunidade||''), 60, 70);

  // ── Dados da criança ──
  const linha = (rotulo, valor, x, y, tamRot=11.5, tamVal=12.5) => {
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(tamRot);
    pdf.text(rotulo, x, y);
    const w = pdf.getTextWidth(rotulo + ' ');
    pdf.setFontSize(tamVal);
    pdf.text(String(valor??''), x + w + 1, y);
  };

  pdf.setTextColor(...preto);
  linha('NOME:', s.nome, 34, 82, 12, 13);
  linha('SEXO:', s.sexo, 34, 92);
  linha('IDADE:', s.idade, 100, 92);
  linha('NR DE ROUPA:', s.roupa, 26, 102);
  linha('NR DE CALÇADO:', s.calcado, 88, 102);
  linha('NECESSIDADE ESPECIAL:', s.necesp || 'Não', 26, 112);

  // ── Bloco de instruções (abaixo da arte) ──
  const escreverMisto = (partes, x, yy, maxW) => {
    let cx = x;
    pdf.setFontSize(11);
    partes.forEach(([t, st]) => {
      pdf.setFont('helvetica', st==='b'?'bold':st==='bi'?'bolditalic':st==='i'?'italic':'normal');
      t.split(' ').forEach(p => {
        const w = pdf.getTextWidth(p + ' ');
        if (cx + w > x + maxW) { cx = x; yy += 6; }
        pdf.text(p, cx, yy);
        cx += w;
      });
    });
    return yy;
  };

  pdf.setTextColor(...preto);
  let y = escreverMisto([
    ['COLOCAR NA SACOLINHA:', 'bi'],
    ['ROUPA:', 'b'], ['camiseta / blusa / calça / shorts / cueca ou calcinha e meia.', 'n'],
    ['SAPATO:', 'bi'], ['tenis ou sandália - chinelo opcional;', 'i'],
    ['HIGIENE PESSOAL:', 'bi'], ['sabonete, shampoo, pasta e escova de dente;', 'i'],
    ['BRINQUEDO:', 'b'], ['conforme idade e sexo da criança;', 'n'],
  ], 16, 178, 178);

  // ── Avisos finais ──
  y += 15;
  pdf.setTextColor(...vermelho);
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(16);
  pdf.text('TODOS OS ITENS DEVERÃO ESTAR', W/2, y, { align:'center' });
  pdf.text('EMBRULHADOS', W/2, y+8, { align:'center' });

  y += 22;
  pdf.setTextColor(...preto);
  pdf.setFont('helvetica','bolditalic');
  pdf.setFontSize(14.5);
  pdf.text(`ENTREGAR  A  SACOLINHA  ATÉ  O  DIA  ${s.entrega||'___/___/____'}`, W/2, y, { align:'center' });

  // ── Rodapé redes sociais ──
  const yR = 283;
  pdf.setDrawColor(...preto);
  pdf.setLineWidth(0.4);
  pdf.line(6, yR-8, W-6, yR-8);
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...preto);
  // Facebook
  pdf.addImage(LOGO_FB, 'PNG', 20, yR - 5.5, 8, 8);
  pdf.text('SUPERAMIGOSANOS', 31, yR + 0.5);
  // Instagram
  pdf.addImage(LOGO_IG, 'PNG', 112, yR - 5.5, 8, 8);
  pdf.text('SUPERAMIGOSSCANIA', 123, yR + 0.5);
}

window.etiquetaSacolinhaPDF = async id => {
  const s = sacolinhas.find(x=>x.id===id);
  if (!s) return;
  if (!window.jspdf) { toast('⚠️ Recarregue a página e tente novamente'); return; }
  const fundo = await carregarFundoFicha();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  desenharFicha(pdf, s, fundo);
  pdf.save(`sacolinha_${s.numero||''}_${(s.nome||'').replace(/\s+/g,'_')}.pdf`);
  toast('🏷️ Ficha gerada!');
};

window.etiquetasTodasPDF = async () => {
  if (!window.jspdf) { toast('⚠️ Recarregue a página e tente novamente'); return; }
  const pendentes = sacolinhas.filter(s => s.status !== 'entregue');
  const alvo = pendentes.length ? pendentes : sacolinhas;
  if (!alvo.length) { toast('Nenhuma sacolinha para imprimir.'); return; }

  const fundo = await carregarFundoFicha();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const ordenadas = [...alvo].sort((a,b)=>(a.numero||0)-(b.numero||0));
  ordenadas.forEach((s, i) => {
    if (i > 0) pdf.addPage();
    desenharFicha(pdf, s, fundo);
  });
  pdf.save(`fichas_sacolinhas_${new Date().toISOString().slice(0,10)}.pdf`);
  toast(`🏷️ ${ordenadas.length} ficha${ordenadas.length!==1?'s':''} gerada${ordenadas.length!==1?'s':''}!`);
};
