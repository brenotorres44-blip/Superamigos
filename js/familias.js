// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/familias.js
//  CRUD famílias, detalhe, membros
// ══════════════════════════════════════════════
import { db, doc, addDoc, updateDoc, deleteDoc,
         collection, serverTimestamp } from './firebase.js';
import { familias, addingToFamId, setAddingToFamId,
         toast, ini, calcIdade } from './utils.js';

// ── Detalhe ────────────────────────────────────
function urgenciaDetalhe(f) {
  if (!f.urgencia) return '';
  const cor   = f.urgencia==='alta'?'#C62828':f.urgencia==='media'?'#E65100':'#856404';
  const label = f.urgencia==='alta'?'🔴 Alta — Situação crítica':
                f.urgencia==='media'?'🟠 Média — Precisa de atenção':'🟡 Baixa — Necessidades básicas';
  return `<div class="det-row"><i class="ti ti-alert-triangle"></i><div>
    <div class="det-val" style="color:${cor}">${label}</div>
    <div class="det-lbl">Nível de urgência</div>
  </div></div>`;
}

export function renderDetalhe(f) {
  const pessoas = f.pessoas||[];
  const el = document.getElementById('detail-inner');
  if(!el) return;
  el.innerHTML = `
    <div class="det-header">
      <div class="det-av">${ini(f.nome)}</div>
      <div class="det-name">${f.nome}</div>
      <div class="det-loc"><i class="ti ti-map-pin" style="font-size:11px"></i> ${f.bairro||'—'}</div>
      <div class="det-actions">
        <button class="btn btn-sm" onclick="window.abrirModalPessoa('${f.id}')">
          <i class="ti ti-user-plus"></i> + Pessoa
        </button>
        <button class="btn btn-or btn-sm" onclick="window.abrirAnuncioFamilia('${f.id}')">
          <i class="ti ti-speakerphone"></i> Pedir ajuda
        </button>
        <button class="btn btn-sm" onclick="window.editarFamilia('${f.id}')">
          <i class="ti ti-edit"></i>
        </button>
        <button class="btn btn-red btn-sm" onclick="window.excluirFamilia('${f.id}')">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>
    <div class="det-body">
      <div class="det-section">📋 Dados gerais</div>
      <div class="det-row"><i class="ti ti-user"></i><div>
        <div class="det-val">${f.responsavel||'—'}</div><div class="det-lbl">Responsável</div>
      </div></div>
      <div class="det-row"><i class="ti ti-phone"></i><div>
        <div class="det-val">${f.tel||'—'}</div><div class="det-lbl">Telefone</div>
      </div></div>
      ${f.wpp?`<div class="det-row"><i class="ti ti-brand-whatsapp"></i><div>
        <div class="det-val">${f.wpp}</div><div class="det-lbl">WhatsApp</div>
      </div></div>`:''}
      <div class="det-row"><i class="ti ti-map-pin"></i><div>
        <div class="det-val">${f.endereco||'—'}</div>
        <div class="det-lbl">${f.bairro||''}${f.cidade?', '+f.cidade:''} ${f.cep?'· '+f.cep:''}</div>
      </div></div>
      ${f.renda?`<div class="det-row"><i class="ti ti-cash"></i><div>
        <div class="det-val">${f.renda}</div><div class="det-lbl">Renda familiar</div>
      </div></div>`:''}
      ${f.ben?`<div class="det-row"><i class="ti ti-certificate"></i><div>
        <div class="det-val">${f.ben}</div><div class="det-lbl">Benefício social</div>
      </div></div>`:''}
      ${urgenciaDetalhe(f)}
      ${f.tipoNec?`<div class="det-row"><i class="ti ti-list-check"></i><div>
        <div class="det-val">${f.tipoNec}</div><div class="det-lbl">Tipo de necessidade</div>
      </div></div>`:''}
      ${f.nec?`<div class="det-row"><i class="ti ti-heart-handshake"></i><div>
        <div class="det-val" style="color:#C62828">${f.nec}</div>
        <div class="det-lbl">Descrição das necessidades</div>
      </div></div>`:''}
      ${f.obs?`<div class="det-row"><i class="ti ti-note"></i><div>
        <div class="det-lbl">${f.obs}</div>
      </div></div>`:''}
      <div class="det-row"><i class="ti ti-calendar"></i><div>
        <div class="det-val">${f.ultimoAtend||'—'}</div>
        <div class="det-lbl">Último atend. · ${f.atend||0} total</div>
      </div></div>
      <hr class="det-divider">
      <div class="det-section">👥 Membros (${pessoas.length})</div>
      ${pessoas.map((p,idx) => `
        <div class="person-card">
          <div class="person-top">
            <div class="person-av">${ini(p.nome)}</div>
            <div style="flex:1">
              <div class="person-name">${p.nome}</div>
              <div class="person-sub">${p.rel||''}${p.nasc?' · '+calcIdade(p.nasc):''}${p.sexo?' · '+p.sexo:''}</div>
            </div>
            <button class="person-delete" onclick="window.excluirPessoa('${f.id}',${idx})">
              <i class="ti ti-x"></i>
            </button>
          </div>
          <div class="person-tags">
            ${p.doe
              ?`<span class="tag ${p.ss==='alert'?'tr':p.ss==='monit'?'to':'tg'}">${p.ss==='alert'?'⚠':p.ss==='monit'?'👁':'✓'} ${p.doe}</span>`
              :'<span class="tag tg">✓ Saudável</span>'}
            ${p.esc?`<span class="tag tb">${p.esc}</span>`:''}
          </div>
          ${p.med?`<div class="person-med">💊 ${p.med}</div>`:''}
          ${p.ajuda?`<div class="person-need">🙏 Necessita: ${p.ajuda}</div>`:''}
          ${p.doe?`<div class="person-btn">
            <button class="btn btn-or btn-xs" onclick='window.abrirAnuncio(${JSON.stringify(p)},${JSON.stringify(f)})'>
              <i class="ti ti-speakerphone"></i> Pedir ajuda
            </button>
          </div>`:''}
        </div>`).join('')}
      ${!pessoas.length?'<p style="font-size:12px;color:var(--tx3);text-align:center;padding:10px 0">Nenhuma pessoa cadastrada ainda.</p>':''}
    </div>`;
}

// ── Modal família ──────────────────────────────
window.abrirModalFamilia = (id=null) => {
  limparFormFamilia();
  const t = document.getElementById('modal-familia-titulo');
  if(t) t.textContent = id ? 'Editar família' : 'Cadastrar nova família';
  if (id) {
    const f = familias.find(x=>x.id===id); if(!f) return;
    const s = (eid,v) => { const e=document.getElementById(eid); if(e) e.value=v||''; };
    s('f-id',f.id); s('f-nome',f.nome); s('f-resp',f.responsavel);
    s('f-tel',f.tel); s('f-wpp',f.wpp); s('f-end',f.endereco);
    s('f-bairro',f.bairro); s('f-cep',f.cep); s('f-cidade',f.cidade||'São Paulo');
    s('f-renda',f.renda); s('f-memb',f.memb); s('f-ben',f.ben);
    s('f-urgencia',f.urgencia); s('f-tipo-nec',f.tipoNec);
    s('f-nec',f.nec); s('f-obs',f.obs);
  }
  const m = document.getElementById('modal-familia'); if(m) m.style.display='flex';
};

window.editarFamilia = id => window.abrirModalFamilia(id);

function limparFormFamilia() {
  ['f-id','f-nome','f-resp','f-tel','f-wpp','f-end','f-bairro','f-cep','f-nec','f-obs']
    .forEach(id => { const e=document.getElementById(id); if(e) e.value=''; });
  const c = document.getElementById('f-cidade'); if(c) c.value='São Paulo';
  const m = document.getElementById('f-memb');   if(m) m.value='';
  ['f-renda','f-ben','f-urgencia','f-tipo-nec']
    .forEach(id => { const e=document.getElementById(id); if(e) e.selectedIndex=0; });
}

window.salvarFamilia = async () => {
  const nome = document.getElementById('f-nome')?.value.trim();
  const resp = document.getElementById('f-resp')?.value.trim();
  if (!nome||!resp) { toast('Preencha nome e responsável!'); return; }
  const g = id => document.getElementById(id)?.value||'';
  const dados = {
    nome, responsavel: resp,
    bairro:   g('f-bairro').trim()||'Não informado',
    endereco: g('f-end').trim(),  cidade: g('f-cidade').trim()||'São Paulo',
    cep:      g('f-cep').trim(),  tel:    g('f-tel').trim(),   wpp: g('f-wpp').trim(),
    renda:    g('f-renda'),       memb:   g('f-memb'),         ben: g('f-ben'),
    urgencia: g('f-urgencia'),    tipoNec: g('f-tipo-nec'),
    nec:      g('f-nec').trim(),  obs:    g('f-obs').trim(),
  };
  const editId = g('f-id');
  try {
    if (editId) {
      await updateDoc(doc(db,'familias',editId), dados);
      toast('✅ Família atualizada!');
    } else {
      dados.pessoas=[]; dados.atend=0; dados.ultimoAtend='—';
      dados.criadoEm = serverTimestamp();
      await addDoc(collection(db,'familias'), dados);
      toast('✅ Família cadastrada!');
    }
    window.fecharModal('modal-familia');
  } catch(e) { console.error(e); toast('Erro ao salvar.'); }
};

window.excluirFamilia = async id => {
  if (!confirm('Excluir esta família e todos os seus dados?')) return;
  try {
    await deleteDoc(doc(db,'familias',id));
    window.fecharDetalhe();
    toast('🗑️ Família removida.');
  } catch(e) { toast('Erro ao excluir.'); }
};

// ── Modal pessoa ───────────────────────────────
window.abrirModalPessoa = fid => {
  setAddingToFamId(fid);
  limparFormPessoa();
  const t = document.getElementById('modal-pessoa-titulo'); if(t) t.textContent='Cadastrar pessoa';
  const p = document.getElementById('p-id');                if(p) p.value='';
  const m = document.getElementById('modal-pessoa');        if(m) m.style.display='flex';
};

function limparFormPessoa() {
  ['p-id','p-nome','p-nasc','p-cpf','p-doe','p-cid','p-med','p-ajuda','p-obs']
    .forEach(id => { const e=document.getElementById(id); if(e) e.value=''; });
  ['p-sexo','p-rel','p-esc']
    .forEach(id => { const e=document.getElementById(id); if(e) e.selectedIndex=0; });
  const ss = document.getElementById('p-ss'); if(ss) ss.value='ok';
}

window.salvarPessoa = async () => {
  const nome = document.getElementById('p-nome')?.value.trim();
  if (!nome) { toast('Preencha o nome!'); return; }
  const f = familias.find(x=>x.id===addingToFamId); if(!f) return;
  const g = id => document.getElementById(id)?.value||'';
  const pessoa = {
    id: Date.now().toString(), nome,
    nasc: g('p-nasc'), sexo: g('p-sexo'), rel: g('p-rel'), cpf: g('p-cpf').trim(),
    esc:  g('p-esc'),  ss:   g('p-ss'),   doe: g('p-doe').trim(),
    cid:  g('p-cid').trim(), med: g('p-med').trim(),
    ajuda: g('p-ajuda').trim(), obs: g('p-obs').trim(),
  };
  try {
    await updateDoc(doc(db,'familias',f.id), { pessoas:[...(f.pessoas||[]),pessoa] });
    window.fecharModal('modal-pessoa');
    toast('✅ Pessoa cadastrada!');
  } catch(e) { toast('Erro ao salvar pessoa.'); }
};

window.excluirPessoa = async (fid,idx) => {
  if (!confirm('Remover esta pessoa?')) return;
  const f = familias.find(x=>x.id===fid); if(!f) return;
  try {
    await updateDoc(doc(db,'familias',fid), { pessoas:(f.pessoas||[]).filter((_,i)=>i!==idx) });
    toast('🗑️ Pessoa removida.');
  } catch(e) { toast('Erro ao remover.'); }
};

window.fecharModal = id => {
  const el = document.getElementById(id); if(el) el.style.display='none';
};
