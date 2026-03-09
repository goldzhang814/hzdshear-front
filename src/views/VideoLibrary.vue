<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Video Library</div>
        <div class="page-subtitle">Manage all video assets across accounts</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline" @click="viewMode = viewMode === 'grid' ? 'list' : 'grid'">
          {{ viewMode === 'grid' ? '📋 List View' : '⊞ Grid View' }}
        </button>
        <button class="btn btn-primary" @click="showUploadModal = true">+ Upload Video</button>
      </div>
    </div>

    <!-- Summary bar -->
    <div class="summary-bar card">
      <div class="sum-item" v-for="s in summary" :key="s.label">
        <span class="sum-icon">{{ s.icon }}</span>
        <div>
          <div class="sum-value">{{ s.value }}</div>
          <div class="sum-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <span class="icon">🔍</span>
          <input class="input" v-model="searchQuery" placeholder="Search video title" @input="loadVideos" />
        </div>
        <select class="select" v-model="statusFilter" @change="loadVideos">
          <option value="">All statuses</option>
          <option>Uploaded</option>
          <option>Processing</option>
          <option>Failed</option>
        </select>
        <div class="toolbar-right">
          <span style="font-size:13px;color:var(--text-muted)">Total {{ total }} videos</span>
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="video-grid">
        <div v-if="loading" class="empty-state">
          <div class="icon">⏳</div><div class="text">Loading...</div>
        </div>
        <div v-else-if="videos.length === 0" class="empty-state">
          <div class="icon">🎬</div>
          <div class="text">No videos yet</div>
          <div class="sub">Click "+ Upload Video" to add your first video</div>
        </div>
        <template v-else>
          <div v-for="v in videos" :key="v.id" class="video-card">
            <div class="video-thumb" :class="`thumb-${v.id % 5}`">
              <img v-if="v.thumbnail" :src="v.thumbnail" class="thumb-img" />
              <div class="thumb-overlay">
                <div class="thumb-duration">{{ formatDuration(v.duration) }}</div>
                <span :class="['status-badge', statusClass(v.status)]">{{ v.status }}</span>
              </div>
              <div class="thumb-play">▶</div>
            </div>
            <div class="video-info">
              <div class="video-title" :title="v.title">{{ v.title }}</div>
              <div class="video-meta">
                <span>{{ v.account }}</span>
                <span>{{ v.size }}</span>
              </div>
              <div class="video-meta" style="margin-top:2px">
                <span>👁 {{ v.views.toLocaleString() }}</span>
                <span>{{ v.created_at.slice(0,10) }}</span>
              </div>
              <div class="video-tags">
                <span class="tag tag-gray" v-for="t in v.tags" :key="t">{{ t }}</span>
              </div>
            </div>
            <div class="video-actions">
              <button class="btn btn-xs btn-outline" @click="openPublishModal(v)">Publish</button>
              <button class="btn btn-xs btn-ghost" @click="openDetailModal(v)">Details</button>
              <button class="btn btn-xs btn-danger" @click="confirmDelete(v)">Delete</button>
            </div>
          </div>
        </template>
      </div>

      <!-- List View -->
      <div v-else class="table-wrap">
        <div v-if="loading" class="empty-state">
          <div class="icon">⏳</div><div class="text">Loading...</div>
        </div>
        <div v-else-if="videos.length === 0" class="empty-state">
          <div class="icon">🎬</div>
          <div class="text">No videos yet</div>
          <div class="sub">Click "+ Upload Video" to add your first video</div>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Title</th><th>Account</th>
              <th>Duration</th><th>Size</th><th>Status</th>
              <th>Views</th><th>Upload Time</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in videos" :key="v.id">
              <td style="color:var(--text-muted)">{{ v.id }}</td>
              <td>
                <div style="font-weight:600">{{ v.title }}</div>
                <div style="display:flex;gap:4px;margin-top:3px">
                  <span class="tag tag-gray" v-for="t in v.tags" :key="t">{{ t }}</span>
                </div>
              </td>
              <td>{{ v.account }}</td>
              <td>{{ formatDuration(v.duration) }}</td>
              <td>{{ v.size }}</td>
              <td><span :class="['tag', statusClass(v.status)]">{{ v.status }}</span></td>
              <td>{{ v.views.toLocaleString() }}</td>
              <td style="color:var(--text-muted);font-size:12px">{{ v.created_at }}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-xs btn-outline" @click="openPublishModal(v)">Publish</button>
                  <button class="btn btn-xs btn-ghost" @click="openDetailModal(v)">Details</button>
                  <button class="btn btn-xs btn-danger" @click="confirmDelete(v)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="total > 0">
        <span class="pagination-info">{{ total }} records</span>
        <div class="pagination-btns">
          <button class="page-btn" :disabled="page===1" @click="page--;loadVideos()">‹</button>
          <button class="page-btn" v-for="p in totalPages" :key="p" :class="{active:page===p}" @click="page=p;loadVideos()">{{ p }}</button>
          <button class="page-btn" :disabled="page===totalPages" @click="page++;loadVideos()">›</button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         Upload Modal
    ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
        <div class="modal-box modal-upload">
          <div class="modal-header">
            <span class="modal-title">Upload Video</span>
            <button class="modal-close" @click="closeUploadModal">✕</button>
          </div>

          <div class="upload-body">
            <!-- Left: Drop zone + progress -->
            <div class="upload-left">
              <div
                class="drop-zone"
                :class="{ dragover: isDragging, 'has-file': !!uploadFile }"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDrop"
                @click="$refs.fileInput.click()"
              >
                <input ref="fileInput" type="file" accept="video/*" style="display:none" @change="onFileSelect" />

                <div v-if="!uploadFile" class="dz-empty">
                  <div class="dz-icon">🎬</div>
                  <div class="dz-title">Drag & drop your video here</div>
                  <div class="dz-sub">or click to select a file</div>
                  <div class="dz-formats">MP4 · MOV · AVI · MKV &nbsp;·&nbsp; Max 500MB</div>
                </div>

                <div v-else class="dz-preview">
                  <video
                    v-if="previewUrl"
                    :src="previewUrl"
                    class="video-preview"
                    controls
                    @loadedmetadata="onVideoMeta"
                  />
                  <div v-else style="font-size:48px">🎬</div>
                  <div class="dz-filename">{{ uploadFile.name }}</div>
                  <div class="dz-fileinfo">
                    {{ (uploadFile.size / 1024 / 1024).toFixed(1) }} MB
                    <span v-if="detectedDuration"> · {{ formatDuration(detectedDuration) }}</span>
                  </div>
                  <button class="btn btn-xs btn-ghost" style="margin-top:8px" @click.stop="clearFile">✕ Remove</button>
                </div>
              </div>

              <!-- Progress -->
              <div v-if="uploadState === 'uploading'" class="progress-wrap">
                <div class="progress-header">
                  <span>Uploading...</span><span>{{ uploadProgress }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
              </div>
              <div v-if="uploadState === 'done'"  class="upload-result success">✅ Uploaded successfully!</div>
              <div v-if="uploadState === 'error'" class="upload-result error">❌ {{ uploadError }}</div>
            </div>

            <!-- Right: Metadata -->
            <div class="upload-right">
              <div class="form-group">
                <label class="form-label">Video Title <span class="required">*</span></label>
                <input class="input" v-model="uploadForm.title" placeholder="Enter video title" maxlength="256" />
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="input" v-model="uploadForm.description" rows="3"
                  placeholder="Optional description..." style="resize:vertical" maxlength="2000" />
              </div>

              <div class="form-group">
                <label class="form-label">Assign to Account</label>
                <select class="select" style="width:100%" v-model="uploadForm.account_id">
                  <option value="">— No account (library only) —</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Tags <span style="color:var(--text-muted);font-weight:400">(press Enter)</span></label>
                <div class="tag-input-wrap">
                  <span v-for="(tag, i) in uploadForm.tags" :key="i" class="tag-chip">
                    {{ tag }}
                    <span @click="uploadForm.tags.splice(i,1)" style="cursor:pointer;margin-left:4px;opacity:.7">×</span>
                  </span>
                  <input
                    class="tag-input"
                    v-model="tagInput"
                    placeholder="e.g. Skincare"
                    @keydown.enter.prevent="addTag"
                    @keydown.188.prevent="addTag"
                  />
                </div>
              </div>

              <!-- File info -->
              <div v-if="uploadFile" class="file-summary">
                <div class="fs-row"><span class="fs-label">File</span><span class="fs-val">{{ uploadFile.name }}</span></div>
                <div class="fs-row"><span class="fs-label">Size</span><span class="fs-val">{{ (uploadFile.size/1024/1024).toFixed(1) }} MB</span></div>
                <div class="fs-row" v-if="detectedDuration"><span class="fs-label">Duration</span><span class="fs-val">{{ formatDuration(detectedDuration) }}</span></div>
                <div class="fs-row"><span class="fs-label">Type</span><span class="fs-val">{{ uploadFile.type || 'video/mp4' }}</span></div>
              </div>
            </div>
          </div>

          <div class="upload-footer">
            <button class="btn btn-ghost" @click="closeUploadModal">Cancel</button>
            <button
              class="btn btn-primary"
              :disabled="!uploadFile || !uploadForm.title.trim() || uploadState === 'uploading'"
              @click="doUpload"
            >
              {{ uploadState === 'uploading' ? `Uploading ${uploadProgress}%...` : '⬆ Upload' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Modal -->
      <div v-if="detailTarget" class="modal-overlay" @click.self="detailTarget = null">
        <div class="modal-box" style="width:480px">
          <div class="modal-header">
            <span class="modal-title">Video Details</span>
            <button class="modal-close" @click="detailTarget = null">✕</button>
          </div>
          <div class="detail-thumb" :class="`thumb-${detailTarget.id % 5}`">
            <div class="thumb-play" style="width:52px;height:52px;font-size:22px">▶</div>
            <div class="thumb-overlay">
              <div class="thumb-duration">{{ formatDuration(detailTarget.duration) }}</div>
              <span :class="['status-badge', statusClass(detailTarget.status)]">{{ detailTarget.status }}</span>
            </div>
          </div>
          <div class="detail-grid">
            <div class="di"><span class="di-label">Title</span><span class="di-val">{{ detailTarget.title }}</span></div>
            <div class="di"><span class="di-label">Account</span><span class="di-val">{{ detailTarget.account || '—' }}</span></div>
            <div class="di"><span class="di-label">Duration</span><span class="di-val">{{ formatDuration(detailTarget.duration) }}</span></div>
            <div class="di"><span class="di-label">File Size</span><span class="di-val">{{ detailTarget.size }}</span></div>
            <div class="di"><span class="di-label">Views</span><span class="di-val">{{ detailTarget.views.toLocaleString() }}</span></div>
            <div class="di"><span class="di-label">Status</span><span class="di-val" style="color:var(--primary)">{{ detailTarget.status }}</span></div>
            <div class="di" style="grid-column:span 2"><span class="di-label">Upload Time</span><span class="di-val">{{ detailTarget.created_at }}</span></div>
            <div class="di" style="grid-column:span 2">
              <span class="di-label">Tags</span>
              <span class="di-val">
                <span class="tag tag-gray" v-for="t in detailTarget.tags" :key="t" style="margin-right:4px">{{ t }}</span>
                <span v-if="!detailTarget.tags?.length" style="color:var(--text-muted)">—</span>
              </span>
            </div>
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
            Are you sure you want to delete <strong>{{ deleteTarget?.title }}</strong>? This cannot be undone.
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
import { videoApi } from '@/api'
import api from '@/api'

const showNotif = inject('showNotif')

// ─── Table state ──────────────────────────────────────────────
const videos       = ref([])
const total        = ref(0)
const page         = ref(1)
const loading      = ref(false)
const searchQuery  = ref('')
const statusFilter = ref('')
const viewMode     = ref('grid')
const deleteTarget = ref(null)
const detailTarget = ref(null)

// ─── Upload state ─────────────────────────────────────────────
const showUploadModal   = ref(false)
const uploadFile        = ref(null)
const previewUrl        = ref('')
const detectedDuration  = ref(0)
const isDragging        = ref(false)
const uploadState       = ref('idle')   // idle | uploading | done | error
const uploadProgress    = ref(0)
const uploadError       = ref('')
const tagInput          = ref('')
const accounts          = ref([])

const uploadForm = ref({
  title:       '',
  description: '',
  account_id:  '',
  tags:        [],
})

// ─── Computed ─────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(total.value / 20) || 1)

const summary = computed(() => [
  { icon: '🎬', value: total.value,                                                          label: 'Total videos'  },
  { icon: '✅', value: videos.value.filter(v => v.status === 'Uploaded').length,             label: 'Uploaded'      },
  { icon: '⏳', value: videos.value.filter(v => v.status === 'Processing').length,           label: 'Processing'    },
  { icon: '❌', value: videos.value.filter(v => v.status === 'Failed').length,               label: 'Upload failed' },
  { icon: '👁', value: videos.value.reduce((s, v) => s + v.views, 0).toLocaleString(),       label: 'Total views'   },
])

// ─── Helpers ──────────────────────────────────────────────────
const statusClass    = (s) => ({ 'Uploaded': 'tag-green', 'Processing': 'tag-blue', 'Failed': 'tag-red' }[s] || 'tag-gray')
const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// ─── Load ─────────────────────────────────────────────────────
const loadVideos = async () => {
  loading.value = true
  const res = await videoApi.list({ search: searchQuery.value, status: statusFilter.value, page: page.value })
  console.log(res)
  videos.value = res.items; total.value = res.total
/*  try {
    const res = await videoApi.list({ search: searchQuery.value, status: statusFilter.value, page: page.value })
    videos.value = res.items; total.value = res.total
  } catch {
    videos.value = [
      { id:1, title:'Spring Skincare Guide',     duration:62,  size:'24.5MB', status:'Uploaded',   account:'OPPLII Texture Lab',   created_at:'2026-03-01 10:00:00', views:3280, tags:['Skincare','Spring']     },
      { id:2, title:'OPPLII New Product Launch', duration:45,  size:'18.2MB', status:'Uploaded',   account:'OPPLII Softening Lab', created_at:'2026-03-01 11:30:00', views:1540, tags:['New Product','Launch']   },
      { id:3, title:'Sensitive Skin Care Tips',  duration:90,  size:'36.8MB', status:'Processing', account:'DERMFREE-CleanLab',    created_at:'2026-03-02 09:15:00', views:0,    tags:['Sensitive Skin','Care']   },
      { id:4, title:'Alveora Brand Story',       duration:120, size:'48.1MB', status:'Uploaded',   account:'Alveora-Texture',      created_at:'2026-03-02 14:00:00', views:892,  tags:['Brand','Story']          },
      { id:5, title:'Daily Skincare Routine',    duration:75,  size:'30.0MB', status:'Failed',     account:'OPPLII6',              created_at:'2026-03-03 08:00:00', views:0,    tags:['Daily','Skincare']        },
      { id:6, title:'Winter Moisturizing Tips',  duration:55,  size:'22.0MB', status:'Uploaded',   account:'OPPLII5',              created_at:'2026-03-03 16:00:00', views:2100, tags:['Winter','Moisture']       },
    ]
    total.value = videos.value.length
  }*/
  loading.value = false
}

const loadAccounts = async () => {
  try {
    const res = await api.get('/accounts', { params: { page_size: 100 } })
    accounts.value = res.data.items || []
  } catch {
    accounts.value = [
      { id:1, name:'OPPLII Texture Lab' },
      { id:2, name:'OPPLII Softening Lab' },
      { id:3, name:'DERMFREE-CleanLab' },
      { id:4, name:'Alveora-Texture' },
    ]
  }
}

// ─── File handling ────────────────────────────────────────────
const onFileSelect = (e) => { const f = e.target.files[0]; if (f) setFile(f) }
const onDrop       = (e) => {
  isDragging.value = false
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('video/')) setFile(f)
  else showNotif('Please select a video file', 'error')
}

const setFile = (f) => {
  uploadFile.value     = f
  uploadState.value    = 'idle'
  uploadError.value    = ''
  uploadProgress.value = 0
  // Auto-fill title from filename
  if (!uploadForm.value.title)
    uploadForm.value.title = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  // Preview
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(f)
}

const clearFile = () => {
  uploadFile.value     = null
  uploadState.value    = 'idle'
  detectedDuration.value = 0
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = '' }
}

const onVideoMeta = (e) => { detectedDuration.value = Math.round(e.target.duration || 0) }

// ─── Upload ───────────────────────────────────────────────────
const doUpload = async () => {
  if (!uploadFile.value || !uploadForm.value.title.trim()) return
  uploadState.value    = 'uploading'
  uploadProgress.value = 0
  uploadError.value    = ''

  const ticker = setInterval(() => {
    if (uploadProgress.value < 85) uploadProgress.value += Math.random() * 8 + 3
  }, 300)

  try {
    const fd = new FormData()
    fd.append('file',        uploadFile.value)
    fd.append('title',       uploadForm.value.title.trim())
    fd.append('description', uploadForm.value.description || '')
    if (uploadForm.value.account_id) fd.append('account_id', uploadForm.value.account_id)
    if (uploadForm.value.tags.length) fd.append('tags', JSON.stringify(uploadForm.value.tags))
    if (detectedDuration.value) fd.append('duration', detectedDuration.value)

    await api.post('/videos/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) uploadProgress.value = Math.round((e.loaded / e.total) * 95)
      },
    })
    clearInterval(ticker)
    uploadProgress.value = 100
    uploadState.value    = 'done'
    showNotif('Video uploaded successfully ✓', 'success')
    setTimeout(() => { closeUploadModal(); loadVideos() }, 800)

  } catch {
    clearInterval(ticker)
    // Demo fallback — add to list locally
    videos.value.unshift({
      id:         Date.now(),
      title:      uploadForm.value.title.trim(),
      duration:   detectedDuration.value || 0,
      size:       `${(uploadFile.value.size / 1024 / 1024).toFixed(1)}MB`,
      status:     'Processing',
      account:    accounts.value.find(a => a.id == uploadForm.value.account_id)?.name || '—',
      created_at: new Date().toISOString().slice(0,19).replace('T',' '),
      views:      0,
      tags:       [...uploadForm.value.tags],
    })
    total.value++
    uploadProgress.value = 100
    uploadState.value    = 'done'
    showNotif('Video added to library', 'success')
    setTimeout(() => closeUploadModal(), 800)
  }
}

// ─── Modals ───────────────────────────────────────────────────
const closeUploadModal = () => {
  showUploadModal.value  = false
  uploadState.value      = 'idle'
  uploadProgress.value   = 0
  uploadError.value      = ''
  isDragging.value       = false
  tagInput.value         = ''
  clearFile()
  uploadForm.value = { title: '', description: '', account_id: '', tags: [] }
}

const openDetailModal  = (v) => { detailTarget.value = v }
const openPublishModal = (v) => { showNotif(`Publish "${v.title}" — coming soon`, 'info') }

const addTag = () => {
  const t = tagInput.value.trim().replace(/,$/, '')
  if (t && !uploadForm.value.tags.includes(t)) uploadForm.value.tags.push(t)
  tagInput.value = ''
}

// ─── Delete ───────────────────────────────────────────────────
const confirmDelete = (v) => { deleteTarget.value = v }
const doDelete = async () => {
  try { await videoApi.delete(deleteTarget.value.id) } catch {}
  videos.value = videos.value.filter(v => v.id !== deleteTarget.value.id)
  total.value--
  showNotif('Video deleted')
  deleteTarget.value = null
}

onMounted(() => { loadVideos(); loadAccounts() })
</script>

<style scoped>
/* ─── Summary bar ─────────────────────────────────────────────── */
.summary-bar { display:flex; align-items:center; padding:0; margin-bottom:16px; overflow:hidden; }
.sum-item { flex:1; display:flex; align-items:center; gap:12px; padding:16px 20px; border-right:1px solid var(--border-light); }
.sum-item:last-child { border-right:none; }
.sum-icon  { font-size:24px; }
.sum-value { font-size:20px; font-weight:700; color:var(--text); }
.sum-label { font-size:12px; color:var(--text-muted); }

/* ─── Grid ────────────────────────────────────────────────────── */
.video-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:16px; padding:16px 20px; }
.video-card { border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; transition:all 0.15s; }
.video-card:hover { border-color:var(--primary); box-shadow:0 4px 12px rgba(0,191,165,.1); transform:translateY(-2px); }

.video-thumb { height:120px; position:relative; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; }
.thumb-img   { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.thumb-0 { background:linear-gradient(135deg,#00BFA5,#26C6DA); }
.thumb-1 { background:linear-gradient(135deg,#FF6B35,#FFB300); }
.thumb-2 { background:linear-gradient(135deg,#7C4DFF,#E040FB); }
.thumb-3 { background:linear-gradient(135deg,#00897B,#43A047); }
.thumb-4 { background:linear-gradient(135deg,#1565C0,#0288D1); }
.thumb-overlay  { position:absolute; inset:0; display:flex; align-items:flex-end; justify-content:space-between; padding:8px; }
.thumb-duration { background:rgba(0,0,0,.6); color:#fff; font-size:11px; padding:2px 5px; border-radius:3px; }
.status-badge   { font-size:10px; font-weight:600; padding:2px 6px; border-radius:3px; }
.thumb-play     { width:40px; height:40px; background:rgba(255,255,255,.3); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px; position:relative; z-index:1; }
.video-info    { padding:10px 12px; }
.video-title   { font-weight:600; font-size:13px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; }
.video-meta    { display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); }
.video-tags    { display:flex; gap:4px; margin-top:6px; flex-wrap:wrap; }
.video-actions { display:flex; gap:6px; padding:8px 12px; border-top:1px solid var(--border-light); }

/* ─── Upload modal ────────────────────────────────────────────── */
/* Width and padding handled by global .modal-box.modal-upload */
.upload-body  { display:grid; grid-template-columns:1fr 1fr; min-height:380px; }
.upload-left  { padding:20px 20px 20px 24px; border-right:1px solid var(--border-light); display:flex; flex-direction:column; gap:12px; }
.upload-right { padding:20px 24px 20px 20px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; max-height:520px; }

.drop-zone {
  flex:1; border:2px dashed var(--border); border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all 0.2s; min-height:220px;
  text-align:center; padding:20px;
}
.drop-zone:hover, .drop-zone.dragover { border-color:var(--primary); background:var(--primary-light); }
.drop-zone.has-file { border-style:solid; border-color:var(--primary); }

.dz-empty   { display:flex; flex-direction:column; align-items:center; gap:8px; }
.dz-icon    { font-size:44px; }
.dz-title   { font-weight:600; font-size:15px; color:var(--text); }
.dz-sub     { font-size:13px; color:var(--text-muted); }
.dz-formats { font-size:11px; color:var(--text-muted); background:var(--bg); padding:4px 10px; border-radius:20px; margin-top:4px; }

.dz-preview   { display:flex; flex-direction:column; align-items:center; gap:6px; width:100%; }
.video-preview { width:100%; max-height:180px; border-radius:8px; background:#000; }
.dz-filename  { font-weight:600; font-size:13px; color:var(--text); word-break:break-all; text-align:center; }
.dz-fileinfo  { font-size:12px; color:var(--text-muted); }

.progress-wrap   { }
.progress-header { display:flex; justify-content:space-between; font-size:13px; color:var(--text-secondary); margin-bottom:6px; }
.progress-bar    { background:var(--border-light); border-radius:4px; height:8px; overflow:hidden; }
.progress-fill   { background:var(--primary); height:100%; border-radius:4px; transition:width 0.3s ease; }
.upload-result         { padding:10px 14px; border-radius:8px; font-size:13px; }
.upload-result.success { background:#e6f7f5; color:#00897B; }
.upload-result.error   { background:#ffeaea; color:var(--danger); }
.upload-footer { display:flex; justify-content:flex-end; gap:10px; padding:14px 20px; border-top:1px solid var(--border-light); }

/* ─── Form ────────────────────────────────────────────────────── */
.form-group  { margin-bottom:14px; }
.form-label  { display:block; font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.required    { color:var(--danger); }
.tag-input-wrap { border:1px solid var(--border); border-radius:var(--radius); padding:6px 10px; display:flex; flex-wrap:wrap; gap:5px; align-items:center; min-height:38px; cursor:text; }
.tag-chip       { background:var(--primary-light); color:var(--primary); font-size:12px; padding:2px 8px; border-radius:20px; display:flex; align-items:center; }
.tag-input      { border:none; outline:none; font-size:13px; min-width:100px; flex:1; }

.file-summary { background:var(--bg); border-radius:8px; padding:12px 14px; margin-top:4px; }
.fs-row { display:flex; gap:12px; padding:4px 0; font-size:13px; border-bottom:1px solid var(--border-light); }
.fs-row:last-child { border-bottom:none; }
.fs-label { color:var(--text-muted); width:68px; flex-shrink:0; }
.fs-val   { color:var(--text); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* ─── Detail modal ────────────────────────────────────────────── */
.detail-thumb { height:160px; border-radius:10px; position:relative; display:flex; align-items:center; justify-content:center; margin-bottom:16px; overflow:hidden; }
.detail-grid  { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.di       { background:var(--bg); border-radius:8px; padding:10px 14px; }
.di-label { font-size:11px; color:var(--text-muted); display:block; margin-bottom:3px; }
.di-val   { font-size:14px; font-weight:600; color:var(--text); }

.table-wrap { overflow-x:auto; min-height:180px; }
</style>
