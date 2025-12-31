import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // Staff Routes
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/staff/HomePage.vue'),
    meta: { title: 'staff.home.title' }
  },
  {
    path: '/saudi',
    name: 'SaudiEntry',
    component: () => import('@/views/staff/SaudiEntry.vue'),
    meta: { title: 'staff.saudi.title' }
  },
  {
    path: '/chinese',
    name: 'ChineseEntry',
    component: () => import('@/views/staff/ChineseEntry.vue'),
    meta: { title: 'staff.chinese.title' }
  },
  {
    path: '/foreign',
    name: 'ForeignEntry',
    component: () => import('@/views/staff/ForeignEntry.vue'),
    meta: { title: 'staff.foreign.title' }
  },
  {
    path: '/success/:id',
    name: 'Success',
    component: () => import('@/views/staff/SuccessPage.vue'),
    meta: { title: 'staff.success.title' }
  },

  // Admin Routes
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: 'admin.dashboard.title' }
      },
      {
        path: 'visitors',
        name: 'AdminVisitors',
        component: () => import('@/views/admin/VisitorList.vue'),
        meta: { title: 'admin.visitors.title' }
      }
    ]
  },

  // 404 redirect to home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Update document title on route change
router.beforeEach((to, from, next) => {
  document.title = 'KFNLAI Visitor Management'
  next()
})

export default router
