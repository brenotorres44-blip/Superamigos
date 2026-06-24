// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/app.js
//  Listener Firestore, navegação, stats, lista
// ══════════════════════════════════════════════
import { db, collection, query, orderBy, onSnapshot } from './firebase.js';
import { familias, setFamilias, setUnsubFamilias, setCurrentView, setCurrentBairro,
         setSelectedFamId, currentView, currentBairro, selectedFamId,
         getAlertas, filtradas, urgenciaTag, toast, ini, calcIdade } from './utils.js';

// ── Listener Firestore ─────────────────────────
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
    alertas:  '⚠️ Alertas ativos'
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

// ── Render lista principal ─────────────────────
window.renderList = () => {
  atualizarStats();
  const el = document.getElementById('family-list');
  if(!el) return;

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
    const ll = document.getElementById('list-label');
    if(ll) ll.textContent = 'Patologias registradas';
    const todos = familias.flatMap(f =>
      (f.pessoas||[]).filter(p=>p.doe).map(p=>({...p, fn:f.nome, fobj:f}))
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
    const al = getAlertas();
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

// ── Detalhe família ────────────────────────────
window.selecionarFamilia = id => {
  setSelectedFamId(id);
  const f = familias.find(x => x.id === id);
  if (!f) return;
  const panel = document.getElementById('detail-panel');
  if(panel) { panel.style.display='flex'; panel.style.flexDirection='column'; }
  import('./familias.js').then(m => m.renderDetalhe(f));
  window.renderList();
};

window.fecharDetalhe = () => {
  setSelectedFamId(null);
  const panel = document.getElementById('detail-panel');
  if(panel) panel.style.display = 'none';
};

// ── Fechar modal clicando no backdrop ──────────
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop'))
    e.target.style.display = 'none';
});
