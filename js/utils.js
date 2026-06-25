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
export let filtroUrgencia = '';
export let filtroTipoNec  = '';

export function setFamilias(f)        { familias       = f; }
export function setCurrentView(v)     { currentView    = v; }
export function setCurrentBairro(b)   { currentBairro  = b; }
export function setSelectedFamId(id)  { selectedFamId  = id; }
export function setAddingToFamId(id)  { addingToFamId  = id; }
export function setAnuncio(p, f)      { anuncioPessoa  = p; anuncioFamilia = f; }
export function setUnsubFamilias(u)   { unsubFamilias  = u; }
export function setFiltroUrgencia(v)  { filtroUrgencia = v; }
export function setFiltroTipoNec(v)   { filtroTipoNec  = v; }

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

export function formatarDataHora(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
}

export function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g,'');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i=0; i<9; i++) soma += parseInt(cpf[i]) * (10-i);
  let r = 11 - (soma % 11); if (r >= 10) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i=0; i<10; i++) soma += parseInt(cpf[i]) * (11-i);
  r = 11 - (soma % 11); if (r >= 10) r = 0;
  return r === parseInt(cpf[10]);
}

export function mascaraCPF(v) {
  return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}

export function mascaraTel(v) {
  v = v.replace(/\D/g,'');
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3');
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
      nome: f.nome, doe: f.tipoNec||'Urgencia critica',
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
    const mu = !filtroUrgencia || f.urgencia === filtroUrgencia;
    const mn = !filtroTipoNec  || (f.tipoNec||'').includes(filtroTipoNec);
    const ms = !q ||
      f.nome.toLowerCase().includes(q) ||
      (f.responsavel||'').toLowerCase().includes(q) ||
      (f.bairro||'').toLowerCase().includes(q) ||
      (f.tipoNec||'').toLowerCase().includes(q) ||
      (f.nec||'').toLowerCase().includes(q) ||
      (f.pessoas||[]).some(p =>
        p.nome.toLowerCase().includes(q) ||
        (p.doe||'').toLowerCase().includes(q)
      );
    return mb && mu && mn && ms;
  });
}

export function confirmar(msg) {
  return new Promise(resolve => {
    const id = 'modal-confirm-' + Date.now();
    const div = document.createElement('div');
    div.className = 'modal-backdrop';
    div.id = id;
    div.style.display = 'flex';
    div.innerHTML = `
      <div class="modal" style="max-width:340px">
        <div class="modal-header">
          <h3><i class="ti ti-alert-triangle"></i> Confirmar ação</h3>
        </div>
        <div class="modal-body" style="padding:20px 18px">
          <p style="font-size:14px;color:var(--tx);line-height:1.5">${msg}</p>
        </div>
        <div class="modal-footer">
          <button class="btn" id="${id}-no">Cancelar</button>
          <button class="btn btn-red" id="${id}-yes"><i class="ti ti-check"></i> Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(div);
    document.getElementById(id+'-yes').onclick = () => { div.remove(); resolve(true); };
    document.getElementById(id+'-no').onclick  = () => { div.remove(); resolve(false); };
  });
}
