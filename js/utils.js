// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/utils.js
//  Estado global, helpers, toast
// ══════════════════════════════════════════════

export let familias      = [];
export let currentView   = 'familias';
export let currentBairro = '';
export let selectedFamId = null;
export let addingToFamId = null;
export let anuncioPessoa  = null;
export let anuncioFamilia = null;
export let unsubFamilias  = null;

export function setFamilias(f)       { familias       = f; }
export function setCurrentView(v)    { currentView    = v; }
export function setCurrentBairro(b)  { currentBairro  = b; }
export function setSelectedFamId(id) { selectedFamId  = id; }
export function setAddingToFamId(id) { addingToFamId  = id; }
export function setAnuncio(p, f)     { anuncioPessoa  = p; anuncioFamilia = f; }
export function setUnsubFamilias(u)  { unsubFamilias  = u; }

// ── Helpers ────────────────────────────────────
export function ini(nome) {
  return (nome||'?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
}

export function calcIdade(nasc) {
  if (!nasc) return '';
  const d = new Date(nasc), t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a + ' anos';
}

export function getAlertas() {
  const alertasPessoas = familias.flatMap(f =>
    (f.pessoas||[]).filter(p => p.ss === 'alert').map(p => ({
      ...p, fn: f.nome, fid: f.id, tipo: 'pessoa'
    }))
  );
  const alertasFamilias = familias
    .filter(f => f.urgencia === 'alta')
    .map(f => ({
      nome: f.nome, doe: f.tipoNec||'Urgência crítica',
      cid:'', med:'', ajuda: f.nec||'', obs: f.obs||'',
      fn: f.nome, fid: f.id, tipo: 'familia'
    }));
  return [...alertasPessoas, ...alertasFamilias];
}

export function toast(msg, dur=3000) {
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.style.display='none', dur);
}

export function urgenciaTag(f) {
  if (f.urgencia==='alta')  return '<span class="tag tr">🔴 Urgência Alta</span>';
  if (f.urgencia==='media') return '<span class="tag to">🟠 Urgência Média</span>';
  if (f.urgencia==='baixa') return '<span class="tag ty">🟡 Urgência Baixa</span>';
  return '';
}

export function filtradas() {
  const q = (document.getElementById('searchInput')?.value||'').toLowerCase();
  return familias.filter(f => {
    const mb = !currentBairro || f.bairro === currentBairro;
    const ms = !q ||
      f.nome.toLowerCase().includes(q) ||
      (f.responsavel||'').toLowerCase().includes(q) ||
      (f.bairro||'').toLowerCase().includes(q);
    return mb && ms;
  });
}
