import { createApp } from './app/app.js';
import { mountCartoonInteractions } from './app/cartoonInteractions.js';

createApp(document.getElementById('app')).start();
mountCartoonInteractions();
