<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Comment Management</div>
        <div class="page-subtitle">Manage comments across accounts and reply quickly</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline">Bulk Reply</button>
        <button class="btn btn-primary">Auto-reply Settings</button>
      </div>
    </div>

    <!-- Summary -->
    <div class="comment-stats">
      <div class="cstat-card card" v-for="s in cstats" :key="s.label">
        <div class="cstat-icon">{{ s.icon }}</div>
        <div class="cstat-value">{{ s.value }}</div>
        <div class="cstat-label">{{ s.label }}</div>
      </div>
    </div>

    <div class="card">
      <div class="toolbar">
        <div class="search-wrap">
          <span class="icon">🔍</span>
          <input class="input" v-model="searchQuery" placeholder="Search comments/users" @input="load" />
        </div>
        <select class="select" v-model="statusFilter" @change="load">
          <option value="">All statuses</option><option>Pending</option><option>Replied</option>
        </select>
        <select class="select" v-model="sentimentFilter" @change="load">
          <option value="">All sentiments</option><option>Positive</option><option>Neutral</option><option>Negative</option>
        </select>
        <div class="toolbar-right">
          <span style="font-size:13px;color:var(--text-muted)">Total {{ total }} comments</span>
        </div>
      </div>

      <div class="comment-list">
        <div v-if="comments.length === 0" class="empty-state">
          <div class="icon">💬</div><div class="text">No comments yet</div>
        </div>
        <div v-for="c in comments" :key="c.id" class="comment-item" :class="{ 'has-reply': c.reply }">
          <div class="comment-left">
            <div class="comment-avatar">{{ c.user.slice(1, 3) }}</div>
          </div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-user">{{ c.user }}</span>
              <span class="tag" :class="sentimentClass(c.sentiment)">{{ c.sentiment }}</span>
              <span :class="['tag', c.status==='Replied'?'tag-green':'tag-orange']">{{ c.status }}</span>
              <span style="margin-left:auto;font-size:12px;color:var(--text-muted)">{{ c.time }}</span>
            </div>
            <div class="comment-video">Video: {{ c.video }}  ·  Account: {{ c.account }}</div>
            <div class="comment-content">{{ c.content }}</div>
            <div v-if="c.reply" class="comment-reply">
              <span style="color:var(--primary);font-weight:600;margin-right:6px">Reply: </span>{{ c.reply }}
            </div>
            <div class="comment-footer">
              <span>❤️ {{ c.likes }}</span>
              <div style="display:flex;gap:8px;margin-left:auto">
                <button class="btn btn-xs btn-outline" v-if="!replyingId || replyingId !== c.id" @click="openReply(c)">
                  {{ c.status === 'Replied' ? 'Reply again' : 'Reply' }}
                </button>
                <button class="btn btn-xs btn-danger" @click="confirmDelete(c)">Delete</button>
              </div>
            </div>
            <!-- Reply input -->
            <div v-if="replyingId === c.id" class="reply-box">
              <textarea class="input reply-input" v-model="replyContent" placeholder="Enter reply..." @keyup.ctrl.enter="submitReply(c)"></textarea>
              <div class="reply-actions">
                <span style="font-size:12px;color:var(--text-muted)">Ctrl+Enter to send</span>
                <button class="btn btn-ghost btn-sm" @click="replyingId = null">Cancel</button>
                <button class="btn btn-primary btn-sm" @click="submitReply(c)" :disabled="!replyContent.trim()">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <span class="pagination-info">Total {{ total }}</span>
        <div class="pagination-btns">
          <button class="page-btn" v-for="p in Math.ceil(total/20)||1" :key="p" :class="{active:page===p}" @click="page=p;load()">{{ p }}</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-box" style="width:360px">
          <div class="modal-header">
            <span class="modal-title">Confirm delete comment</span>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">Are you sure you want to delete this comment?</p>
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
import { commentApi } from '@/api'

const showNotif = inject('showNotif')
const comments = ref([])
const total = ref(0)
const page = ref(1)
const searchQuery = ref('')
const statusFilter = ref('')
const sentimentFilter = ref('')
const replyingId = ref(null)
const replyContent = ref('')
const deleteTarget = ref(null)

const mockComments = [
  {id:1,account:'OPPLII Texture Lab',video:'Spring Skincare Guide',user:'@beauty_lover',content:'This product works great! My skin feels super smooth.',time:'2026-03-01 13:20:00',likes:12,status:'Pending',sentiment:'Positive'},
  {id:2,account:'OPPLII Texture Lab',video:'Spring Skincare Guide',user:'@skincarefreak',content:'Is this suitable for oily skin?',time:'2026-03-01 14:05:00',likes:3,status:'Replied',sentiment:'Neutral',reply:'Hi! This product works for oily skin too. It focuses on oil control and hydration, so it is a great fit.'},
  {id:3,account:'OPPLII Softening Lab',video:'OPPLII New Launch',user:'@naturalbeauty',content:'The price is a bit high, but the quality is good.',time:'2026-03-01 15:30:00',likes:8,status:'Pending',sentiment:'Neutral'},
  {id:4,account:'Alveora-Texture',video:'Alveora Brand Story',user:'@skinlover99',content:'The ingredients are excellent! Highly recommended for sensitive skin.',time:'2026-03-02 17:10:00',likes:25,status:'Replied',sentiment:'Positive',reply:'Thanks for your support! We designed this for sensitive skin and hope it helps.'},
  {id:5,account:'OPPLII5',video:'Winter Hydration Tips',user:'@dryskingirl',content:'After a week I did not see much effect. A bit disappointed.',time:'2026-03-04 09:00:00',likes:2,status:'Pending',sentiment:'Negative'},
]

const cstats = computed(() => [
  { icon: '💬', value: total.value, label: 'Total comments' },
  { icon: '⏳', value: comments.value.filter(c=>c.status==='Pending').length, label: 'Pending' },
  { icon: '✅', value: comments.value.filter(c=>c.status==='Replied').length, label: 'Replied' },
  { icon: '😊', value: comments.value.filter(c=>c.sentiment==='Positive').length, label: 'Positive comments' },
  { icon: '😞', value: comments.value.filter(c=>c.sentiment==='Negative').length, label: 'Negative comments' },
])

const sentimentClass = (s) => ({Positive:'tag-green',Neutral:'tag-gray',Negative:'tag-red'}[s])

const load = async () => {
  try {
    const res = await commentApi.list({ search: searchQuery.value, status: statusFilter.value, sentiment: sentimentFilter.value, page: page.value })
    comments.value = res.items; total.value = res.total
  } catch {
    let data = [...mockComments]
    if (statusFilter.value) data = data.filter(c => c.status === statusFilter.value)
    if (sentimentFilter.value) data = data.filter(c => c.sentiment === sentimentFilter.value)
    if (searchQuery.value) data = data.filter(c => c.content.includes(searchQuery.value) || c.user.includes(searchQuery.value))
    comments.value = data; total.value = data.length
  }
}

const openReply = (c) => { replyingId.value = c.id; replyContent.value = '' }

const submitReply = async (c) => {
  if (!replyContent.value.trim()) return
  try { await commentApi.reply(c.id, replyContent.value) } catch {}
  c.reply = replyContent.value; c.status = 'Replied'
  showNotif('Reply sent'); replyingId.value = null; replyContent.value = ''
}

const confirmDelete = (c) => { deleteTarget.value = c }
const doDelete = async () => {
  try { await commentApi.delete(deleteTarget.value.id) } catch {}
  comments.value = comments.value.filter(c => c.id !== deleteTarget.value.id)
  showNotif('Comment deleted'); deleteTarget.value = null
}

onMounted(load)
</script>

<style scoped>
.comment-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 16px; }
.cstat-card { padding: 16px 20px; text-align: center; transition: transform 0.15s; }
.cstat-card:hover { transform: translateY(-2px); }
.cstat-icon { font-size: 22px; margin-bottom: 6px; }
.cstat-value { font-size: 22px; font-weight: 700; color: var(--text); }
.cstat-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.comment-list { padding: 8px 20px; }
.comment-item { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--border-light); }
.comment-item:last-child { border-bottom: none; }
.comment-left { flex-shrink: 0; }
.comment-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #0097A7); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; }
.comment-body { flex: 1; }
.comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.comment-user { font-weight: 600; font-size: 14px; color: var(--text); }
.comment-video { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.comment-content { font-size: 14px; color: var(--text); line-height: 1.6; margin-bottom: 8px; }
.comment-reply { background: var(--primary-light); border-left: 3px solid var(--primary); padding: 8px 12px; border-radius: 0 var(--radius) var(--radius) 0; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.comment-footer { display: flex; align-items: center; font-size: 13px; color: var(--text-muted); gap: 12px; }
.reply-box { margin-top: 10px; }
.reply-input { width: 100%; min-height: 70px; resize: vertical; display: block; font-family: inherit; }
.reply-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; justify-content: flex-end; }
</style>


