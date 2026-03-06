<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Account Groups</div>
        <div class="page-subtitle">Organize accounts for easier bulk operations</div>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">+ New group</button>
    </div>

    <div class="group-grid">
      <div v-for="g in groups" :key="g.id" class="group-card card">
        <div class="group-card-top">
          <div class="group-icon">📁</div>
          <div class="group-actions">
            <button class="btn btn-xs btn-ghost" @click="openEdit(g)">Edit</button>
            <button class="btn btn-xs btn-danger" @click="confirmDeleteGroup(g)">Delete</button>
          </div>
        </div>
        <div class="group-name">{{ g.name }}</div>
        <div class="group-meta">
          <span class="group-count">{{ g.account_count }} accounts</span>
          <span class="group-date">Created {{ g.created_at }}</span>
        </div>
        <div class="group-bar">
          <div class="group-bar-fill" :style="{ width: Math.min(g.account_count * 15, 100) + '%' }"></div>
        </div>
        <RouterLink to="/accounts" class="group-link">View accounts →</RouterLink>
      </div>

      <!-- Add new -->
      <div class="group-card group-add card" @click="showCreateModal = true">
        <div class="add-icon">+</div>
        <div class="add-label">New group</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="card group-stats">
      <div class="stat-row" v-for="g in groups" :key="g.id">
        <div class="stat-name">
          <span class="stat-dot"></span>{{ g.name }}
        </div>
        <div class="stat-bar-wrap">
          <div class="stat-bar">
            <div class="stat-bar-fill" :style="{ width: Math.min(g.account_count * 15, 100) + '%' }"></div>
          </div>
        </div>
        <div class="stat-count">{{ g.account_count }} accounts</div>
      </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-box" style="width:380px">
          <div class="modal-header">
            <span class="modal-title">{{ editTarget ? 'Edit group' : 'New group' }}</span>
            <button class="modal-close" @click="showCreateModal = false; editTarget = null">✕</button>
          </div>
          <div style="margin-bottom:16px">
            <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:6px">Group name</label>
            <input class="input" style="width:100%" v-model="groupName" placeholder="Enter group name" @keyup.enter="saveGroup" />
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost" @click="showCreateModal = false; editTarget = null">Cancel</button>
            <button class="btn btn-primary" @click="saveGroup" :disabled="!groupName.trim()">{{ editTarget ? 'Save' : 'Create' }}</button>
          </div>
        </div>
      </div>

      <!-- Delete confirm -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:360px">
          <div class="modal-header">
            <span class="modal-title">Confirm delete group</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">
            Are you sure you want to delete the group <strong>{{ deleteTarget.name }}</strong>? Accounts in the group will not be deleted.
          </p>
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
import { ref, onMounted, inject } from 'vue'
import { accountApi } from '@/api'

const showNotif = inject('showNotif')
const groups = ref([])
const showCreateModal = ref(false)
const groupName = ref('')
const editTarget = ref(null)
const deleteTarget = ref(null)

const load = async () => {
  try {
    const res = await accountApi.listGroups()
    groups.value = res.items
  } catch {
    groups.value = [
      {id:1,name:'Clock',account_count:2,created_at:'2026-01-10'},
      {id:2,name:'Mail',account_count:2,created_at:'2026-01-12'},
      {id:3,name:'Showcase Link',account_count:3,created_at:'2026-01-15'},
      {id:4,name:'Merchant',account_count:1,created_at:'2026-02-01'},
      {id:5,name:'Creator',account_count:1,created_at:'2026-02-01'},
    ]
  }
}

const openEdit = (g) => {
  editTarget.value = g; groupName.value = g.name; showCreateModal.value = true
}

const saveGroup = async () => {
  if (!groupName.value.trim()) return
  if (editTarget.value) {
    editTarget.value.name = groupName.value
    showNotif('Group updated')
  } else {
    try {
      const res = await accountApi.createGroup({ name: groupName.value })
      groups.value.push(res)
    } catch {
      groups.value.push({ id: Date.now(), name: groupName.value, account_count: 0, created_at: new Date().toISOString().slice(0,10) })
    }
    showNotif('Group created')
  }
  showCreateModal.value = false; editTarget.value = null; groupName.value = ''
}

const confirmDeleteGroup = (g) => { deleteTarget.value = g }
const doDelete = async () => {
  try { await accountApi.deleteGroup(deleteTarget.value.id) } catch {}
  groups.value = groups.value.filter(g => g.id !== deleteTarget.value.id)
  showNotif(`Group ${deleteTarget.value.name} deleted`)
  deleteTarget.value = null
}

onMounted(load)
</script>

<style scoped>
.group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
.group-card { padding: 20px; transition: transform 0.15s, box-shadow 0.15s; }
.group-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.group-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.group-icon { font-size: 28px; }
.group-actions { display: flex; gap: 6px; }
.group-name { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.group-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.group-bar { height: 4px; background: var(--border-light); border-radius: 2px; margin-bottom: 12px; overflow: hidden; }
.group-bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), #80DEEA); border-radius: 2px; transition: width 0.5s ease; }
.group-link { font-size: 12px; color: var(--primary); text-decoration: none; font-weight: 600; }
.group-link:hover { text-decoration: underline; }

.group-add { display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: 2px dashed var(--border); box-shadow: none; min-height: 160px; }
.group-add:hover { border-color: var(--primary); background: var(--primary-light); }
.add-icon { font-size: 32px; color: var(--text-muted); margin-bottom: 8px; }
.add-label { font-size: 14px; color: var(--text-muted); font-weight: 500; }

.group-stats { padding: 20px 24px; }
.stat-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
.stat-row:last-child { border-bottom: none; }
.stat-name { display: flex; align-items: center; gap: 8px; width: 100px; font-size: 13px; font-weight: 500; color: var(--text); flex-shrink: 0; }
.stat-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); }
.stat-bar-wrap { flex: 1; }
.stat-bar { height: 8px; background: var(--border-light); border-radius: 4px; overflow: hidden; }
.stat-bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), #80DEEA); border-radius: 4px; transition: width 0.5s ease; }
.stat-count { font-size: 13px; color: var(--text-muted); width: 70px; text-align: right; flex-shrink: 0; }
</style>


