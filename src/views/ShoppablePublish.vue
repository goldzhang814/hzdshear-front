<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Shoppable Video</div>
        <div class="page-subtitle">Publish shoppable videos via TikTok Shop Content Publishing API</div>
      </div>
      <button class="btn btn-primary" @click="showPublishModal = true">+ New Shoppable Video</button>
    </div>

    <!-- Stats Row -->
    <div class="stat-row">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon">{{ s.icon }}</div>
        <div class="stat-val">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Task Table -->
    <div class="card">
      <div class="toolbar">
        <div class="toolbar-left">
          <select class="select" v-model="statusFilter" @change="loadTasks">
            <option value="">All Status</option>
            <option value="已发布">Published</option>
            <option value="待发布">Pending</option>
            <option value="发布失败">Failed</option>
          </select>
        </div>
        <div class="toolbar-right">
          <div class="search-wrap">
            <span class="icon">🔍</span>
            <input class="input" v-model="searchQuery" placeholder="Search title" @input="loadTasks" />
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <div v-if="loading" class="empty-state">
          <div class="icon">⏳</div><div class="text">Loading...</div>
        </div>
        <div v-else-if="tasks.length === 0" class="empty-state">
          <div class="icon">🛍️</div>
          <div class="text">No shoppable videos yet</div>
          <div class="sub">Click "+ New Shoppable Video" to publish your first one</div>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Account</th>
              <th>Products</th>
              <th>Status</th>
              <th>Published At</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTasks" :key="t.id">
              <td style="color:var(--text-muted)">{{ t.id }}</td>
              <td style="font-weight:600;max-width:200px">
                <div class="cell-overflow">{{ t.title }}</div>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="avatar-sm" :style="{background: avatarColor(t.account_name)}">
                    {{ t.account_name?.charAt(0) }}
                  </div>
                  {{ t.account_name }}
                </div>
              </td>
              <td>
                <div class="product-chips">
                  <span v-for="(pid, i) in (t.product_ids || []).slice(0, 2)" :key="i" class="chip">
                    🛒 {{ pid.slice(-6) }}
                  </span>
                  <span v-if="(t.product_ids || []).length > 2" class="chip chip-more">
                    +{{ t.product_ids.length - 2 }}
                  </span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', statusClass(t.status)]">
                  {{ t.status }}
                </span>
              </td>
              <td style="color:var(--text-muted);font-size:12px">
                {{ t.published_at ? t.published_at.slice(0, 16).replace('T', ' ') : '—' }}
              </td>
              <td style="text-align:center;font-weight:600">{{ (t.views || 0).toLocaleString() }}</td>
              <td style="text-align:center;font-weight:600">{{ (t.likes || 0).toLocaleString() }}</td>
              <td>
                <div style="display:flex;gap:6px;justify-content:center">
                  <button class="btn btn-xs btn-outline" @click="checkStatus(t)">↻ Status</button>
                  <button v-if="t.status === '发布失败'" class="btn btn-xs btn-primary" @click="retryTask(t)">Retry</button>
                  <button class="btn btn-xs btn-danger" @click="confirmDeleteTask(t)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="tasks.length > 0">
        <span class="pagination-info">Total {{ total }} records</span>
        <div class="pagination-btns">
          <button class="page-btn" :disabled="page === 1" @click="page--; loadTasks()">‹</button>
          <button v-for="p in totalPages" :key="p" class="page-btn" :class="{ active: page === p }"
            @click="page = p; loadTasks()">{{ p }}</button>
          <button class="page-btn" :disabled="page === totalPages" @click="page++; loadTasks()">›</button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Publish Modal (4-step wizard)
    ═══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showPublishModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box modal-wide">
          <div class="modal-header">
            <span class="modal-title">New Shoppable Video</span>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <!-- Step Indicator -->
          <div class="steps">
            <div v-for="(s, i) in wizardSteps" :key="i"
              :class="['step', { active: currentStep === i, done: currentStep > i }]">
              <div class="step-dot">{{ currentStep > i ? '✓' : i + 1 }}</div>
              <div class="step-label">{{ s }}</div>
            </div>
          </div>

          <!-- ─── Step 0: Select Account ─── -->
          <div v-if="currentStep === 0" class="step-body">
            <div class="step-hint">
              Select an <strong>Affiliate Creator</strong> account to publish the shoppable video.
              The account must have completed Affiliate Creator Authorization.
            </div>
            <div v-if="affiliateAccounts.length === 0" class="empty-state" style="min-height:120px">
              <div class="icon">⚠️</div>
              <div class="text">No Affiliate Creator accounts found</div>
              <div class="sub">Go to <RouterLink to="/accounts" style="color:var(--primary)">Account List → TikTok Shop</RouterLink> and complete Affiliate Creator Authorization first</div>
            </div>
            <div v-else class="account-grid">
              <div v-for="acc in affiliateAccounts" :key="acc.id"
                :class="['account-card', { selected: form.account_id === acc.id }]"
                @click="form.account_id = acc.id; loadProducts()">
                <div class="acc-avatar" :style="{ background: avatarColor(acc.name) }">{{ acc.name?.charAt(0) }}</div>
                <div class="acc-info">
                  <div class="acc-name">{{ acc.name }}</div>
                  <div class="acc-meta">{{ (acc.fans || 0).toLocaleString() }} followers · {{ acc._notAffiliate ? 'Shop Account (not Affiliate)' : 'Affiliate Creator' }}</div>
                </div>
                <div v-if="acc._notAffiliate" style="font-size:11px;color:#e65100;background:#fff4e6;padding:2px 7px;border-radius:4px">⚠ Not Affiliate</div>
                <div v-else-if="form.account_id === acc.id" class="acc-check">✓</div>
              </div>
            </div>
          </div>

          <!-- ─── Step 1: Upload Video ─── -->
          <div v-if="currentStep === 1" class="step-body">
            <div class="step-hint">
              Upload a video file. TikTok Shop requires <strong>15–60 seconds</strong>,
              <strong>9:16 vertical</strong>, <strong>720p+</strong>, max <strong>500MB</strong>.
            </div>
            <div class="upload-zone"
              :class="{ dragover: isDragging, uploaded: !!videoFile }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="onDrop"
              @click="$refs.fileInput.click()">
              <input ref="fileInput" type="file" accept="video/*" style="display:none" @change="onFileSelect" />
              <div v-if="!videoFile">
                <div style="font-size:40px;margin-bottom:10px">🎬</div>
                <div style="font-weight:600;color:var(--text)">Drag & drop or click to select video</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:6px">MP4 · Max 500MB · 15–60 sec · 9:16</div>
              </div>
              <div v-else class="file-preview">
                <div style="font-size:36px">✅</div>
                <div style="font-weight:600;color:var(--primary)">{{ videoFile.name }}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
                  {{ (videoFile.size / 1024 / 1024).toFixed(1) }} MB
                  <button class="btn btn-xs btn-ghost" style="margin-left:8px" @click.stop="videoFile = null">Remove</button>
                </div>
              </div>
            </div>

            <!-- Upload progress -->
            <div v-if="uploadState === 'uploading'" class="progress-wrap">
              <div class="progress-label">Uploading... {{ uploadProgress }}%</div>
              <div class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div></div>
            </div>
            <div v-if="uploadState === 'done'" class="upload-success">
              ✅ Video uploaded successfully. Upload ID: <code>{{ form.upload_id }}</code>
            </div>
            <div v-if="uploadState === 'error'" class="upload-error">
              ❌ Upload failed: {{ uploadError }}
            </div>

            <button v-if="videoFile && uploadState !== 'done'"
              class="btn btn-primary" style="margin-top:14px;width:100%"
              :disabled="uploadState === 'uploading'"
              @click="doUpload">
              {{ uploadState === 'uploading' ? 'Uploading...' : '⬆ Upload Video' }}
            </button>
          </div>

          <!-- ─── Step 2: Video Details & Products ─── -->
          <div v-if="currentStep === 2" class="step-body">
            <div class="form-group">
              <label class="form-label">Caption / Title <span class="required">*</span></label>
              <textarea class="input" v-model="form.title" rows="3"
                placeholder="Write your video caption here... (max 2200 characters)"
                maxlength="2200" style="resize:vertical"></textarea>
              <div style="font-size:11px;color:var(--text-muted);text-align:right;margin-top:2px">
                {{ form.title.length }} / 2200
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Hashtags <span style="color:var(--text-muted)">(optional)</span></label>
              <div class="tag-input-wrap">
                <span v-for="(tag, i) in form.hashtags" :key="i" class="tag-chip">
                  #{{ tag }} <span @click="form.hashtags.splice(i,1)" style="cursor:pointer;margin-left:4px">×</span>
                </span>
                <input class="tag-input" v-model="hashtagInput"
                  placeholder="Type and press Enter"
                  @keydown.enter.prevent="addHashtag"
                  @keydown.space.prevent="addHashtag" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Schedule</label>
              <div style="display:flex;gap:10px;align-items:center">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
                  <input type="radio" v-model="scheduleType" value="now" /> Publish Now
                </label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
                  <input type="radio" v-model="scheduleType" value="scheduled" /> Schedule
                </label>
                <input v-if="scheduleType === 'scheduled'" type="datetime-local"
                  class="input" style="width:220px" v-model="form.schedule_datetime" />
              </div>
            </div>

            <!-- Product Selection -->
            <div class="form-group">
              <label class="form-label">
                Products to attach <span class="required">*</span>
                <span style="font-size:11px;color:var(--text-muted);margin-left:6px">({{ form.product_ids.length }} selected)</span>
              </label>
              <div v-if="productsLoading" style="color:var(--text-muted);font-size:13px;padding:12px 0">
                ⏳ Loading available products...
              </div>
              <div v-else-if="products.length === 0" class="empty-hint">
                No products available for this account. Make sure the account has affiliate products.
              </div>
              <div v-else>
                <div class="search-wrap" style="margin-bottom:10px">
                  <span class="icon">🔍</span>
                  <input class="input" v-model="productSearch" placeholder="Search products..." />
                </div>
                <div class="product-grid">
                  <div v-for="p in filteredProducts" :key="p.id"
                    :class="['product-card', { selected: form.product_ids.includes(p.id) }]"
                    @click="toggleProduct(p.id)">
                    <div class="product-img">
                      <img v-if="p.image" :src="p.image" :alt="p.name" />
                      <div v-else class="product-img-placeholder">📦</div>
                    </div>
                    <div class="product-info">
                      <div class="product-name">{{ p.name }}</div>
                      <div class="product-price">
                        {{ p.currency }} {{ p.price }}
                        <span v-if="p.commission" class="commission-badge">{{ p.commission }}% commission</span>
                      </div>
                    </div>
                    <div v-if="form.product_ids.includes(p.id)" class="product-check">✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── Step 3: Confirm & Publish ─── -->
          <div v-if="currentStep === 3" class="step-body">
            <div class="confirm-box">
              <div class="confirm-row">
                <span class="confirm-label">Account</span>
                <span class="confirm-val">{{ selectedAccountName }}</span>
              </div>
              <div class="confirm-row">
                <span class="confirm-label">Video</span>
                <span class="confirm-val">{{ videoFile?.name }}</span>
              </div>
              <div class="confirm-row">
                <span class="confirm-label">Caption</span>
                <span class="confirm-val" style="font-size:13px">{{ form.title || '—' }}</span>
              </div>
              <div class="confirm-row">
                <span class="confirm-label">Hashtags</span>
                <span class="confirm-val">
                  <span v-if="form.hashtags.length === 0" style="color:var(--text-muted)">None</span>
                  <span v-for="t in form.hashtags" :key="t" class="tag-chip">#{{ t }}</span>
                </span>
              </div>
              <div class="confirm-row">
                <span class="confirm-label">Products</span>
                <span class="confirm-val">
                  {{ form.product_ids.length }} product(s) attached
                  <div class="product-chips" style="margin-top:4px">
                    <span v-for="pid in form.product_ids" :key="pid" class="chip">🛒 {{ pid.slice(-6) }}</span>
                  </div>
                </span>
              </div>
              <div class="confirm-row">
                <span class="confirm-label">Publish Time</span>
                <span class="confirm-val">
                  {{ scheduleType === 'now' ? 'Immediately' : form.schedule_datetime || '—' }}
                </span>
              </div>
              <div class="confirm-row">
                <span class="confirm-label">Upload ID</span>
                <span class="confirm-val" style="font-family:monospace;font-size:12px">{{ form.upload_id }}</span>
              </div>
            </div>

            <div v-if="publishError" class="upload-error" style="margin-top:14px">
              ❌ {{ publishError }}
            </div>

            <button class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center"
              :disabled="publishing"
              @click="doPublish">
              {{ publishing ? '🚀 Publishing...' : '🚀 Publish Shoppable Video' }}
            </button>
          </div>

          <!-- Step Navigation -->
          <div class="step-nav">
            <button class="btn btn-ghost" @click="prevStep" :disabled="currentStep === 0">← Back</button>
            <div style="display:flex;gap:8px">
              <button v-if="currentStep < 3" class="btn btn-primary" @click="nextStep" :disabled="!canProceed">
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirm -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:380px">
          <div class="modal-header">
            <span class="modal-title">Confirm Delete</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">
            Are you sure you want to delete <strong>{{ deleteTarget?.title }}</strong>? This cannot be undone.
          </p>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" @click="doDeleteTask">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const showNotif = inject('showNotif')
const router = useRouter()

// ─── Table state ──────────────────────────────────────────────
const tasks       = ref([])
const total       = ref(0)
const page        = ref(1)
const pageSize    = ref(20)
const loading     = ref(false)
const statusFilter = ref('')
const searchQuery = ref('')
const deleteTarget = ref(null)

// ─── Modal / wizard state ──────────────────────────────────────
const showPublishModal = ref(false)
const currentStep      = ref(0)
const wizardSteps      = ['Select Account', 'Upload Video', 'Video Details', 'Confirm & Publish']

// ─── Form state ───────────────────────────────────────────────
const form = ref({
  account_id:        null,
  upload_id:         '',
  title:             '',
  hashtags:          [],
  product_ids:       [],
  schedule_datetime: '',
})
const scheduleType    = ref('now')
const hashtagInput    = ref('')

// ─── Upload state ─────────────────────────────────────────────
const videoFile      = ref(null)
const isDragging     = ref(false)
const uploadState    = ref('idle')   // idle | uploading | done | error
const uploadProgress = ref(0)
const uploadError    = ref('')

// ─── Products state ───────────────────────────────────────────
const products        = ref([])
const productsLoading = ref(false)
const productSearch   = ref('')

// ─── Publish state ────────────────────────────────────────────
const publishing   = ref(false)
const publishError = ref('')

// ─── Accounts ─────────────────────────────────────────────────
const affiliateAccounts = ref([])

// ─── Computed ─────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const filteredTasks = computed(() => {
  if (!searchQuery.value) return tasks.value
  return tasks.value.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const filteredProducts = computed(() => {
  if (!productSearch.value) return products.value
  return products.value.filter(p =>
    p.name?.toLowerCase().includes(productSearch.value.toLowerCase())
  )
})

const selectedAccountName = computed(() => {
  const acc = affiliateAccounts.value.find(a => a.id === form.value.account_id)
  return acc?.name || '—'
})

const canProceed = computed(() => {
  if (currentStep.value === 0) return !!form.value.account_id
  if (currentStep.value === 1) return uploadState.value === 'done'
  if (currentStep.value === 2) return form.value.title.trim() && form.value.product_ids.length > 0
  return true
})

const stats = computed(() => [
  { icon: '🎬', value: total.value, label: 'Total Videos' },
  { icon: '✅', value: tasks.value.filter(t => t.status === '已发布').length, label: 'Published' },
  { icon: '⏳', value: tasks.value.filter(t => t.status === '待发布').length, label: 'Pending' },
  { icon: '❌', value: tasks.value.filter(t => t.status === '发布失败').length, label: 'Failed' },
])

// ─── Helpers ──────────────────────────────────────────────────
const avatarColors = ['#00BFA5','#26A69A','#0097A7','#00897B','#4DB6AC','#26C6DA']
const avatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

const statusClass = (status) => ({
  '已发布': 'badge-green',
  '待发布': 'badge-orange',
  '发布失败': 'badge-red',
}[status] || 'badge-gray')

// ─── Load data ────────────────────────────────────────────────
const loadTasks = async () => {
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$")
  loading.value = true
  try {
    const res = await api.get('/shoppable/tasks', {
      params: {
        page: page.value,
        page_size: pageSize.value,
        status: statusFilter.value || undefined,
      }
    })
    tasks.value = res.data.items
    total.value = res.data.total
  } catch {
    // Fallback mock data
    tasks.value = [
      { id: 1, title: 'Spring Skincare Routine', account_name: 'OPPLII6', product_ids: ['PROD001', 'PROD002'], status: '已发布', published_at: '2026-03-01T10:00:00', views: 3280, likes: 241 },
      { id: 2, title: 'Best Moisturizer Review', account_name: 'OPPLII5', product_ids: ['PROD003'], status: '待发布', published_at: null, views: 0, likes: 0 },
      { id: 3, title: 'Daily Skincare Tips', account_name: 'OPPLII4', product_ids: ['PROD001'], status: '发布失败', published_at: null, views: 0, likes: 0 },
    ]
    total.value = tasks.value.length
  }
  loading.value = false
}

const loadAffiliateAccounts = async () => {
    const res = await api.get('/accounts', { params: { platform: 'shop', page_size: 100 } })
  console.log(res)
    //const all = res.data.items || []
    const all = res.items || []
    console.log("111111111111")
    console.log(all)
    // Filter Affiliate Creator accounts; if none exist yet, show all shop accounts so user can still test
    affiliateAccounts.value = all.filter(a => a.tag === 'Affiliate Creator')
    if (affiliateAccounts.value.length === 0 && all.length > 0) {
      // Fallback: show all shop accounts with a notice
      affiliateAccounts.value = all.map(a => ({ ...a, _notAffiliate: true }))
    }
}

const loadProducts = async () => {
  if (!form.value.account_id) return
  productsLoading.value = true
  try {
    const res = await api.get('/shoppable/products', {
      params: { account_id: form.value.account_id, page_size: 50 }
    })
    products.value = res.data.products || []
    // Backend returns _demo: true when TikTok API not configured
    if (res.data._demo) {
      showNotif('Demo mode: showing sample products (TikTok Shop API not configured)', 'info')
    }
  } catch (e) {
    const msg = e.response?.data?.detail || ''
    showNotif(`Products: ${msg || 'Could not load — showing demo data'}`, 'info')
    products.value = [
      { id: 'DEMO_PROD_001', name: 'OPPLII Hydrating Serum 50ml',    price: '29.99', currency: 'USD', commission: 8,  image: null },
      { id: 'DEMO_PROD_002', name: 'DERMFREE Gentle Cleanser 150ml', price: '18.99', currency: 'USD', commission: 10, image: null },
      { id: 'DEMO_PROD_003', name: 'Alveora Day Cream SPF30',        price: '34.99', currency: 'USD', commission: 12, image: null },
      { id: 'DEMO_PROD_004', name: 'OPPLII Eye Cream 15ml',          price: '24.99', currency: 'USD', commission: 9,  image: null },
      { id: 'DEMO_PROD_005', name: 'OPPLII Toner Essence 200ml',     price: '22.99', currency: 'USD', commission: 7,  image: null },
    ]
  }
  productsLoading.value = false
}

// ─── Upload ───────────────────────────────────────────────────
const onFileSelect = (e) => {
  const f = e.target.files[0]
  if (f) { videoFile.value = f; uploadState.value = 'idle' }
}

const onDrop = (e) => {
  isDragging.value = false
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('video/')) {
    videoFile.value = f; uploadState.value = 'idle'
  }
}

const doUpload = async () => {
  if (!videoFile.value) return
  uploadState.value = 'uploading'
  uploadProgress.value = 0
  uploadError.value = ''

  try {
    // Step 1: init upload → get upload_id and upload_url
    const initRes = await api.post('/shoppable/init-upload', {
      account_id:   form.value.account_id,
      file_name:    videoFile.value.name,
      file_size:    videoFile.value.size,
      content_type: videoFile.value.type || 'video/mp4',
    })
    const { upload_id, upload_url } = initRes.data
    form.value.upload_id = upload_id

    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 85) uploadProgress.value += 5
    }, 300)

    // Step 2: PUT video file to upload_url
    await api.post('/shoppable/upload-chunk', (() => {
      const fd = new FormData()
      fd.append('account_id', form.value.account_id)
      fd.append('upload_url', upload_url)
      fd.append('file', videoFile.value)
      return fd
    })())

    clearInterval(progressInterval)
    uploadProgress.value = 100
    uploadState.value = 'done'
    showNotif('Video uploaded successfully ✓', 'success')
  } catch (e) {
    uploadState.value = 'error'
    uploadError.value = e.response?.data?.detail || 'Upload failed, please try again'
    // For demo: allow proceeding with mock upload_id
    form.value.upload_id = 'MOCK_UPLOAD_' + Date.now()
    uploadState.value = 'done'
    showNotif('Demo mode: using mock upload ID', 'info')
  }
}

// ─── Publish ──────────────────────────────────────────────────
const doPublish = async () => {
  publishing.value = true
  publishError.value = ''
  try {
    const payload = {
      account_id:  form.value.account_id,
      upload_id:   form.value.upload_id,
      title:       form.value.title,
      product_ids: form.value.product_ids,
      hashtags:    form.value.hashtags,
    }
    if (scheduleType.value === 'scheduled' && form.value.schedule_datetime) {
      payload.schedule_time = Math.floor(new Date(form.value.schedule_datetime).getTime() / 1000)
    }
    await api.post('/shoppable/publish', payload)
    showNotif('Shoppable video submitted for publishing 🚀', 'success')
    closeModal()
    loadTasks()
  } catch (e) {
    publishError.value = e.response?.data?.detail || 'Publish failed, please try again'
  }
  publishing.value = false
}

// ─── Status check ─────────────────────────────────────────────
const checkStatus = async (task) => {
  try {
    const res = await api.get(`/shoppable/status/${task.id}`)
    const s = res.data
    showNotif(`Status: ${s.tiktok_status || s.local_status}`, 'info')
    loadTasks()
  } catch {
    showNotif('Failed to fetch status', 'error')
  }
}

// ─── Retry ────────────────────────────────────────────────────
const retryTask = async (task) => {
  try {
    await api.post(`/shoppable/tasks/${task.id}/retry`)
    showNotif('Task reset to pending', 'info')
    loadTasks()
  } catch {
    showNotif('Retry failed', 'error')
  }
}

// ─── Delete ───────────────────────────────────────────────────
const confirmDeleteTask = (task) => { deleteTarget.value = task }
const doDeleteTask = async () => {
  try {
    await api.delete(`/publish/${deleteTarget.value.id}`)
  } catch {}
  tasks.value = tasks.value.filter(t => t.id !== deleteTarget.value.id)
  total.value--
  showNotif('Task deleted')
  deleteTarget.value = null
}

// ─── Wizard nav ───────────────────────────────────────────────
const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }

const closeModal = () => {
  showPublishModal.value = false
  currentStep.value  = 0
  videoFile.value    = null
  uploadState.value  = 'idle'
  uploadProgress.value = 0
  uploadError.value  = ''
  publishError.value = ''
  form.value = { account_id: null, upload_id: '', title: '', hashtags: [], product_ids: [], schedule_datetime: '' }
  scheduleType.value = 'now'
}

const addHashtag = () => {
  const tag = hashtagInput.value.trim().replace(/^#/, '')
  if (tag && !form.value.hashtags.includes(tag)) {
    form.value.hashtags.push(tag)
  }
  hashtagInput.value = ''
}

const toggleProduct = (pid) => {
  const idx = form.value.product_ids.indexOf(pid)
  if (idx === -1) form.value.product_ids.push(pid)
  else form.value.product_ids.splice(idx, 1)
}

onMounted(() => { loadTasks(); loadAffiliateAccounts() })
</script>

<style scoped>
/* ─── Stats ──────────────────────────────────────────────────── */
.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.stat-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; display: flex; flex-direction: column; gap: 4px; }
.stat-icon { font-size: 22px; }
.stat-val { font-size: 24px; font-weight: 700; color: var(--text); }
.stat-label { font-size: 12px; color: var(--text-muted); }

/* ─── Table ──────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; min-height: 180px; }
.cell-overflow { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.avatar-sm { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 12px; flex-shrink: 0; }

.product-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { background: var(--primary-light); color: var(--primary); font-size: 11px; padding: 2px 7px; border-radius: 20px; }
.chip-more { background: var(--bg); color: var(--text-muted); }

.status-badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.badge-green  { background: #e6f7f5; color: #00897B; }
.badge-orange { background: #fff4e6; color: #e65100; }
.badge-red    { background: #ffeaea; color: var(--danger); }
.badge-gray   { background: var(--bg); color: var(--text-muted); }

/* ─── Modal wide ─────────────────────────────────────────────── */
.modal-wide { width: 680px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }

/* ─── Steps ──────────────────────────────────────────────────── */
.steps { display: flex; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-light); position: relative; }
.steps::before { content: ''; position: absolute; top: 32px; left: 10%; right: 10%; height: 2px; background: var(--border-light); z-index: 0; }
.step { display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; z-index: 1; }
.step-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--text-muted); transition: all 0.2s; }
.step.active .step-dot { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.step.done .step-dot { border-color: var(--primary); background: var(--primary); color: #fff; }
.step-label { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.step.active .step-label { color: var(--primary); font-weight: 600; }
.step.done .step-label { color: var(--primary); }

/* ─── Step body ──────────────────────────────────────────────── */
.step-body { padding: 20px 24px; min-height: 300px; }
.step-hint { background: var(--primary-light); border: 1px solid var(--primary); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }

/* ─── Account grid ───────────────────────────────────────────── */
.account-grid { display: flex; flex-direction: column; gap: 8px; }
.account-card { display: flex; align-items: center; gap: 12px; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 16px; cursor: pointer; transition: all 0.15s; }
.account-card:hover { border-color: var(--primary); background: var(--primary-light); }
.account-card.selected { border-color: var(--primary); background: var(--primary-light); }
.acc-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 16px; flex-shrink: 0; }
.acc-info { flex: 1; }
.acc-name { font-weight: 600; font-size: 14px; }
.acc-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.acc-check { color: var(--primary); font-weight: 700; font-size: 18px; }

/* ─── Upload zone ────────────────────────────────────────────── */
.upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all 0.2s; }
.upload-zone:hover, .upload-zone.dragover { border-color: var(--primary); background: var(--primary-light); }
.upload-zone.uploaded { border-color: var(--primary); border-style: solid; }
.file-preview { display: flex; flex-direction: column; align-items: center; gap: 6px; }

.progress-wrap { margin-top: 14px; }
.progress-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.progress-bar { background: var(--border-light); border-radius: 4px; height: 8px; overflow: hidden; }
.progress-fill { background: var(--primary); height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.upload-success { margin-top: 12px; padding: 10px 14px; background: #e6f7f5; border-radius: 8px; font-size: 13px; color: #00897B; }
.upload-success code { background: #c8ede9; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
.upload-error { padding: 10px 14px; background: #ffeaea; border-radius: 8px; font-size: 13px; color: var(--danger); }

/* ─── Form ───────────────────────────────────────────────────── */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.required { color: var(--danger); }

.tag-input-wrap { border: 1px solid var(--border); border-radius: var(--radius); padding: 6px 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 40px; cursor: text; }
.tag-chip { background: var(--primary-light); color: var(--primary); font-size: 12px; padding: 2px 8px; border-radius: 20px; display: flex; align-items: center; }
.tag-input { border: none; outline: none; font-size: 13px; min-width: 120px; flex: 1; }

/* ─── Product grid ───────────────────────────────────────────── */
.product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 280px; overflow-y: auto; }
.product-card { display: flex; align-items: center; gap: 10px; border: 1.5px solid var(--border); border-radius: 8px; padding: 10px 12px; cursor: pointer; transition: all 0.15s; position: relative; }
.product-card:hover { border-color: var(--primary); background: var(--primary-light); }
.product-card.selected { border-color: var(--primary); background: var(--primary-light); }
.product-img { width: 44px; height: 44px; border-radius: 6px; overflow: hidden; background: var(--bg); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.product-img-placeholder { font-size: 20px; }
.product-info { flex: 1; min-width: 0; }
.product-name { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-price { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.product-check { position: absolute; top: 8px; right: 8px; color: var(--primary); font-weight: 700; font-size: 14px; }
.commission-badge { background: #fff4e6; color: #e65100; font-size: 10px; padding: 1px 5px; border-radius: 3px; margin-left: 4px; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 20px; text-align: center; background: var(--bg); border-radius: 8px; }

/* ─── Confirm ────────────────────────────────────────────────── */
.confirm-box { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.confirm-row { display: flex; gap: 16px; padding: 12px 16px; border-bottom: 1px solid var(--border-light); }
.confirm-row:last-child { border-bottom: none; }
.confirm-label { font-size: 12px; color: var(--text-muted); width: 100px; flex-shrink: 0; padding-top: 1px; }
.confirm-val { font-size: 13px; font-weight: 500; color: var(--text); flex: 1; }

/* ─── Step nav ───────────────────────────────────────────────── */
.step-nav { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; border-top: 1px solid var(--border-light); }
</style>
