<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Account List</div>
        <div class="page-subtitle">Manage all TikTok account authorizations</div>
      </div>
    </div>

    <div class="card">
      <!-- Platform Tabs -->
      <div class="platform-tabs">
        <div
          v-for="tab in platformTabs" :key="tab.key"
          class="platform-tab" :class="{ active: activePlatform === tab.key }"
          @click="switchPlatform(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.isNew" class="new-badge">New</span>
        </div>
      </div>
<!--      https://shop.tiktok.com/alliance/creator/auth?app_key=-->
      <!-- Toolbar -->
      <div class="toolbar">
<!--        <template v-if="activePlatform === 'tiktok'">
          <button class="btn btn-primary btn-sm" @click="showAuthModal = true">+ New Authorization</button>
          <button class="btn btn-primary btn-sm" @click="showAuthModal = true">+ Creator Authorization</button>
          <button class="btn btn-outline btn-sm" @click="showAuthModal = true">⇄ Share Authorization</button>
          <button class="btn btn-ghost btn-sm" @click="handleExport">↓ Export Data</button>
        </template>
        <template v-else>
          <button class="btn btn-primary btn-sm" @click="showShopModal = true">+ Shop Authorization</button>
        </template>-->
        <template v-if="activePlatform === 'shop'">
          <button class="btn btn-primary btn-sm" @click="showShopModal = true">+ Shop Authorization</button>
        </template>

        <div class="toolbar-right">
          <div class="search-wrap">
            <span class="icon">🔍</span>
            <input class="input" v-model="searchQuery" placeholder="Search account / ID" @input="loadAccounts" />
          </div>
          <select class="select" v-model="authFilter" @change="loadAccounts">
            <option value="">Auth Status</option>
            <option value="已授权">Authorized</option>
            <option value="已过期">Expired</option>
          </select>
          <select class="select" v-model="groupFilter" @change="loadAccounts">
            <option value="">All Groups</option>
            <option v-for="g in groups" :key="g.id" :value="g.name">{{ g.name }}</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <div v-if="loading" class="empty-state">
          <div class="icon">⏳</div><div class="text">Loading...</div>
        </div>
        <div v-else-if="accounts.length === 0" class="empty-state">
          <div class="icon">📭</div>
          <div class="text">No accounts found</div>
          <div class="sub">Click the button above to add an account</div>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" /></th>
              <th>ID</th><th>Avatar</th><th>Account</th><th>Bio</th>
              <th>Followers</th><th>Likes</th><th>Following</th>
              <th>Proxy</th><th>Auth Status</th><th>Group</th><th>Remark</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="acc in accounts" :key="acc.id" :class="{ selected: selectedIds.includes(acc.id) }">
              <td><input type="checkbox" :checked="selectedIds.includes(acc.id)" @change="toggleSelect(acc.id)" /></td>
              <td style="color:var(--text-muted)">{{ acc.id }}</td>
              <td>
                <div class="avatar" :style="{ background: avatarColor(acc.name) }">{{ acc.avatar }}</div>
              </td>
              <td>
                <div style="font-weight:600">{{ acc.name }}</div>
                <span class="tag tag-green" style="margin-top:3px">{{ acc.tag }}</span>
              </td>
              <td style="color:var(--text-muted)">{{ acc.intro || '-' }}</td>
              <td style="text-align:center;font-weight:600">{{ acc.fans.toLocaleString() }}</td>
              <td style="text-align:center;font-weight:600">{{ acc.likes.toLocaleString() }}</td>
              <td style="text-align:center">{{ acc.follows }}</td>
              <td style="text-align:center;color:var(--text-muted)">{{ acc.proxy || 'Not set' }}</td>
              <td>
                <div style="color:var(--primary);font-weight:600;font-size:13px">{{ authStatusLabel(acc.auth_status) }}</div>
                <div style="color:var(--text-muted);font-size:11px">Expires {{ acc.auth_expiry }}</div>
              </td>
              <td>
                <span v-if="acc.group" class="tag tag-gray">{{ acc.group }}</span>
              </td>
              <td style="text-align:center">
                <button style="border:none;background:none;cursor:pointer;color:var(--text-muted)" @click="openRemarkModal(acc)">📝</button>
              </td>
              <td>
                <div style="display:flex;gap:8px;justify-content:center">
                  <button class="btn btn-xs btn-outline" @click="viewAccount(acc)">View</button>
                  <button class="btn btn-xs btn-ghost" @click="openGroupModal(acc)">Group</button>
                  <button class="btn btn-xs btn-danger" @click="confirmDelete(acc)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="accounts.length > 0">
        <span class="pagination-info">Total {{ total }} records{{ selectedIds.length ? `, ${selectedIds.length} selected` : '' }}</span>
        <div class="pagination-btns">
          <button class="page-btn" :disabled="page === 1" @click="page--; loadAccounts()">‹</button>
          <button v-for="p in totalPages" :key="p" class="page-btn" :class="{ active: page === p }" @click="page = p; loadAccounts()">{{ p }}</button>
          <button class="page-btn" :disabled="page === totalPages" @click="page++; loadAccounts()">›</button>
        </div>
      </div>
    </div>

    <!-- Auth Modal -->
    <Teleport to="body">
      <div v-if="showAuthModal" class="modal-overlay" @click.self="showAuthModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <span class="modal-title">Add TikTok Account Authorization</span>
            <button class="modal-close" @click="showAuthModal = false">✕</button>
          </div>
          <div class="auth-options">
            <div v-for="opt in authOptions" :key="opt.title" class="auth-option" @click="handleAuth(opt)">
              <div class="auth-icon">{{ opt.icon }}</div>
              <div class="auth-title">{{ opt.title }}</div>
              <div class="auth-desc">{{ opt.desc }}</div>
              <button class="btn btn-primary btn-sm" style="width:100%;margin-top:10px;justify-content:center">Authorize Now</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Shop Auth Modal -->
      <div v-if="showShopModal" class="modal-overlay" @click.self="showShopModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <span class="modal-title">TikTok Shop Authorization</span>
            <button class="modal-close" @click="showShopModal = false">✕</button>
          </div>
          <div class="auth-options">
            <div class="auth-option" @click="handleShopAuth('merchant')">
              <div class="auth-icon">🛍️</div>
              <div class="auth-title">Merchant Authorization</div>
              <div class="auth-desc">Authorize your TikTok Shop merchant account</div>
              <button class="btn btn-primary btn-sm" style="width:100%;margin-top:10px;justify-content:center">Authorize Now</button>
            </div>
            <div class="auth-option" @click="handleShopAuth('creator')">
              <div class="auth-icon">👤</div>
              <div class="auth-title">Creator / Showcase Authorization</div>
              <div class="auth-desc">Authorize creator and showcase accounts</div>
              <button class="btn btn-primary btn-sm" style="width:100%;margin-top:10px;justify-content:center">Authorize Now</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:380px">
          <div class="modal-header">
            <span class="modal-title">Confirm Delete</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">
            Are you sure you want to delete account <strong>{{ deleteTarget?.name }}</strong>? This action cannot be undone.
          </p>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>

      <!-- Group Modal -->
      <div v-if="groupTarget" class="modal-overlay" @click.self="groupTarget = null">
        <div class="modal-box" style="width:360px">
          <div class="modal-header">
            <span class="modal-title">Set Group — {{ groupTarget.name }}</span>
            <button class="modal-close" @click="groupTarget = null">✕</button>
          </div>
          <div style="margin-bottom:16px">
            <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:6px">Select Group</label>
            <select class="select" style="width:100%" v-model="selectedGroup">
              <option value="">No Group</option>
              <option v-for="g in groups" :key="g.id" :value="g.name">{{ g.name }}</option>
            </select>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost" @click="groupTarget = null">Cancel</button>
            <button class="btn btn-primary" @click="saveGroup">Save</button>
          </div>
        </div>
      </div>

      <!-- View Account Modal -->
      <div v-if="viewTarget" class="modal-overlay" @click.self="viewTarget = null">
        <div class="modal-box" style="width:460px">
          <div class="modal-header">
            <span class="modal-title">Account Details</span>
            <button class="modal-close" @click="viewTarget = null">✕</button>
          </div>
          <div class="account-detail">
            <div class="detail-row">
              <div class="avatar" :style="{ background: avatarColor(viewTarget.name), width:'52px', height:'52px', fontSize:'16px' }">{{ viewTarget.avatar }}</div>
              <div>
                <div style="font-size:16px;font-weight:700">{{ viewTarget.name }}</div>
                <span class="tag tag-green">{{ viewTarget.tag }}</span>
              </div>
            </div>
            <div class="detail-grid">
              <div class="detail-item"><span class="di-label">ID</span><span class="di-value">{{ viewTarget.id }}</span></div>
              <div class="detail-item"><span class="di-label">Followers</span><span class="di-value">{{ viewTarget.fans }}</span></div>
              <div class="detail-item"><span class="di-label">Likes</span><span class="di-value">{{ viewTarget.likes }}</span></div>
              <div class="detail-item"><span class="di-label">Following</span><span class="di-value">{{ viewTarget.follows }}</span></div>
              <div class="detail-item"><span class="di-label">Group</span><span class="di-value">{{ viewTarget.group || '-' }}</span></div>
              <div class="detail-item"><span class="di-label">Auth Status</span><span class="di-value" style="color:var(--primary)">{{ authStatusLabel(viewTarget.auth_status) }}</span></div>
              <div class="detail-item" style="grid-column:span 2"><span class="di-label">Auth Expiry</span><span class="di-value">{{ viewTarget.auth_expiry }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { accountApi, authApi } from '@/api'

const showNotif = inject('showNotif')

const activePlatform = ref('shop')
const accounts = ref([])
const groups = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const searchQuery = ref('')
const authFilter = ref('')
const groupFilter = ref('')
const selectedIds = ref([])
const showAuthModal = ref(false)
const showShopModal = ref(false)
const deleteTarget = ref(null)
const groupTarget = ref(null)
const selectedGroup = ref('')
const viewTarget = ref(null)

const platformTabs = [
  // { key: 'tiktok', label: 'TikTok' },
  { key: 'shop',   label: 'TikTok Shop', isNew: true },
]

const authOptions = [
  { icon: '🔑', key: 'normal',     title: 'Standard Authorization', desc: 'Standard TikTok OAuth, suitable for personal accounts' },
  { icon: '⭐', key: 'creator',    title: 'Creator Authorization',  desc: 'For KOL / creator accounts with content data access' },
  { icon: '🔗', key: 'share',      title: 'Share Authorization',    desc: 'Invite account owner to authorize via a share link' },
  { icon: '🏪', key: 'enterprise', title: 'Enterprise Authorization',desc: 'For verified business accounts with extended permissions' },
]

// 将数据库中的中文状态值转为英文显示
const authStatusLabel = (status) => {
  const map = { '已授权': 'Authorized', '已过期': 'Expired', '待授权': 'Pending' }
  return map[status] || status
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
const isAllSelected = computed(() => accounts.value.length > 0 && selectedIds.value.length === accounts.value.length)

const avatarColors = ['#00BFA5','#26A69A','#4DB6AC','#00897B','#0097A7','#26C6DA']
const avatarColor = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length]

const switchPlatform = (p) => {
  activePlatform.value = p
  page.value = 1
  loadAccounts()
}

const loadAccounts = async () => {
  loading.value = true
  try {
    const res = await accountApi.list({
      platform: activePlatform.value,
      search: searchQuery.value || undefined,
      auth_status: authFilter.value || undefined,
      group: groupFilter.value || undefined,
      page: page.value,
      page_size: pageSize.value,
    })
    accounts.value = res.items
    total.value = res.total
  } catch {
    // fallback mock data
    const mock = [
      {id:70732,name:'Alveora-Texture',avatar:'AV',fans:1,likes:8,follows:0,proxy:null,auth_status:'已授权',auth_expiry:'2026-12-10 17:32:57',group:'Group A',tag:'Distribution',intro:''},
      {id:70729,name:'OPPLII Softening Lab',avatar:'OP',fans:8,likes:76,follows:0,proxy:null,auth_status:'已授权',auth_expiry:'2026-12-10 17:31:32',group:'Group A',tag:'Distribution',intro:''},
      {id:70725,name:'DERMFREE-CleanLab',avatar:'DF',fans:0,likes:3,follows:0,proxy:null,auth_status:'已授权',auth_expiry:'2026-12-10 17:28:18',group:'Group B',tag:'Distribution',intro:''},
      {id:70722,name:'OPPLII Texture Lab',avatar:'OP',fans:101,likes:916,follows:1,proxy:null,auth_status:'已授权',auth_expiry:'2026-12-10 17:25:43',group:'Group B',tag:'Distribution',intro:''},
      {id:67591,name:'OPPLII6',avatar:'O6',fans:12,likes:30,follows:1,proxy:null,auth_status:'已授权',auth_expiry:'2026-11-10 13:54:55',group:'Showcase',tag:'Distribution',intro:''},
      {id:67588,name:'OPPLII5',avatar:'O5',fans:4,likes:16,follows:0,proxy:null,auth_status:'已授权',auth_expiry:'2026-11-10 13:51:55',group:'Showcase',tag:'Distribution',intro:''},
      {id:67587,name:'OPPLII4',avatar:'O4',fans:5,likes:20,follows:2,proxy:null,auth_status:'已授权',auth_expiry:'2026-11-10 13:50:52',group:'Showcase',tag:'Distribution',intro:''},
    ]
    if (activePlatform.value === 'tiktok') {
      accounts.value = mock; total.value = mock.length
    } else {
      accounts.value = []; total.value = 0
    }
  }
  loading.value = false
}

const loadGroups = async () => {
  try {
    const res = await accountApi.listGroups()
    groups.value = res.items
  } catch {
    groups.value = [{id:1,name:'Group A'},{id:2,name:'Group B'},{id:3,name:'Showcase'}]
  }
}

const toggleSelectAll = (e) => {
  selectedIds.value = e.target.checked ? accounts.value.map(a => a.id) : []
}
const toggleSelect = (id) => {
  if (selectedIds.value.includes(id)) selectedIds.value = selectedIds.value.filter(x => x !== id)
  else selectedIds.value.push(id)
}

const viewAccount = (acc) => { viewTarget.value = acc }
const openGroupModal = (acc) => { groupTarget.value = acc; selectedGroup.value = acc.group || '' }
const openRemarkModal = (acc) => { showNotif(`Remark for account: ${acc.name}`, 'info') }
const confirmDelete = (acc) => { deleteTarget.value = acc }

const doDelete = async () => {
  try {
    await accountApi.delete(deleteTarget.value.id)
  } catch {}
  accounts.value = accounts.value.filter(a => a.id !== deleteTarget.value.id)
  total.value--
  showNotif(`Account "${deleteTarget.value.name}" deleted`)
  deleteTarget.value = null
}

const saveGroup = async () => {
  try {
    await accountApi.update(groupTarget.value.id, { group: selectedGroup.value })
  } catch {}
  const acc = accounts.value.find(a => a.id === groupTarget.value.id)
  if (acc) acc.group = selectedGroup.value
  showNotif('Group updated successfully')
  groupTarget.value = null
}

const handleAuth = async (opt) => {
  showAuthModal.value = false
  showNotif(`Preparing ${opt.title}, redirecting to TikTok...`)
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/oauth/authorize?auth_type=${opt.key}&token=${token}`)
    const data = await res.json()
    if (data.auth_url) {
      window.location.href = data.auth_url
    } else {
      showNotif(data.detail || 'Failed to initiate authorization', 'error')
    }
  } catch {
    showNotif('Network error, please try again', 'error')
  }
}

const handleShopAuth = async (type) => {
  showShopModal.value = false
  showNotif(`Preparing TikTok Shop ${type === 'merchant' ? 'Merchant' : 'Creator'} authorization...`)
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/oauth/authorize/shop?auth_type=${type}&token=${token}`)
    const data = await res.json()
    if (data.auth_url) {
      window.location.href = data.auth_url
    } else {
      showNotif(data.detail || 'Failed to initiate authorization', 'error')
    }
  } catch {
    showNotif('Network error, please try again', 'error')
  }
}

const handleExport = () => {
  const rows = [['ID','Account Name','Followers','Likes','Auth Status','Expiry']]
  accounts.value.forEach(a => rows.push([a.id, a.name, a.fans, a.likes, authStatusLabel(a.auth_status), a.auth_expiry]))
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'accounts.csv'; a.click()
  showNotif('Data exported successfully')
}

onMounted(() => {
  loadAccounts()
  loadGroups()

  // 处理 TikTok OAuth 回调结果
  const params = new URLSearchParams(window.location.search)
  const result   = params.get('auth_result')
  const account  = params.get('account')
  const platform = params.get('platform')
  const reason   = params.get('reason')

  if (result === 'success') {
    const label = platform === 'shop' ? 'TikTok Shop' : 'TikTok'
    showNotif(`${label} account "${account || ''}" authorized successfully ✓`, 'success')
    loadAccounts()
    window.history.replaceState({}, '', window.location.pathname)
  } else if (result === 'denied') {
    showNotif('Authorization was cancelled by the user', 'error')
    window.history.replaceState({}, '', window.location.pathname)
  } else if (result === 'error') {
    showNotif(`Authorization failed: ${reason || 'Unknown error'}`, 'error')
    window.history.replaceState({}, '', window.location.pathname)
  }
})
</script>

<style scoped>
.platform-tabs { display: flex; padding: 0 20px; border-bottom: 1px solid var(--border-light); }
.platform-tab { padding: 14px 0; margin-right: 28px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-muted); border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
.platform-tab:hover { color: var(--primary); }
.platform-tab.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.new-badge { background: #FF6B35; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 3px; }

.table-wrap { overflow-x: auto; min-height: 200px; }
tr.selected td { background: var(--primary-light) !important; }

.auth-options { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.auth-option { border: 1.5px solid var(--border); border-radius: 10px; padding: 18px; cursor: pointer; transition: all 0.15s; text-align: center; }
.auth-option:hover { border-color: var(--primary); background: var(--primary-light); }
.auth-icon { font-size: 28px; margin-bottom: 8px; }
.auth-title { font-weight: 600; font-size: 14px; color: var(--text); margin-bottom: 4px; }
.auth-desc { font-size: 12px; color: var(--text-muted); }

.account-detail { }
.detail-row { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { background: var(--bg); border-radius: var(--radius); padding: 10px 14px; }
.di-label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 3px; }
.di-value { font-size: 14px; font-weight: 600; color: var(--text); }
</style>
