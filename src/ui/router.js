import { LoginPage } from './pages/LoginPage.js';
import { AppPage } from './pages/AppPage.js';
import { onAuthChange, getUser } from '../services/auth.js';

const appRoot = document.getElementById('app');

function render(view) {
  appRoot.innerHTML = '';
  appRoot.appendChild(view);
}

export async function startRouter() {
  const sessionUser = await getUser();
  if (sessionUser) render(AppPage());
  else render(LoginPage());

  // ✅ recebe o user direto (não destruturar)
  onAuthChange((user) => {
    if (user) render(AppPage());
    else render(LoginPage());
  });

  // força navegação para login quando clicamos em "Sair"
  document.addEventListener('auth:logout', () => {
    render(LoginPage());
  });
}
