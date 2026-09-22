import { state } from '../state.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils.js';
import { api } from '../api/client.js';

let onAuthSuccess = null;

export function initAuth(callback) {
  onAuthSuccess = callback;
  checkAuth();
}

async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    showAuthScreen();
    return;
  }

  api.setToken(token);

  try {
    const data = await api.getProfile();
    if (data.success && data.user) {
      state.setUserEmail(data.user.email);
      state.setData(data.user);
      hideAuthScreen();
      if (onAuthSuccess) onAuthSuccess();
    } else {
      api.setToken(null);
      showAuthScreen();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    api.setToken(null);
    showAuthScreen();
  }
}

function showAuthScreen() {
  const app = document.getElementById('app');
  const splash = document.getElementById('splash');
  
  if (splash) splash.remove();
  if (app) app.classList.add('hidden');
  
  const authContainer = document.createElement('div');
  authContainer.id = 'auth-container';
  authContainer.className = 'auth-container';
  authContainer.innerHTML = `
    <div class="auth-card">
      <div class="auth-tabs" role="tablist">
        <button role="tab" id="tab-login" class="auth-tab active" aria-selected="true" aria-controls="panel-login">Masuk</button>
        <button role="tab" id="tab-register" class="auth-tab" aria-selected="false" aria-controls="panel-register">Daftar</button>
      </div>
      
      <div class="auth-panels">
        <div role="tabpanel" id="panel-login" class="auth-panel active" aria-labelledby="tab-login">
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email</label>
              <input class="form-input" id="login-email" type="email" placeholder="masuk@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Kata Sandi</label>
              <input class="form-input" id="login-password" type="password" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Masuk</button>
          </form>
        </div>
        
        <div role="tabpanel" id="panel-register" class="auth-panel" aria-labelledby="tab-register" hidden>
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="register-name">Nama Lengkap</label>
              <input class="form-input" id="register-name" type="text" placeholder="Nama Anda" required autocomplete="name">
            </div>
            <div class="form-group">
              <label class="form-label" for="register-email">Email</label>
              <input class="form-input" id="register-email" type="email" placeholder="daftar@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label" for="register-password">Kata Sandi</label>
              <input class="form-input" id="register-password" type="password" placeholder="Minimal 6 karakter" required minlength="6" autocomplete="new-password">
            </div>
            <div class="form-group">
              <label class="form-label" for="register-confirm">Konfirmasi Kata Sandi</label>
              <input class="form-input" id="register-confirm" type="password" placeholder="Ulangi kata sandi" required autocomplete="new-password">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Daftar</button>
          </form>
        </div>
      </div>
      
      <p class="auth-footer">Campusify — Dasbor Akademik Mahasiswa</p>
    </div>
  `;
  
  document.body.appendChild(authContainer);
  setupAuthEvents(authContainer);
}

function hideAuthScreen() {
  const authContainer = document.getElementById('auth-container');
  const app = document.getElementById('app');
  
  if (authContainer) authContainer.remove();
  if (app) app.classList.remove('hidden');
}

function setupAuthEvents(container) {
  const tabLogin = container.querySelector('#tab-login');
  const tabRegister = container.querySelector('#tab-register');
  const panelLogin = container.querySelector('#panel-login');
  const panelRegister = container.querySelector('#panel-register');
  
  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));
  
  function switchTab(tab) {
    const isLogin = tab === 'login';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
    tabLogin.setAttribute('aria-selected', isLogin);
    tabRegister.setAttribute('aria-selected', !isLogin);
    panelLogin.classList.toggle('active', isLogin);
    panelRegister.classList.toggle('active', !isLogin);
    panelLogin.hidden = !isLogin;
    panelRegister.hidden = isLogin;
  }
  
  container.querySelector('#login-form').addEventListener('submit', handleLogin);
  container.querySelector('#register-form').addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('#login-email').value.trim().toLowerCase();
  const password = form.querySelector('#login-password').value;
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';
  
  try {
    const data = await api.login(email, password);
    if (data.success && data.token) {
      state.setUserEmail(data.user.email);
      state.setData(data.user);
      showToast('Berhasil masuk', 'success');
      hideAuthScreen();
      if (onAuthSuccess) onAuthSuccess();
    } else {
      showToast(data.error || 'Login gagal', 'error');
    }
  } catch (error) {
    showToast(error.message || 'Email atau kata sandi salah', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Masuk';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('#register-name').value.trim();
  const email = form.querySelector('#register-email').value.trim().toLowerCase();
  const password = form.querySelector('#register-password').value;
  const confirm = form.querySelector('#register-confirm').value;
  
  if (password !== confirm) {
    showToast('Kata sandi tidak cocok', 'error');
    return;
  }
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';
  
  try {
    const data = await api.register(name, email, password);
    if (data.success && data.token) {
      state.setUserEmail(data.user.email);
      state.setData(data.user);
      showToast('Pendaftaran berhasil', 'success');
      hideAuthScreen();
      if (onAuthSuccess) onAuthSuccess();
    } else {
      showToast(data.error || 'Registrasi gagal', 'error');
    }
  } catch (error) {
    showToast(error.message || 'Registrasi gagal', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Daftar';
  }
}

export async function logout() {
  try {
    await api.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
  state.setUserEmail(null);
  state.setData(api.defaultData || {});
  location.reload();
}