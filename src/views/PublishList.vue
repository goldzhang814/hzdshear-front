<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Publish List</div>
        <div class="page-subtitle">Manage all publishing tasks</div>
      </div>
      <button class="btn btn-primary">+ New publish</button>
    </div>

    <!-- Status tabs -->
    <div class="status-tabs card" style="padding:0;margin-bottom:16px">
      <div style="display:flex">
        <div v-for="tab in statusTabs" :key="tab.key" class="status-tab" :class="{active: activeStatus === tab.key}" @click="activeStatus = tab.key; loadPublish()">
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="tab-count" :class="{active: activeStatus === tab.key}">{{ tab.count }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="search-wrap">
          <span class="icon">🔍</span>
          <input class="input" v-model="searchQuery" placeholder="Search title/account" @input="loadPublish" />
        </div>
        <select class="select" v-model="platformFilter" @change="loadPublish">
          <option value="">All platforms</option>
          <option>TikTok</option><option>TikTok Shop</option>
        </select>
        <div class="toolbar-right">
          <span v-if="selectedIds.length > 0" style="font-size:13px;color:var(--primary)">Selected {{ selectedIds.length }}</span>
          <button v-if="selectedIds.length > 0" class="btn btn-outline btn-sm" @click="batchDelete">Batch delete</button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" @change="toggleAll" :checked="isAllSelected" /></th>
              <th>ID</th><th>Video Title</th><th>Publisher Account</th>
              <th>Platform</th><th>Status</th><th>Publish Time</th>
              <th>Views</th><th>Likes</th><th>Comments</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in publishes" :key="p.id" :class="{selected: selectedIds.includes(p.id)}">
              <td><input type="checkbox" :checked="selectedIds.includes(p.id)" @change="toggleSelect(p.id)" /></td>
              <td style="color:var(--text-muted)">{{ p.id }}</td>
              <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.title }}</td>
              <td>{{ p.account }}</td>
              <td><span class="tag" :class="p.platform==='TikTok Shop'?'tag-orange':'tag-blue'">{{ p.platform }}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:6px">
                  <span :class="['status-dot', dotClass(p.status)]"></span>
                  <span :class="['tag', statusTagClass(p.status)]">{{ p.status }}</span>
                </div>
              </td>
              <td style="color:var(--text-muted);font-size:12px">{{ p.publish_time }}</td>
              <td>{{ p.views.toLocaleString() }}</td>
              <td>{{ p.likes }}</td>
              <td>{{ p.comments }}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button v-if="p.status==='Failed'" class="btn btn-xs btn-outline" @click="retry(p)">Retry</button>
                  <button class="btn btn-xs btn-ghost">Details</button>
                  <button class="btn btn-xs btn-danger" @click="confirmDelete(p)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span class="pagination-info">Total {{ total }}</span>
        <div class="pagination-btns">
          <button class="page-btn" v-for="p in totalPages" :key="p" :class="{active:page===p}" @click="page=p;loadPublish()">{{ p }}</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:360px">
          <div class="modal-header">
            <span class="modal-title">Confirm delete</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">Are you sure you want to delete the publish record for "{{ deleteTarget.title }}"?</p>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" @click="doDelete">Confirm delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { publishApi } from '@/api'

const showNotif = inject('showNotif')
const publishes = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const searchQuery = ref('')
const activeStatus = ref('')
const platformFilter = ref('')
const selectedIds = ref([])
const deleteTarget = ref(null)

const mockData = [
  {id:1,title:'Spring Skincare Guide',account:'OPPLII Texture Lab',platform:'TikTok',status:'Published',publish_time:'2026-03-01 12:00:00',views:3280,likes:241,comments:18},
  {id:2,title:'OPPLII New Launch',account:'OPPLII Softening Lab',platform:'TikTok',status:'Published',publish_time:'2026-03-01 14:00:00',views:1540,likes:98,comments:7},
  {id:3,title:'Sensitive Skin Care Tips',account:'DERMFREE-CleanLab',platform:'TikTok',status:'Pending',publish_time:'2026-03-05 10:00:00',views:0,likes:0,comments:0},
  {id:4,title:'Alveora Brand Story',account:'Alveora-Texture',platform:'TikTok',status:'Published',publish_time:'2026-03-02 16:00:00',views:892,likes:65,comments:12},
  {id:5,title:'Daily Skincare Routine',account:'OPPLII6',platform:'TikTok',status:'Failed',publish_time:'2026-03-03 09:00:00',views:0,likes:0,comments:0},
  {id:6,title:'Winter Hydration Tips',account:'OPPLII5',platform:'TikTok Shop',status:'Published',publish_time:'2026-03-03 18:00:00',views:2100,likes:180,comments:34},
]

const statusTabs = computed(() => [
  { key: '', label: 'All', count: publishes.value.length },
  { key: 'Published', label: 'Published', count: publishes.value.filter(p=>p.status==='Published').length },
  { key: 'Pending', label: 'Pending', count: publishes.value.filter(p=>p.status==='Pending').length },
  { key: 'Failed', label: 'Failed', count: publishes.value.filter(p=>p.status==='Failed').length },
])

const totalPages = computed(() => Math.ceil(total.value / 20) || 1)
const isAllSelected = computed(() => publishes.value.length > 0 && selectedIds.value.length === publishes.value.length)

const dotClass = (s) => ({Published:'dot-green',Pending:'dot-orange',Failed:'dot-red'}[s] || 'dot-gray')
const statusTagClass = (s) => ({Published:'tag-green',Pending:'tag-orange',Failed:'tag-red'}[s] || 'tag-gray')

const loadPublish = async () => {
  try {
    const res = await publishApi.list({ search: searchQuery.value, status: activeStatus.value, platform: platformFilter.value, page: page.value })
    publishes.value = res.items; total.value = res.total
  } catch {
    let data = [...mockData]
    if (activeStatus.value) data = data.filter(p => p.status === activeStatus.value)
    if (searchQuery.value) data = data.filter(p => p.title.includes(searchQuery.value) || p.account.includes(searchQuery.value))
    if (platformFilter.value) data = data.filter(p => p.platform === platformFilter.value)
    publishes.value = data; total.value = data.length
  }
}

const toggleAll = (e) => { selectedIds.value = e.target.checked ? publishes.value.map(p => p.id) : [] }
const toggleSelect = (id) => {
  if (selectedIds.value.includes(id)) selectedIds.value = selectedIds.value.filter(x => x !== id)
  else selectedIds.value.push(id)
}

const retry = async (p) => {
  try { await publishApi.retry(p.id) } catch {}
  p.status = 'Pending'; showNotif(`${p.title} re-queued for publishing`)
}

const confirmDelete = (p) => { deleteTarget.value = p }
const doDelete = async () => {
  try { await publishApi.delete(deleteTarget.value.id) } catch {}
  publishes.value = publishes.value.filter(p => p.id !== deleteTarget.value.id)
  showNotif('Publish record deleted'); deleteTarget.value = null
}

const batchDelete = () => {
  publishes.value = publishes.value.filter(p => !selectedIds.value.includes(p.id))
  showNotif(`Deleted ${selectedIds.value.length} records`); selectedIds.value = []
}

onMounted(loadPublish)
</script>

<style scoped>
.status-tabs { }
.status-tab { padding: 13px 20px; cursor: pointer; font-size: 14px; color: var(--text-muted); border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
.status-tab:hover { color: var(--primary); }
.status-tab.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.tab-count { background: var(--border-light); color: var(--text-muted); padding: 1px 6px; border-radius: 10px; font-size: 11px; }
.tab-count.active { background: var(--primary-light); color: var(--primary); }
.table-wrap { overflow-x: auto; }
tr.selected td { background: var(--primary-light) !important; }
</style>


