import { signIn, signUp } from '../../services/auth.js';
import { notify } from '../components/Notification.js';


export function LoginPage() {
const el = document.createElement('div');
el.className = 'container login';
el.innerHTML = `
<div class="card">
<h1>Inventário de TI</h1>
<p class="subtitle">Acesse sua conta</p>
<div class="form-group">
<label>Email</label>
<input id="email" type="email" placeholder="voce@empresa.com" />
</div>
<div class="form-group">
<label>Senha</label>
<input id="password" type="password" placeholder="••••••••" />
</div>
<div class="actions">
<button id="loginBtn">Entrar</button>
<button id="signupBtn" class="secondary">Criar conta</button>
</div>
</div>
`;


const email = el.querySelector('#email');
const password = el.querySelector('#password');
el.querySelector('#loginBtn').onclick = async () => {
try {
await signIn({ email: email.value, password: password.value });
notify('Bem-vindo!', 'success');
} catch (e) {
notify(e.message, 'error');
}
};
el.querySelector('#signupBtn').onclick = async () => {
try {
await signUp({ email: email.value, password: password.value });
notify('Verifique seu email para confirmar a conta.', 'info');
} catch (e) {
notify(e.message, 'error');
}
};


return el;
}