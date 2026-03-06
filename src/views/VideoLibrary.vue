<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Cloud Video Library</div>
        <div class="page-subtitle">Manage video assets for all accounts</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline" @click="viewMode = viewMode === 'grid' ? 'list' : 'grid'">
          {{ viewMode === 'grid' ? '📋 List view' : '⊞ Grid view' }}
        </button>
        <button class="btn btn-primary">+ Upload video</button>
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
          <option>Uploaded</option><option>Processing</option><option>Failed</option>
        </select>
        <div class="toolbar-right">
          <span style="font-size:13px;color:var(--text-muted)">Total {{ total }} videos</span>
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="video-grid">
        <div v-if="loading" class="empty-state"><div class="icon">⏳</div><div class="text">Loading...</div></div>
        <template v-else>
          <div v-for="v in videos" :key="v.id" class="video-card">
            <div class="video-thumb" :class="`thumb-${v.id % 5}`">
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
              <button class="btn btn-xs btn-outline">Publish</button>
              <button class="btn btn-xs btn-ghost">Details</button>
              <button class="btn btn-xs btn-danger" @click="confirmDelete(v)">Delete</button>
            </div>
          </div>
        </template>
      </div>

      <!-- List View -->
      <div v-else>
        <table class="data-table">
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
                  <button class="btn btn-xs btn-outline">Publish</button>
                  <button class="btn btn-xs btn-danger" @click="confirmDelete(v)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="videos.length > 0">
        <span class="pagination-info">Total {{ total }}</span>
        <div class="pagination-btns">
          <button class="page-btn" v-for="p in totalPages" :key="p" :class="{active:page===p}" @click="page=p;loadVideos()">{{ p }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:360px">
          <div class="modal-header">
            <span class="modal-title">Confirm delete video</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">Are you sure you want to delete the video "{{ deleteTarget.title }}"?</p>
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
import { videoApi } from '@/api'

const showNotif = inject('showNotif')
const videos = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const viewMode = ref('grid')
const deleteTarget = ref(null)

const totalPages = computed(() => Math.ceil(total.value / 20) || 1)

const summary = computed(() => [
  { icon: '🎬', value: total.value, label: 'Total videos' },
  { icon: '✅', value: videos.value.filter(v => v.status === 'Uploaded').length, label: 'Uploaded' },
  { icon: '⏳', value: videos.value.filter(v => v.status === 'Processing').length, label: 'Processing' },
  { icon: '❌', value: videos.value.filter(v => v.status === 'Failed').length, label: 'Upload failed' },
  { icon: '👁', value: videos.value.reduce((s, v) => s + v.views, 0).toLocaleString(), label: 'Total views' },
])

const statusClass = (s) => ({ 'Uploaded': 'tag-green', 'Processing': 'tag-blue', 'Failed': 'tag-red' }[s] || 'tag-gray')
const formatDuration = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

const loadVideos = async () => {
  loading.value = true
  try {
    const res = await videoApi.list({ search: searchQuery.value, status: statusFilter.value, page: page.value })
    videos.value = res.items; total.value = res.total
  } catch {
    videos.value = [
      {id:1,title:'Spring Skincare Guide',duration:62,size:'24.5MB',status:'Uploaded',account:'OPPLII Texture Lab',created_at:'2026-03-01 10:00:00',views:3280,tags:['Skincare','Spring']},
      {id:2,title:'OPPLII New Launch',duration:45,size:'18.2MB',status:'Uploaded',account:'OPPLII Softening Lab',created_at:'2026-03-01 11:30:00',views:1540,tags:['New','Launch']},
      {id:3,title:'Sensitive Skin Care Tips',duration:90,size:'36.8MB',status:'Processing',account:'DERMFREE-CleanLab',created_at:'2026-03-02 09:15:00',views:0,tags:['Sensitive skin','Care']},
      {id:4,title:'Alveora Brand Story',duration:120,size:'48.1MB',status:'Uploaded',account:'Alveora-Texture',created_at:'2026-03-02 14:00:00',views:892,tags:['Brand','Story']},
      {id:5,title:'Daily Skincare Routine',duration:75,size:'30.0MB',status:'Failed',account:'OPPLII6',created_at:'2026-03-03 08:00:00',views:0,tags:['Daily','Skincare']},
      {id:6,title:'Winter Hydration Tips',duration:55,size:'22.0MB',status:'Uploaded',account:'OPPLII5',created_at:'2026-03-03 16:00:00',views:2100,tags:['Winter','Hydration']},
    ]
    total.value = videos.value.length
  }
  loading.value = false
}

const confirmDelete = (v) => { deleteTarget.value = v }
const doDelete = async () => {
  try { await videoApi.delete(deleteTarget.value.id) } catch {}
  videos.value = videos.value.filter(v => v.id !== deleteTarget.value.id)
  total.value--; showNotif('Video deleted'); deleteTarget.value = null
}

onMounted(loadVideos)
</script>

<style scoped>
.summary-bar { display: flex; align-items: center; gap: 0; padding: 0; margin-bottom: 16px; overflow: hidden; }
.sum-item { flex: 1; display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-right: 1px solid var(--border-light); }
.sum-item:last-child { border-right: none; }
.sum-icon { font-size: 24px; }
.sum-value { font-size: 20px; font-weight: 700; color: var(--text); }
.sum-label { font-size: 12px; color: var(--text-muted); }

.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; padding: 16px 20px; }

.video-card { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: all 0.15s; }
.video-card:hover { border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,191,165,0.1); transform: translateY(-2px); }

.video-thumb { height: 120px; position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.thumb-0 { background: linear-gradient(135deg, #00BFA5, #26C6DA); }
.thumb-1 { background: linear-gradient(135deg, #FF6B35, #FFB300); }
.thumb-2 { background: linear-gradient(135deg, #7C4DFF, #E040FB); }
.thumb-3 { background: linear-gradient(135deg, #00897B, #43A047); }
.thumb-4 { background: linear-gradient(135deg, #1565C0, #0288D1); }

.thumb-overlay { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: space-between; padding: 8px; }
.thumb-duration { background: rgba(0,0,0,0.6); color: #fff; font-size: 11px; padding: 2px 5px; border-radius: 3px; }
.status-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 3px; }
.thumb-play { width: 40px; height: 40px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; cursor: pointer; }
.video-info { padding: 10px 12px; }
.video-title { font-weight: 600; font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.video-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
.video-tags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.video-actions { display: flex; gap: 6px; padding: 8px 12px; border-top: 1px solid var(--border-light); }
</style>


