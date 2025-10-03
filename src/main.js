import { startRouter } from './ui/router.js';
import './styles/base.css';
import './styles/components.css';
import './styles/responsive.css'; // <-- import responsivo POR ÚLTIMO

// src/main.js  (ou onde sua app sobe)
import { initRealtime } from './lib/realTime.js';
initRealtime(); // começa a ouvir inventory/movements/audit

startRouter();
