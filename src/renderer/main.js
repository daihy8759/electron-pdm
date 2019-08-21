import Vue from 'vue';
import iView from 'iview';
import 'iview/dist/styles/iview.css';
import './app.css';
import App from './App';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

Vue.use(iView);
Vue.use(require('vue-electron'));

new Vue({
  components: {
    App,
  },
  router,
  store,
  template: '<App/>',
}).$mount('#app');

if (module.hot) {
  module.hot.accept();
}
