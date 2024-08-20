const routes = [
  {
    path: '/',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') },{ path: 'test', component: () => import('pages/TestPage.vue') }
    ]
  },
  {
    path: '/dashboard',
    component: () => import('layouts/DashboardLayout.vue'),
    children: [
      { path: '', component: () => import('pages/HomePage.vue') },{ path: 'test', component: () => import('pages/TestPage.vue') },{ path: 'maps', component: () => import('pages/LeafletMap.vue') },{ path: 'notfixed', component: () => import('pages/PotholesNotFixedPage.vue') }, {path: 'flowanalysis', component: () => import('pages/GraphDash.vue') },{path: 'flowdata', component: () => import('pages/Flowmeter1Analysis.vue') },{path: 'flowlineg', component: () => import('pages/TestPage1.vue') },
      
    ]
  },
  {
    path: '/flowlineg',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/TestPage1.vue') }
    ]
  },{
    path: '/flowlineg2',
    component: () => import('layouts/DashboardLayout.vue'),
    children: [
      { path: '', component: () => import('pages/FlowMeterMap.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
