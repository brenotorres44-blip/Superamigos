// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/anuncio.js
//  Gerador de anúncios de ajuda
// ══════════════════════════════════════════════
import { familias, anuncioPessoa, anuncioFamilia,
         setAnuncio, toast, calcIdade } from './utils.js';

window.abrirAnuncio = (p, f) => {
  setAnuncio(p, f);
  const tipo = document.getElementById('an-tipo'); if(tipo) tipo.value='geral';
  window.gerarAnuncio();
  const m = document.getElementById('modal-anuncio'); if(m) m.style.display='flex';
};

window.abrirAnuncioById = (fid, pid) => {
  const f = familias.find(x=>x.id===fid); if(!f) return;
  if (pid) {
    const p = (f.pessoas||[]).find(x=>x.id===pid);
    if(p) { window.abrirAnuncio(p,f); return; }
  }
  window.abrirAnuncioFamilia(fid);
};

window.abrirAnuncioFamilia = fid => {
  const f = familias.find(x=>x.id===fid); if(!f) return;
  const p = (f.pessoas||[]).find(p=>p.doe||p.ajuda)
    || { nome:f.responsavel, nasc:'', doe:f.tipoNec||'Necessidades gerais',
         cid:'', med:'', ajuda:f.nec||'', obs:f.obs||'' };
  window.abrirAnuncio(p, f);
};

window.gerarAnuncio = () => {
  const p = anuncioPessoa, f = anuncioFamilia;
  if (!p||!f) return;
  const tipo   = document.getElementById('an-tipo')?.value||'geral';
  const idStr  = p.nasc ? ', '+calcIdade(p.nasc) : '';
  const emojis  = { medicamento:'💊',equipamento:'🦽',cesta:'🛒',financeiro:'💰',voluntario:'🤝',geral:'🙏' };
  const titulos = {
    medicamento:'⚠️ PEDIDO DE AJUDA — MEDICAMENTOS',
    equipamento:'⚠️ PEDIDO DE AJUDA — EQUIPAMENTO MÉDICO',
    cesta:      '⚠️ PEDIDO DE AJUDA — ALIMENTAÇÃO',
    financeiro: '⚠️ PEDIDO DE AJUDA — APOIO FINANCEIRO',
    voluntario: '⚠️ BUSCAMOS VOLUNTÁRIO / CUIDADOR',
    geral:      '🙏 PEDIDO DE AJUDA — SUPERAMIGOS ONG',
  };
  const msgs = {
    medicamento:'Toda contribuição, por menor que seja, faz uma enorme diferença. Se você tem medicamentos que não usa ou pode ajudar a custear, entre em contato!',
    equipamento:'Precisamos urgentemente de equipamento médico para melhorar a qualidade de vida desta pessoa. Se você tem ou conhece alguém que possa ajudar, entre em contato!',
    cesta:      'Esta família está passando por dificuldades e precisa de alimentos básicos. Uma cesta básica ou doação de alimentos já faz toda a diferença!',
    financeiro: 'Uma pequena contribuição sua pode mudar a vida desta família. Qualquer valor ajuda — Pix, transferência ou doação presencial!',
    voluntario: 'Buscamos voluntários com disponibilidade e coração aberto para acompanhar e cuidar desta pessoa. Se você tem um tempinho, faça a diferença!',
    geral:      'Se você puder ajudar de alguma forma — seja com doação, serviço, medicamento ou simplesmente compartilhando esta mensagem — já estará fazendo o bem!',
  };
  const ajudaEsp = p.ajuda ? `\n🙏 Necessidade específica: ${p.ajuda}` : '';
  const medStr   = p.med   ? `\n💊 Medicamento em uso: ${p.med}`       : '';
  const texto = `${emojis[tipo]} ${titulos[tipo]}

Olá, amigos! A ONG SuperAmigos está pedindo a sua ajuda! 🌟

Temos uma pessoa especial que precisa de apoio:

👤 ${p.nome}${idStr}
🏥 Diagnóstico: ${p.doe}${p.cid?' (CID: '+p.cid+')':''}${medStr}${ajudaEsp}
📍 Região: ${f.bairro||''}${f.cidade?', '+f.cidade:''}

${msgs[tipo]}

📲 Entre em contato conosco:
• Instagram: @superamigosong
• Facebook: superamigosanos
• WhatsApp: (11) xxxxx-xxxx

"Deus é Fiel" ❤️
SuperAmigos ONG — Associação de Desenvolvimento Social e Cidadania

👉 Por favor, COMPARTILHE! Juntos podemos manter o SONHO e o SORRISO de nossas crianças e famílias! 🌟`;
  const el = document.getElementById('an-texto'); if(el) el.value=texto;
};

window.copiarAnuncio = () => {
  const txt = document.getElementById('an-texto')?.value; if(!txt) return;
  navigator.clipboard.writeText(txt).then(() => {
    const el = document.getElementById('copy-ok');
    if(el) { el.style.display='block'; setTimeout(()=>el.style.display='none',2500); }
    toast('✅ Texto copiado!');
  });
};

window.compartilharWpp = () => {
  const txt = encodeURIComponent(document.getElementById('an-texto')?.value||'');
  window.open('https://wa.me/?text='+txt,'_blank');
};

window.compartilharInsta = () => {
  window.copiarAnuncio();
  window.open('https://www.instagram.com/','_blank');
  toast('Texto copiado! Cole na publicação do Instagram.');
};
