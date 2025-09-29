export function notify(message, type = 'info') {
const host = document.getElementById('notify-root') || document.body;
const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.textContent = message;
host.appendChild(toast);
setTimeout(() => toast.remove(), 3500);
}