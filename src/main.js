import { createApp } from 'vue'
import './assets/css/main.css'
import App from './App.vue'
import router from './router';
// import 'flowbite/dist/flowbite.min.js';


const appInstance = createApp(App);
appInstance.use(router);

appInstance.mount('#app');
