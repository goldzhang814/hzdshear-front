<template>
  <!-- Login/Landing page: no sidebar layout -->
  <RouterView v-if="isLoginPage || isLandingPage"/>

  <!-- Main app layout -->
  <div v-else class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-text">Shear</span>
        <span class="logo-badge">int</span>
      </div>
      <div class="logo-bar"></div>

      <nav class="sidebar-nav">
        <div v-for="item in navItems" :key="item.key">
          <div
              class="nav-item"
              :class="{ active: isNavActive(item), expanded: expandedKey === item.key }"
              @click="handleNavClick(item)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.children" class="nav-arrow">{{ expandedKey === item.key ? '▲' : '▼' }}</span>
          </div>
          <div v-if="item.children && expandedKey === item.key" class="nav-children">
            <RouterLink
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="nav-child"
                :class="{ active: $route.path === child.path }"
            >{{ child.label }}
            </RouterLink>
          </div>
        </div>
      </nav>

      <!-- User info + logout -->
      <div class="sidebar-footer">
        <div class="user-info" @click="showUserMenu = !showUserMenu">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-meta">
            <div class="user-name">{{ user?.display_name || user?.username || 'User' }}</div>
            <div class="user-role">{{ user?.email || '' }}</div>
          </div>
          <span class="user-arrow">⋯</span>
        </div>
        <div v-if="showUserMenu" class="user-menu">
          <div class="user-menu-item" @click="showUserMenu=false">Settings</div>
          <div class="user-menu-divider"></div>
          <div class="user-menu-item danger" @click="handleLogout">Sign out</div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-wrap">
      <!-- Topbar -->
      <header class="topbar">
        <div class="breadcrumb">
          <span class="bc-parent">{{ currentParent }}</span>
          <span v-if="currentChild" class="bc-sep">/</span>
          <span v-if="currentChild" class="bc-current">{{ currentChild }}</span>
        </div>
        <div class="topbar-right">
          <div class="notif-btn">🔔<span class="notif-badge">3</span></div>
          <div class="topbar-divider"></div>
          <div class="topbar-user">
            <div class="topbar-avatar">{{ userInitial }}</div>
            {{ user?.display_name || user?.username }}
          </div>
        </div>
      </header>

      <main class="content-area">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component"/>
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>

  <!-- Global Notification -->
  <Teleport to="body">
    <div v-if="notification" :class="['notif', `notif-${notification.type}`]">
      {{ notification.type === 'success' ? '✓' : notification.type === 'error' ? '✗' : 'ℹ' }}
      {{ notification.msg }}
    </div>
  </Teleport>
</template>

<script setup>
import {ref, computed, provide} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuth} from '@/api/auth'

const router = useRouter()
const route = useRoute()
const {user, isLoggedIn, logout} = useAuth()

const isLoginPage = computed(() => route.path === '/login')
const isLandingPage = computed(() => route.path === '/')
const expandedKey = ref('accounts')
const showUserMenu = ref(false)

const userInitial = computed(() => {
  const name = user.value?.display_name || user.value?.username || '?'
  return name.charAt(0).toUpperCase()
})

const navItems = [
  {key: 'dashboard', icon: '📊', label: 'Data Center', path: '/dashboard'},
  {
    key: 'accounts', icon: '👤', label: 'Account Management',
    children: [
      {label: 'Account List', path: '/accounts'},
      {label: 'Account Groups', path: '/accounts/groups'},
    ]
  },
  {key: 'videos', icon: '☁️', label: 'Cloud Video Library', path: '/videos'},
  {key: 'publish', icon: '📋', label: 'Publish List', path: '/publish'},
  /*  { key: 'comments', icon: '💬', label: 'Comment Management', path: '/comments' },*/
  {key: 'resources', icon: '🗂️', label: 'Resource Management', path: '/resources'},
]

const isNavActive = (item) => {
  if (item.path) return route.path === item.path
  if (item.children) return item.children.some(c => route.path.startsWith(c.path))
  return false
}

const handleNavClick = (item) => {
  showUserMenu.value = false
  if (item.path) {
    router.push(item.path);
    return
  }
  if (item.children) expandedKey.value = expandedKey.value === item.key ? null : item.key
}

const currentParent = computed(() => {
  if (route.path.startsWith('/accounts')) return 'Account Management'
  return route.meta.title || ''
})

const currentChild = computed(() => {
  if (route.path === '/accounts') return 'Account List'
  if (route.path === '/accounts/groups') return 'Account Groups'
  return null
})

const handleLogout = () => {
  logout()
  showUserMenu.value = false
  router.push('/login')
  showNotif('Signed out', 'info')
}

// Global notification
const notification = ref(null)
let notifTimer = null

const showNotif = (msg, type = 'success') => {
  notification.value = {msg, type}
  if (notifTimer) clearTimeout(notifTimer)
  notifTimer = setTimeout(() => {
    notification.value = null
  }, 2800)
}

provide('showNotif', showNotif)
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: var(--nav-width);
  background: #fff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 20px 12px;
}

.logo-text {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.5px;
}

.logo-badge {
  background: linear-gradient(135deg, #00BFA5, #0097A7);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.logo-bar {
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), #80DEEA);
  border-radius: 2px;
  margin: 0 20px 12px;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  transition: all 0.15s;
  user-select: none;
}

.nav-item:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.nav-item.active {
  background: var(--primary-light);
  color: var(--primary);
  border-left-color: var(--primary);
  font-weight: 600;
}

.nav-icon {
  font-size: 16px;
}

.nav-label {
  flex: 1;
}

.nav-arrow {
  font-size: 10px;
  opacity: 0.6;
}

.nav-children {
  background: #fafcfd;
}

.nav-child {
  display: block;
  padding: 8px 18px 8px 46px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.15s;
}

.nav-child:hover {
  color: var(--primary);
  background: var(--primary-light);
}

.nav-child.active {
  color: var(--primary);
  font-weight: 600;
  background: #edf8f6;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 4px;
  border-radius: var(--radius);
  transition: background 0.15s;
}

.user-info:hover {
  background: var(--bg);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #0097A7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-arrow {
  color: var(--text-muted);
  font-size: 16px;
  flex-shrink: 0;
}

.user-menu {
  position: absolute;
  bottom: calc(100% - 8px);
  left: 12px;
  right: 12px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  padding: 6px;
  z-index: 100;
  animation: fadeIn 0.15s ease;
}

.user-menu-item {
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.1s;
}

.user-menu-item:hover {
  background: var(--bg);
}

.user-menu-item.danger {
  color: var(--danger);
}

.user-menu-item.danger:hover {
  background: #fff1f0;
}

.user-menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 0;
}

.main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: var(--topbar-height);
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  flex-shrink: 0;
  justify-content: space-between;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bc-parent {
  font-size: 13px;
  color: var(--text-muted);
}

.bc-sep {
  color: var(--border);
}

.bc-current {
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notif-btn {
  position: relative;
  cursor: pointer;
  font-size: 18px;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.topbar-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #0097A7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}

.content-area {
  flex: 1;
  overflow-y: auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
