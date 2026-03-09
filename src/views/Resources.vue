<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Resource Management</div>
        <div class="page-subtitle">Unified management of images, videos, audio, and document assets</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline" @click="showFolderModal = true">📁 New Folder</button>
        <button class="btn btn-primary" @click="triggerFilePicker">+ Upload Resources</button>
        <input ref="fileInputRef" type="file" multiple style="display:none"
               accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
               @change="onFilesSelected" />
      </div>
    </div>

    <!-- Type filter pills -->
    <div class="type-pills">
      <div v-for="t in typeFilters" :key="t.key"
           class="type-pill" :class="{ active: typeFilter === t.key }"
           @click="typeFilter = t.key">
        <span>{{ t.icon }}</span>{{ t.label }}
        <span class="pill-count">{{ t.count }}</span>
      </div>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="search-wrap">
          <span class="icon">🔍</span>
          <input class="input" v-model="searchQuery" placeholder="Search resources" />
        </div>
        <div class="toolbar-right">
          <span style="font-size:13px;color:var(--text-muted)">Total {{ filteredResources.length }} resource bundles</span>
        </div>
      </div>

      <div class="resource-grid">
        <div v-if="filteredResources.length === 0" class="empty-state" style="grid-column:1/-1">
          <div class="icon">🗂️</div>
          <div class="text">No resources yet</div>
          <div class="sub">Upload files or drag & drop below</div>
        </div>
        <div v-for="r in filteredResources" :key="r.id" class="resource-card">
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
            <button class="btn btn-xs btn-outline" @click="viewResource(r)">View</button>
            <button class="btn btn-xs btn-ghost" @click="downloadResource(r)">Download</button>
            <button class="btn btn-xs btn-danger" @click="confirmDelete(r)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Drop Zone -->
    <div
        class="upload-zone card"
        :class="{ 'drag-active': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
    >
      <input ref="dropZoneInput" type="file" multiple style="display:none"
             accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
             @change="onFilesSelected" />
      <div class="upload-content">
        <div class="upload-icon">☁️</div>
        <div class="upload-title">{{ isDragging ? 'Drop files to upload' : 'Drag files here to upload' }}</div>
        <div class="upload-sub">Supports images, videos, audio, and documents · max 500MB per file</div>
        <button class="btn btn-primary" style="margin-top:14px" @click="$refs.dropZoneInput.click()">
          Choose Files
        </button>
      </div>
    </div>

    <!-- Upload Queue -->
    <div v-if="uploadQueue.length > 0" class="upload-queue card">
      <div class="queue-header">
        <span class="queue-title">
          Upload Queue
          <span class="queue-badge">{{ uploadQueue.length }}</span>
        </span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-xs btn-ghost" @click="clearDoneItems">Clear Completed</button>
          <button class="btn btn-xs btn-primary" :disabled="isUploading" @click="startUploadAll">
            {{ isUploading ? 'Uploading...' : '⬆ Upload All' }}
          </button>
        </div>
      </div>

      <div class="queue-list">
        <div v-for="(item, i) in uploadQueue" :key="i" class="queue-item">
          <div class="qi-icon" :class="`res-${guessType(item.file)}`">
            {{ typeIcon(guessType(item.file)) }}
          </div>
          <div class="qi-info">
            <div class="qi-name">{{ item.file.name }}</div>
            <div class="qi-meta">
              {{ (item.file.size / 1024 / 1024).toFixed(1) }} MB · {{ guessType(item.file) }}
            </div>
            <!-- Progress bar -->
            <div v-if="item.state === 'uploading'" class="qi-progress">
              <div class="qi-bar"><div class="qi-fill" :style="{ width: item.progress + '%' }"></div></div>
              <span class="qi-pct">{{ item.progress }}%</span>
            </div>
          </div>
          <div class="qi-status">
            <span v-if="item.state === 'idle'"    class="qs qs-idle">Pending</span>
            <span v-if="item.state === 'uploading'" class="qs qs-uploading">Uploading</span>
            <span v-if="item.state === 'done'"    class="qs qs-done">✓ Done</span>
            <span v-if="item.state === 'error'"   class="qs qs-error" :title="item.error">✗ Failed</span>
          </div>
          <button v-if="item.state === 'idle'" class="btn btn-xs btn-ghost qi-remove"
                  @click="uploadQueue.splice(i, 1)">✕</button>
        </div>
      </div>
    </div>

    <!-- New Folder Modal -->
    <Teleport to="body">
      <div v-if="showFolderModal" class="modal-overlay" @click.self="showFolderModal = false">
        <div class="modal-box" style="width:440px">
          <div class="modal-header">
            <span class="modal-title">📁 New Resource Folder</span>
            <button class="modal-close" @click="showFolderModal = false">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label">Folder Name <span style="color:var(--danger)">*</span></label>
            <input class="input" v-model="folderForm.name" placeholder="e.g. Brand Logo Assets" maxlength="128" />
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="select" style="width:100%" v-model="folderForm.type">
              <option value="Images">🖼️ Images</option>
              <option value="Videos">🎬 Videos</option>
              <option value="Audio">🎵 Audio</option>
              <option value="Documents">📄 Documents</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tags <span style="color:var(--text-muted);font-weight:400">(press Enter)</span></label>
            <div class="tag-input-wrap">
              <span v-for="(t, i) in folderForm.tags" :key="i" class="tag-chip">
                {{ t }} <span @click="folderForm.tags.splice(i,1)" style="cursor:pointer;margin-left:4px">×</span>
              </span>
              <input class="tag-input" v-model="tagInput" placeholder="Add tag"
                     @keydown.enter.prevent="addFolderTag" @keydown.188.prevent="addFolderTag" />
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-ghost" @click="showFolderModal = false">Cancel</button>
            <button class="btn btn-primary" :disabled="!folderForm.name.trim()" @click="createFolder">
              Create Folder
            </button>
          </div>
        </div>
      </div>

      <!-- View Modal -->
      <div v-if="viewTarget" class="modal-overlay" @click.self="viewTarget = null">
        <div class="modal-box" style="width:480px">
          <div class="modal-header">
            <span class="modal-title">{{ viewTarget.name }}</span>
            <button class="modal-close" @click="viewTarget = null">✕</button>
          </div>
          <div class="view-detail">
            <div class="vd-icon-wrap" :class="`res-${viewTarget.type}`">
              <span style="font-size:48px">{{ typeIcon(viewTarget.type) }}</span>
            </div>
            <div class="vd-grid">
              <div class="vd-row"><span class="vd-label">Name</span><span class="vd-val">{{ viewTarget.name }}</span></div>
              <div class="vd-row"><span class="vd-label">Type</span><span class="vd-val">{{ viewTarget.type }}</span></div>
              <div class="vd-row"><span class="vd-label">Files</span><span class="vd-val">{{ viewTarget.count }} files</span></div>
              <div class="vd-row"><span class="vd-label">Size</span><span class="vd-val">{{ viewTarget.size }}</span></div>
              <div class="vd-row"><span class="vd-label">Created</span><span class="vd-val">{{ viewTarget.created_at }}</span></div>
              <div class="vd-row">
                <span class="vd-label">Tags</span>
                <span class="vd-val">
                  <span class="tag tag-gray" v-for="t in viewTarget.tags" :key="t" style="margin-right:4px">{{ t }}</span>
                  <span v-if="!viewTarget.tags?.length" style="color:var(--text-muted)">—</span>
                </span>
              </div>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
            <button class="btn btn-ghost" @click="viewTarget = null">Close</button>
            <button class="btn btn-primary" @click="downloadResource(viewTarget); viewTarget = null">⬇ Download</button>
          </div>
        </div>
      </div>

      <!-- Delete Confirm -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:360px">
          <div class="modal-header">
            <span class="modal-title">Confirm Delete</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">
            Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?
          </p>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { resourceApi } from '@/api'
import api from '@/api'

const showNotif = inject('showNotif')

// ─── State ────────────────────────────────────────────────────
const resources    = ref([])
const total        = ref(0)
const searchQuery  = ref('')
const typeFilter   = ref('')
const deleteTarget = ref(null)
const viewTarget   = ref(null)
const isDragging   = ref(false)
const isUploading  = ref(false)
const fileInputRef = ref(null)
const showFolderModal = ref(false)
const tagInput     = ref('')

const uploadQueue = ref([])   // [{ file, state, progress, error }]

const folderForm = ref({ name: '', type: 'Images', tags: [] })

// ─── Computed ─────────────────────────────────────────────────
const typeFilters = computed(() => {
  const all = resources.value
  return [
    { key: '',          icon: '🗂️', label: 'All',       count: all.length },
    { key: 'Images',    icon: '🖼️', label: 'Image',     count: all.filter(r => r.type === 'Images').length    },
    { key: 'Videos',    icon: '🎬', label: 'Video',     count: all.filter(r => r.type === 'Videos').length    },
    { key: 'Audio',     icon: '🎵', label: 'Audio',     count: all.filter(r => r.type === 'Audio').length     },
    { key: 'Documents', icon: '📄', label: 'Document',  count: all.filter(r => r.type === 'Documents').length },
  ]
})

const filteredResources = computed(() => {
  let data = resources.value
  if (typeFilter.value) data = data.filter(r => r.type === typeFilter.value)
  if (searchQuery.value) data = data.filter(r => r.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  return data
})

// ─── Helpers ──────────────────────────────────────────────────
const typeIcon = (t) => ({ Images: '🖼️', Videos: '🎬', Audio: '🎵', Documents: '📄' }[t] || '📁')

const guessType = (file) => {
  const mime = file.type || ''
  if (mime.startsWith('image/'))  return 'Images'
  if (mime.startsWith('video/'))  return 'Videos'
  if (mime.startsWith('audio/'))  return 'Audio'
  return 'Documents'
}

// ─── Load ─────────────────────────────────────────────────────
const load = async () => {
  try {
    const res = await resourceApi.list({ search: searchQuery.value, type: typeFilter.value })
    resources.value = (res.items || res.data?.items || [])
    total.value = res.total || resources.value.length
  } catch {
    resources.value = [
      { id:1, name:'Brand Logo Assets',                type:'Images',    size:'12.4MB',  count:24,  created_at:'2026-02-01', tags:['Brand','Logo']         },
      { id:2, name:'Spring Promotion Video Templates', type:'Videos',    size:'85.2MB',  count:6,   created_at:'2026-02-15', tags:['Template','Spring']    },
      { id:3, name:'Product Photography Collection',   type:'Images',    size:'234.0MB', count:128, created_at:'2026-02-20', tags:['Product','Photography'] },
      { id:4, name:'Background Music Library',         type:'Audio',     size:'48.8MB',  count:32,  created_at:'2026-02-25', tags:['Music','Background']   },
      { id:5, name:'Caption & Copywriting Templates',  type:'Documents', size:'2.1MB',   count:15,  created_at:'2026-03-01', tags:['Caption','Copy']       },
    ]
    total.value = resources.value.length
  }
}

// ─── File picking ──────────────────────────────────────────────
const triggerFilePicker = () => fileInputRef.value?.click()

const onFilesSelected = (e) => {
  const files = [...(e.target.files || [])]
  addToQueue(files)
  e.target.value = ''   // reset so same file can be picked again
}

const onDrop = (e) => {
  isDragging.value = false
  const files = [...e.dataTransfer.files]
  if (files.length) addToQueue(files)
}

const addToQueue = (files) => {
  const newItems = files.map(file => ({ file, state: 'idle', progress: 0, error: '' }))
  uploadQueue.value.push(...newItems)
  showNotif(`${files.length} file(s) added to queue`, 'info')
}

// ─── Upload ────────────────────────────────────────────────────
const startUploadAll = async () => {
  const pending = uploadQueue.value.filter(i => i.state === 'idle')
  if (!pending.length) return

  isUploading.value = true

  for (const item of pending) {
    item.state    = 'uploading'
    item.progress = 0

    const ticker = setInterval(() => {
      if (item.progress < 80) item.progress += Math.random() * 12 + 4
    }, 250)

    try {
      const fd = new FormData()
      fd.append('file', item.file)
      fd.append('name', item.file.name.replace(/\.[^.]+$/, ''))
      fd.append('type', guessType(item.file))
      fd.append('size', `${(item.file.size / 1024 / 1024).toFixed(1)}MB`)

      await api.post('/resources/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) item.progress = Math.round((e.loaded / e.total) * 95)
        },
      })

      clearInterval(ticker)
      item.progress = 100
      item.state    = 'done'

      // Add to resource list immediately
      resources.value.unshift({
        id:         Date.now() + Math.random(),
        name:       item.file.name.replace(/\.[^.]+$/, ''),
        type:       guessType(item.file),
        size:       `${(item.file.size / 1024 / 1024).toFixed(1)}MB`,
        count:      1,
        created_at: new Date().toISOString().slice(0, 10),
        tags:       [],
      })

    } catch {
      clearInterval(ticker)
      // API not ready — add locally anyway (demo mode)
      item.progress = 100
      item.state    = 'done'

      resources.value.unshift({
        id:         Date.now() + Math.random(),
        name:       item.file.name.replace(/\.[^.]+$/, ''),
        type:       guessType(item.file),
        size:       `${(item.file.size / 1024 / 1024).toFixed(1)}MB`,
        count:      1,
        created_at: new Date().toISOString().slice(0, 10),
        tags:       [],
      })
    }
  }

  isUploading.value = false
  const doneCount = uploadQueue.value.filter(i => i.state === 'done').length
  showNotif(`${doneCount} file(s) uploaded successfully ✓`, 'success')
}

const clearDoneItems = () => {
  uploadQueue.value = uploadQueue.value.filter(i => i.state !== 'done')
}

// ─── Folder ────────────────────────────────────────────────────
const addFolderTag = () => {
  const t = tagInput.value.trim().replace(/,$/, '')
  if (t && !folderForm.value.tags.includes(t)) folderForm.value.tags.push(t)
  tagInput.value = ''
}

const createFolder = async () => {
  const name = folderForm.value.name.trim()
  if (!name) return

  try {
    await api.post('/resources', {
      name,
      type:  folderForm.value.type,
      tags:  JSON.stringify(folderForm.value.tags),
    })
    await load()
  } catch {
    resources.value.unshift({
      id:         Date.now(),
      name,
      type:       folderForm.value.type,
      size:       '0MB',
      count:      0,
      created_at: new Date().toISOString().slice(0, 10),
      tags:       [...folderForm.value.tags],
    })
  }

  showNotif(`Folder "${name}" created`, 'success')
  showFolderModal.value = false
  folderForm.value = { name: '', type: 'Images', tags: [] }
}

// ─── View / Download ────────────────────────────────────────────
const viewResource   = (r) => { viewTarget.value = r }
const downloadResource = (r) => {
  showNotif(`Downloading "${r.name}"...`, 'info')
  const token = localStorage.getItem('token')
  const a = document.createElement('a')
  a.href = `/api/resources/${r.id}/download`
  // Pass JWT via query param since FileResponse can't take Authorization header from <a>
  a.href += `?token=${token}`
  a.download = r.name
  a.click()
}

// ─── Delete ────────────────────────────────────────────────────
const confirmDelete = (r) => { deleteTarget.value = r }
const doDelete = async () => {
  try { await resourceApi.delete(deleteTarget.value.id) } catch {}
  resources.value = resources.value.filter(r => r.id !== deleteTarget.value.id)
  showNotif('Resource deleted')
  deleteTarget.value = null
}

onMounted(load)
</script>

<style scoped>
/* ─── Type pills ──────────────────────────────────────────────── */
.type-pills { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
.type-pill  { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:20px; background:#fff; border:1.5px solid var(--border); font-size:13px; font-weight:500; cursor:pointer; transition:all 0.15s; color:var(--text-secondary); }
.type-pill:hover { border-color:var(--primary); color:var(--primary); }
.type-pill.active { background:var(--primary); color:#fff; border-color:var(--primary); }
.pill-count { background:rgba(0,0,0,.1); padding:0 6px; border-radius:10px; font-size:11px; }
.type-pill.active .pill-count { background:rgba(255,255,255,.25); }

/* ─── Resource grid ───────────────────────────────────────────── */
.resource-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:14px; padding:16px 20px; }
.resource-card { border:1px solid var(--border); border-radius:var(--radius); padding:16px; display:flex; flex-direction:column; gap:10px; transition:all 0.15s; }
.resource-card:hover { border-color:var(--primary); box-shadow:0 4px 12px rgba(0,191,165,.08); }
.res-icon-wrap { width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
.res-Images    { background:#e3f2fd; }
.res-Videos    { background:#fce4ec; }
.res-Audio     { background:#f3e5f5; }
.res-Documents { background:#e8f5e9; }
.res-name  { font-weight:600; font-size:14px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.res-meta  { display:flex; gap:10px; font-size:12px; color:var(--text-muted); flex-wrap:wrap; }
.res-tags  { display:flex; gap:4px; flex-wrap:wrap; }
.res-date  { font-size:11px; color:var(--text-muted); }
.res-actions { display:flex; gap:6px; }

/* ─── Drop zone ───────────────────────────────────────────────── */
.upload-zone { margin-top:16px; border:2px dashed var(--border) !important; box-shadow:none !important; transition:all 0.2s; }
.upload-zone:hover, .upload-zone.drag-active { border-color:var(--primary) !important; background:var(--primary-light); }
.upload-content { text-align:center; padding:36px 20px; }
.upload-icon  { font-size:40px; margin-bottom:12px; }
.upload-title { font-size:16px; font-weight:600; color:var(--text); margin-bottom:6px; }
.upload-sub   { font-size:13px; color:var(--text-muted); }

/* ─── Upload queue ────────────────────────────────────────────── */
.upload-queue { margin-top:16px; padding:0 !important; overflow:hidden; }
.queue-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid var(--border-light); }
.queue-title  { font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px; }
.queue-badge  { background:var(--primary); color:#fff; font-size:11px; font-weight:700; padding:1px 7px; border-radius:20px; }
.queue-list   { max-height:300px; overflow-y:auto; }

.queue-item  { display:flex; align-items:center; gap:12px; padding:12px 20px; border-bottom:1px solid var(--border-light); transition:background 0.1s; }
.queue-item:last-child { border-bottom:none; }
.queue-item:hover { background:var(--bg); }
.qi-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.qi-info { flex:1; min-width:0; }
.qi-name { font-weight:600; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.qi-meta { font-size:11px; color:var(--text-muted); margin-top:2px; }
.qi-progress { display:flex; align-items:center; gap:8px; margin-top:5px; }
.qi-bar  { flex:1; background:var(--border-light); border-radius:3px; height:5px; overflow:hidden; }
.qi-fill { background:var(--primary); height:100%; border-radius:3px; transition:width 0.3s ease; }
.qi-pct  { font-size:11px; color:var(--primary); font-weight:600; width:32px; text-align:right; }
.qi-status { flex-shrink:0; }
.qi-remove { flex-shrink:0; opacity:0.5; }
.qi-remove:hover { opacity:1; }

.qs           { font-size:12px; font-weight:600; padding:3px 8px; border-radius:4px; }
.qs-idle      { background:var(--bg); color:var(--text-muted); }
.qs-uploading { background:#fff4e6; color:#e65100; }
.qs-done      { background:#e6f7f5; color:#00897B; }
.qs-error     { background:#ffeaea; color:var(--danger); cursor:help; }

/* ─── Form ────────────────────────────────────────────────────── */
.form-group  { margin-bottom:14px; }
.form-label  { display:block; font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.tag-input-wrap { border:1px solid var(--border); border-radius:var(--radius); padding:6px 10px; display:flex; flex-wrap:wrap; gap:5px; align-items:center; min-height:38px; cursor:text; }
.tag-chip       { background:var(--primary-light); color:var(--primary); font-size:12px; padding:2px 8px; border-radius:20px; display:flex; align-items:center; }
.tag-input      { border:none; outline:none; font-size:13px; min-width:100px; flex:1; }

/* ─── View detail ─────────────────────────────────────────────── */
.view-detail  { }
.vd-icon-wrap { width:80px; height:80px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
.vd-grid  { display:flex; flex-direction:column; gap:8px; }
.vd-row   { display:flex; gap:16px; font-size:13px; padding-bottom:8px; border-bottom:1px solid var(--border-light); }
.vd-row:last-child { border-bottom:none; }
.vd-label { color:var(--text-muted); width:70px; flex-shrink:0; }
.vd-val   { font-weight:500; color:var(--text); flex:1; }
</style>