<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Resource Management</div>
        <div class="page-subtitle">Unified management of images, videos, audio, documents, and other assets</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline">📁 New folder</button>
        <button class="btn btn-primary">+ Upload resources</button>
      </div>
    </div>

    <!-- Type filter pills -->
    <div class="type-pills">
      <div v-for="t in typeFilters" :key="t.key" class="type-pill" :class="{active: typeFilter === t.key}" @click="typeFilter = t.key; load()">
        <span>{{ t.icon }}</span>{{ t.label }}
        <span class="pill-count">{{ t.count }}</span>
      </div>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="search-wrap">
          <span class="icon">🔍</span>
          <input class="input" v-model="searchQuery" placeholder="Search resources" @input="load" />
        </div>
        <div class="toolbar-right">
          <span style="font-size:13px;color:var(--text-muted)">Total {{ total }} resource bundles</span>
        </div>
      </div>

      <div class="resource-grid">
        <div v-if="resources.length === 0" class="empty-state">
          <div class="icon">🗂️</div><div class="text">No resources yet</div>
        </div>
        <div v-for="r in resources" :key="r.id" class="resource-card">
          <div class="res-icon-wrap" :class="`res-${r.type}`">
            <span class="res-icon">{{ typeIcon(r.type) }}</span>
          </div>
          <div class="res-info">
            <div class="res-name" :title="r.name">{{ r.name }}</div>
            <div class="res-meta">
              <span>{{ r.type }}</span>
              <span>{{ r.count }} files</span>
              <span>{{ r.size }}</span>
            </div>
            <div class="res-tags">
              <span class="tag tag-gray" v-for="t in r.tags" :key="t">{{ t }}</span>
            </div>
            <div class="res-date">{{ r.created_at }}</div>
          </div>
          <div class="res-actions">
            <button class="btn btn-xs btn-outline">View</button>
            <button class="btn btn-xs btn-ghost">Download</button>
            <button class="btn btn-xs btn-danger" @click="confirmDelete(r)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload zone -->
    <div class="upload-zone card" @dragover.prevent @drop.prevent="handleDrop">
      <div class="upload-content">
        <div class="upload-icon">☁️</div>
        <div class="upload-title">Drag files here to upload</div>
        <div class="upload-sub">Supports images, videos, audio, and documents; max 500MB per file</div>
        <button class="btn btn-primary" style="margin-top:14px">Choose files</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:360px">
          <div class="modal-header">
            <span class="modal-title">Confirm delete resource</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">Are you sure you want to delete the resource bundle "{{ deleteTarget.name }}"?</p>
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
import { resourceApi } from '@/api'

const showNotif = inject('showNotif')
const resources = ref([])
const total = ref(0)
const searchQuery = ref('')
const typeFilter = ref('')
const deleteTarget = ref(null)

const mockResources = [
  {id:1,name:'Brand Logo Asset Pack',type:'Image',size:'12.4MB',count:24,created_at:'2026-02-01',tags:['Brand','Logo']},
  {id:2,name:'Spring Promo Video Templates',type:'Video',size:'85.2MB',count:6,created_at:'2026-02-15',tags:['Template','Spring']},
  {id:3,name:'Product Photos Collection',type:'Image',size:'234.0MB',count:128,created_at:'2026-02-20',tags:['Product','Photography']},
  {id:4,name:'Background Music Library',type:'Audio',size:'48.8MB',count:32,created_at:'2026-02-25',tags:['Music','Background']},
  {id:5,name:'Caption Copy Templates',type:'Document',size:'2.1MB',count:15,created_at:'2026-03-01',tags:['Captions','Copy']},
]

const typeFilters = computed(() => [
  { key: '', icon: '🗂️', label: 'All', count: mockResources.length },
  { key: 'Image', icon: '🖼️', label: 'Image', count: mockResources.filter(r=>r.type==='Image').length },
  { key: 'Video', icon: '🎬', label: 'Video', count: mockResources.filter(r=>r.type==='Video').length },
  { key: 'Audio', icon: '🎵', label: 'Audio', count: mockResources.filter(r=>r.type==='Audio').length },
  { key: 'Document', icon: '📄', label: 'Document', count: mockResources.filter(r=>r.type==='Document').length },
])

const typeIcon = (t) => ({Image:'🖼️',Video:'🎬',Audio:'🎵',Document:'📄'}[t] || '📁')

const load = async () => {
  try {
    const res = await resourceApi.list({ search: searchQuery.value, type: typeFilter.value })
    resources.value = res.items; total.value = res.total
  } catch {
    let data = [...mockResources]
    if (typeFilter.value) data = data.filter(r => r.type === typeFilter.value)
    if (searchQuery.value) data = data.filter(r => r.name.includes(searchQuery.value))
    resources.value = data; total.value = data.length
  }
}

const confirmDelete = (r) => { deleteTarget.value = r }
const doDelete = async () => {
  try { await resourceApi.delete(deleteTarget.value.id) } catch {}
  resources.value = resources.value.filter(r => r.id !== deleteTarget.value.id)
  showNotif('Resource deleted'); deleteTarget.value = null
}

const handleDrop = (e) => {
  const files = [...e.dataTransfer.files]
  showNotif(`Received ${files.length} files, uploading soon...`)
}

onMounted(load)
</script>

<style scoped>
.type-pills { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.type-pill { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 20px; background: #fff; border: 1.5px solid var(--border); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; color: var(--text-secondary); }
.type-pill:hover { border-color: var(--primary); color: var(--primary); }
.type-pill.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.pill-count { background: rgba(0,0,0,0.1); padding: 0 6px; border-radius: 10px; font-size: 11px; }
.type-pill.active .pill-count { background: rgba(255,255,255,0.25); }

.resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; padding: 16px 20px; }
.resource-card { border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: all 0.15s; }
.resource-card:hover { border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,191,165,0.08); }
.res-icon-wrap { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.res-Image { background: #e3f2fd; }
.res-Video { background: #fce4ec; }
.res-Audio { background: #f3e5f5; }
.res-Document { background: #e8f5e9; }
.res-name { font-weight: 600; font-size: 14px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.res-meta { display: flex; gap: 10px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; }
.res-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.res-date { font-size: 11px; color: var(--text-muted); }
.res-actions { display: flex; gap: 6px; }

.upload-zone { margin-top: 16px; border: 2px dashed var(--border); box-shadow: none; transition: all 0.15s; }
.upload-zone:hover { border-color: var(--primary); background: var(--primary-light); }
.upload-content { text-align: center; padding: 36px 20px; }
.upload-icon { font-size: 40px; margin-bottom: 12px; }
.upload-title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.upload-sub { font-size: 13px; color: var(--text-muted); }
</style>



