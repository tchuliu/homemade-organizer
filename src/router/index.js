import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HomeDetail from '../views/HomeDetail.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/home/:id', name: 'home-detail', component: HomeDetail },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
