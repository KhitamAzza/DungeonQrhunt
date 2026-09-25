import './style.css';

import'./core.js';
import'./assets-config.js';      
import'./student.js';
import'./teacher.js';
import'./loading.js';

import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });