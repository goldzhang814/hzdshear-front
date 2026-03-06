<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">Data Center</div>
        <div class="page-subtitle">Account operations overview</div>
      </div>
      <div style="font-size:13px;color:var(--text-muted)">📅 {{ today }}</div>
    </div>

    <!-- Stats Row -->
    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon">{{ s.icon }}</div>
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-change" :class="s.up ? 'change-up' : 'change-down'">
          {{ s.up ? '▲' : '▼' }} {{ s.change }}
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="chart-row">
      <!-- Bar chart -->
      <div class="card chart-card">
        <div class="chart-header">
          <span class="chart-title">Follower Growth This Week</span>
          <div class="chart-legend">
            <span class="legend-item"><span class="dot" style="background:#00BFA5"></span>Followers</span>
            <span class="legend-item"><span class="dot" style="background:#FF6B35"></span>Likes</span>
          </div>
        </div>
        <div class="chart-body">
          <div class="bar-chart">
            <div v-for="d in growthData" :key="d.day" class="bar-group">
              <div class="bars">
                <div class="bar bar-fans" :style="{ height: (d.fans / maxFans * 100) + '%' }" :title="`Followers:  ${d.fans}`"></div>
                <div class="bar bar-likes" :style="{ height: (d.likes / maxLikes * 100) + '%' }" :title="`Likes:  ${d.likes}`"></div>
              </div>
              <div class="bar-label">{{ d.day }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Donut chart -->
      <div class="card chart-card chart-card-sm">
        <div class="chart-header">
          <span class="chart-title">Platform Distribution</span>
        </div>
        <div class="chart-body donut-wrap">
          <svg viewBox="0 0 100 100" class="donut-svg">
            <circle cx="50" cy="50" r="35" fill="none" stroke="#e8edf2" stroke-width="14"/>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#00BFA5" stroke-width="14"
              stroke-dasharray="171.65 48.97"
              stroke-dashoffset="87.96"
              transform="rotate(-90 50 50)"/>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#FF6B35" stroke-width="14"
              stroke-dasharray="48.97 171.65"
              stroke-dashoffset="-83.69"
              transform="rotate(-90 50 50)"/>
          </svg>
          <div class="donut-center">
            <div class="donut-total">{{ totalAccounts }}</div>
            <div class="donut-label">Total Accounts</div>
          </div>
        </div>
        <div class="donut-legend">
          <div class="donut-legend-item">
            <span class="dot" style="background:#00BFA5"></span>
            <span>TikTok</span>
            <span class="donut-pct">78%</span>
          </div>
          <div class="donut-legend-item">
            <span class="dot" style="background:#FF6B35"></span>
            <span>TikTok Shop</span>
            <span class="donut-pct">22%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="bottom-row">
      <!-- Recent activity -->
      <div class="card activity-card">
        <div class="card-header">
          <span class="chart-title">Recent Activity</span>
          <span class="view-all">View all</span>
        </div>
        <div class="activity-list">
          <div v-for="act in activities" :key="act.time" class="activity-item">
            <div class="activity-dot" :class="actDotClass(act.type)"></div>
            <div class="activity-content">
              <div class="activity-text">{{ act.content }}</div>
              <div class="activity-time">{{ act.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="card quick-card">
        <div class="card-header">
          <span class="chart-title">Quick Actions</span>
        </div>
        <div class="quick-grid">
          <RouterLink v-for="q in quickActions" :key="q.path" :to="q.path" class="quick-item">
            <span class="quick-icon">{{ q.icon }}</span>
            <span class="quick-label">{{ q.label }}</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dashboardApi } from '@/api'

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const statsData = ref(null)
const growthData = ref([])
const activities = ref([])
const totalAccounts = ref(9)

const stats = computed(() => {
  if (!statsData.value) return []
  const d = statsData.value
  return [
    { icon: '👤', label: 'Total accounts', value: d.total_accounts, change: '+2 this month', up: true },
    { icon: '✅', label: 'Active accounts', value: d.active_accounts, change: '77.8%', up: true },
    { icon: '👥', label: 'Total followers', value: d.total_fans.toLocaleString(), change: '+113 today', up: true },
    { icon: '❤️', label: 'Total likes', value: d.total_likes.toLocaleString(), change: '+723 today', up: true },
    { icon: '🎬', label: 'Total videos', value: d.total_videos, change: '+1 today', up: true },
    { icon: '💬', label: 'Pending comments', value: d.pending_comments, change: '-2 resolved', up: false },
  ]
})

const maxFans = computed(() => Math.max(...growthData.value.map(d => d.fans)) || 1)
const maxLikes = computed(() => Math.max(...growthData.value.map(d => d.likes)) || 1)

const actDotClass = (type) => ({
  publish: 'act-green',
  comment: 'act-blue',
  warning: 'act-orange',
  account: 'act-primary',
  like: 'act-red',
}[type] || 'act-gray')

const quickActions = [
  { icon: '➕', label: 'Add account', path: '/accounts' },
  { icon: '📤', label: 'Publish content', path: '/publish' },
  { icon: '🎬', label: 'Upload video', path: '/videos' },
  { icon: '💬', label: 'Handle comments', path: '/comments' },
  { icon: '📁', label: 'Manage resources', path: '/resources' },
  { icon: '👥', label: 'Account groups', path: '/accounts/groups' },
]

onMounted(async () => {
  try {
    statsData.value = await dashboardApi.stats()
    const res = await dashboardApi.growth()
    growthData.value = res.items
    const ar = await dashboardApi.activities()
    activities.value = ar.items
    totalAccounts.value = statsData.value?.total_accounts || 9
  } catch (e) {
    // fallback mock
    statsData.value = { total_accounts: 9, active_accounts: 7, total_fans: 561, total_likes: 3289, total_videos: 6, pending_comments: 3 }
    growthData.value = [
      {day:'Mon',fans:45,likes:312},{day:'Tue',fans:62,likes:428},{day:'Wed',fans:38,likes:256},
      {day:'Thu',fans:91,likes:634},{day:'Fri',fans:124,likes:891},{day:'Sat',fans:88,likes:645},{day:'Sun',fans:113,likes:723}
    ]
    activities.value = [
      {time:'10:32',content:'OPPLII Texture Lab published a new video "Spring Skincare Guide"',type:'publish'},
      {time:'09:15',content:'Alveora-Texture received 5 new comments',type:'comment'},
      {time:'08:00',content:'OPPLII Softening Lab authorization expires in 10 days',type:'warning'},
      {time:'Yesterday',content:'Successfully imported 3 new accounts',type:'account'},
      {time:'Yesterday',content:'Winter Hydration Tips received 180 likes',type:'like'},
    ]
  }
})
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 20px; }
@media(max-width:1200px){ .stats-grid { grid-template-columns: repeat(3, 1fr); } }

.stat-card { background: #fff; border-radius: var(--radius-lg); padding: 18px 20px; box-shadow: var(--shadow); transition: transform 0.15s, box-shadow 0.15s; }
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.stat-icon { font-size: 22px; margin-bottom: 8px; }
.stat-label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--text); line-height: 1.1; margin-bottom: 4px; }
.stat-change { font-size: 12px; }

.chart-row { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-bottom: 16px; }
.chart-card { padding: 20px; }
.chart-card-sm { }
.chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.chart-title { font-size: 14px; font-weight: 600; color: var(--text); }
.chart-legend { display: flex; gap: 14px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.chart-body { }
.bar-chart { display: flex; gap: 4px; align-items: flex-end; height: 140px; }
.bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
.bars { display: flex; gap: 2px; align-items: flex-end; height: 90%; width: 100%; justify-content: center; }
.bar { width: 10px; border-radius: 3px 3px 0 0; transition: height 0.4s ease; cursor: pointer; min-height: 4px; }
.bar:hover { opacity: 0.8; }
.bar-fans { background: linear-gradient(180deg, #00BFA5, #80DEEA); }
.bar-likes { background: linear-gradient(180deg, #FF6B35, #FFB300); }
.bar-label { font-size: 11px; color: var(--text-muted); }

.donut-wrap { position: relative; display: flex; align-items: center; justify-content: center; padding: 10px 0; }
.donut-svg { width: 130px; height: 130px; }
.donut-center { position: absolute; text-align: center; }
.donut-total { font-size: 22px; font-weight: 700; color: var(--text); }
.donut-label { font-size: 11px; color: var(--text-muted); }
.donut-legend { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
.donut-legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
.donut-pct { margin-left: auto; font-weight: 600; color: var(--text); }

.bottom-row { display: grid; grid-template-columns: 1fr 300px; gap: 16px; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; border-bottom: 1px solid var(--border-light); }
.view-all { font-size: 12px; color: var(--primary); cursor: pointer; }

.activity-card { }
.activity-list { padding: 12px 20px; display: flex; flex-direction: column; gap: 14px; }
.activity-item { display: flex; gap: 12px; align-items: flex-start; }
.activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.act-green { background: var(--success); }
.act-blue { background: var(--info); }
.act-orange { background: var(--warning); }
.act-primary { background: var(--primary); }
.act-red { background: var(--danger); }
.act-gray { background: var(--text-muted); }
.activity-text { font-size: 13px; color: var(--text); line-height: 1.5; }
.activity-time { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.quick-card { }
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px; }
.quick-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px; border-radius: var(--radius); border: 1px solid var(--border);
  text-decoration: none; color: var(--text-secondary); font-size: 12px;
  transition: all 0.15s; cursor: pointer;
}
.quick-item:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.quick-icon { font-size: 20px; }
.quick-label { font-weight: 500; }
</style>


