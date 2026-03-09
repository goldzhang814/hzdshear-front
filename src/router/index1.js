import {createRouter, createWebHistory} from 'vue-router'
import Landing from '@/views/Landing.vue'
import Dashboard from '@/views/Dashboard.vue'
import AccountList from '@/views/accounts/AccountList.vue'
import AccountGroup from '@/views/accounts/AccountGroup.vue'
import VideoLibrary from '@/views/VideoLibrary.vue'
import PublishList from '@/views/PublishList.vue'
import Comments from '@/views/Comments.vue'
import Resources from '@/views/Resources.vue'
import Login from '@/views/Login.vue'

const routes = [
    // 公开页面
    {path: '/', component: Landing, meta: {public: true, title: '快子国际版 - TikTok账号管理平台'}},
    {path: '/login', component: Login, meta: {public: true, title: 'Sign In'}},

    // 需要登录的页面
    {path: '/dashboard', component: Dashboard, meta: {title: 'Data Center', nav: 'dashboard'}},
    {path: '/accounts', component: AccountList, meta: {title: 'Account List', nav: 'accounts'}},
    {path: '/accounts/groups', component: AccountGroup, meta: {title: 'Account Groups', nav: 'groups'}},
    {path: '/videos', component: VideoLibrary, meta: {title: 'Cloud Video Library', nav: 'videos'}},
    {path: '/publish', component: PublishList, meta: {title: 'Publish List', nav: 'publish'}},
    {path: '/comments', component: Comments, meta: {title: 'Comment Management', nav: 'comments'}},
    {path: '/resources', component: Resources, meta: {title: 'Resource Management', nav: 'resources'}},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    // 每次切换路由滚动到顶部
    scrollBehavior: () => ({top: 0}),
})

// ─── 全局路由守卫 ────────────────────────────────
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const isPublic = to.meta.public === true

    if (!isPublic && !token) {
        // 未登录访问需要认证的页面 → 跳登录，携带原目标
        next({path: '/login', query: {redirect: to.fullPath}})
    } else if (token && to.path === '/login') {
        // 已登录访问登录页 → 跳系统首页
        next('/dashboard')
    } else {
        next()
    }
})

export default router
