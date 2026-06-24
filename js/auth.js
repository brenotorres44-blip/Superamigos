// ══════════════════════════════════════════════
//  SUPERAMIGOS — js/auth.js
//  Login, logout, onAuthStateChanged
// ══════════════════════════════════════════════
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';
import { unsubFamilias, setUnsubFamilias, toast } from './utils.js';
import { iniciarListenerFamilias } from './app.js';

// ── Observer de autenticação ───────────────────
onAuthStateChanged(auth, user => {
  document.getElementById('loading-screen').style.display = 'none';
  if (user) {
    mostrarApp();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
  }
});

function mostrarApp() {
  document.getElementById('app').style.display          = 'flex';
  document.getElementById('login-screen').style.display = 'none';
  iniciarListenerFamilias();
}

// ── Login ──────────────────────────────────────
window.fazerLogin = async () => {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const erro  = document.getElementById('login-erro');
  const btn   = document.getElementById('btn-login');
  erro.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Entrando...';
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    document.getElementById('login-screen').style.display = 'none';
    mostrarApp();
  } catch(e) {
    erro.textContent = 'E-mail ou senha incorretos.';
    erro.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-login"></i> Entrar no sistema';
  }
};

// ── Logout ─────────────────────────────────────
window.fazerLogout = async () => {
  if (!confirm('Deseja sair do sistema?')) return;
  if (unsubFamilias) unsubFamilias();
  setUnsubFamilias(null);
  await signOut(auth);
  document.getElementById('app').style.display          = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-senha').value = '';
};

// Enter no login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' &&
      document.getElementById('login-screen').style.display !== 'none') {
    window.fazerLogin();
  }
});
