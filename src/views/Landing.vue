<template>
  <div class="landing">

    <!-- ── 顶部导航 ── -->
    <nav class="nav" :class="{ scrolled: scrollY > 60 }">
      <div class="nav-inner">
        <div class="nav-logo">
          <span class="logo-word">Shear</span>
          <span class="logo-tag">int</span>
        </div>
        <div class="nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Performance</a>
          <a href="#workflow">Workflow</a>
        </div>
        <RouterLink to="/login" class="nav-cta">Start Free Trial →</RouterLink>
      </div>
    </nav>

    <!-- ── Hero 区块 ── -->
    <section class="hero">
      <!-- 动态网格背景 -->
      <div class="grid-bg"></div>
      <!-- 光晕 -->
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>
      <!-- 浮动粒子 -->
      <div class="particles">
        <span v-for="i in 24" :key="i" class="particle" :style="particleStyle(i)"></span>
      </div>

      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Built for cross-border e-commerce MCN teams
        </div>

        <h1 class="hero-title">
          <span class="title-line">One place to manage</span>
          <span class="title-line accent">every TikTok</span>
          <span class="title-line">account portfolio</span>
        </h1>

        <p class="hero-desc">
          Multi-account authorization · TikTok Shop product links · Bulk publishing · Comment management<br/>
          Boost your team efficiency by <strong>10x</strong> while confidently managing hundreds of accounts daily
        </p>

        <div class="hero-actions">
          <RouterLink to="/login" class="btn-primary-hero">
            <span>Start free trial now</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </RouterLink>
          <a href="#features" class="btn-ghost-hero">Learn more</a>
        </div>

        <!-- 浮动数据卡片 -->
        <div class="hero-floats">
          <div class="float-card float-a">
            <div class="fc-icon">📈</div>
            <div class="fc-num">+127%</div>
            <div class="fc-label">Avg follower growth</div>
          </div>
          <div class="float-card float-b">
            <div class="fc-icon">⚡</div>
            <div class="fc-num">500+</div>
            <div class="fc-label">Manageable accounts</div>
          </div>
          <div class="float-card float-c">
            <div class="fc-icon">🛒</div>
            <div class="fc-num">Shop</div>
            <div class="fc-label">One-click product link distribution</div>
          </div>
        </div>
      </div>

      <!-- 产品截图预览 -->
      <div class="hero-screen">
        <div class="screen-wrap">
          <div class="screen-bar">
            <span></span><span></span><span></span>
          </div>
          <div class="screen-body">
            <div class="mock-sidebar">
              <div class="ms-logo">K</div>
              <div class="ms-item active"></div>
              <div class="ms-item"></div>
              <div class="ms-item"></div>
              <div class="ms-item"></div>
              <div class="ms-item"></div>
            </div>
            <div class="mock-main">
              <div class="mock-topbar">
                <div class="mt-title"></div>
                <div class="mt-btn"></div>
              </div>
              <div class="mock-stats">
                <div class="stat-mock" v-for="i in 4" :key="i">
                  <div class="sm-num" :style="`width:${40+i*8}%`"></div>
                  <div class="sm-label"></div>
                </div>
              </div>
              <div class="mock-table">
                <div class="mt-head"></div>
                <div class="mt-row" v-for="i in 5" :key="i">
                  <div class="mr-avatar" :class="`av-${i}`"></div>
                  <div class="mr-name"></div>
                  <div class="mr-tag"></div>
                  <div class="mr-num"></div>
                  <div class="mr-status"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="scroll-hint" @click="scrollToFeatures">
        <span>Scroll down</span>
        <div class="scroll-arrow">↓</div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section class="features" id="features">
      <div class="section-inner">
        <div class="section-label">Core Features</div>
        <h2 class="section-title">Every feature designed specifically<br/>for TikTok ops teams</h2>
        <p class="section-desc">Not a generic toolkit, but purpose-built for cross-border operations</p>

        <div class="features-grid">
          <div class="feature-card" v-for="f in features" :key="f.title"
               :class="{ wide: f.wide }"
               :style="`--accent: ${f.color}`">
            <div class="fc-header">
              <div class="fc-emoji">{{ f.icon }}</div>
              <div class="fc-glow"></div>
            </div>
            <h3 class="fc-title">{{ f.title }}</h3>
            <p class="fc-desc">{{ f.desc }}</p>
            <ul class="fc-points">
              <li v-for="p in f.points" :key="p">{{ p }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Performance ── -->
    <section class="stats-section" id="stats">
      <div class="stats-bg"></div>
      <div class="section-inner">
        <div class="section-label">Platform Metrics</div>
        <h2 class="section-title">Numbers tell the story</h2>
        <div class="stats-grid">
          <div class="stat-item" v-for="s in statsData" :key="s.num">
            <div class="si-num">{{ s.num }}</div>
            <div class="si-label">{{ s.label }}</div>
            <div class="si-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Workflow ── -->
    <section class="workflow" id="workflow">
      <div class="section-inner">
        <div class="section-label">Workflow</div>
        <h2 class="section-title">From authorization to monetization,<br/>all in one platform</h2>

        <div class="flow-steps">
          <div class="flow-line"></div>
          <div class="flow-step" v-for="(s, i) in flowSteps" :key="i">
            <div class="fs-num">{{ String(i+1).padStart(2,'0') }}</div>
            <div class="fs-icon">{{ s.icon }}</div>
            <h4 class="fs-title">{{ s.title }}</h4>
            <p class="fs-desc">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA 底部 ── -->
    <section class="cta-section">
      <div class="cta-glow"></div>
      <div class="cta-inner">
        <h2 class="cta-title">Ready to boost your<br/>TikTok operating efficiency?</h2>
        <p class="cta-desc">Sign up now to try all features for free. No credit card required.</p>
        <RouterLink to="/login" class="btn-cta">
          <span>🚀 Get started now</span>
        </RouterLink>
        <div class="cta-note">Trusted by <strong>2,000+</strong> operations teams</div>
      </div>
    </section>

    <!-- ── 页脚 ── -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <span class="logo-word">Shear</span>
          <span class="logo-tag">int</span>
        </div>
        <div class="footer-copy">© 2026 Shear International. Focused on TikTok cross-border operations.</div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrollY = ref(0)
const onScroll = () => { scrollY.value = window.scrollY }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

const particleStyle = (i) => {
  const size = 2 + (i % 4)
  const x = (i * 137.5) % 100
  const delay = (i * 0.3) % 5
  const dur = 6 + (i % 6)
  return {
    width: size + 'px', height: size + 'px',
    left: x + '%',
    animationDelay: delay + 's',
    animationDuration: dur + 's',
    opacity: 0.2 + (i % 5) * 0.1,
  }
}

const features = [
  {
    icon: '👥', title: 'Unified multi-account management', color: '#00BFA5',
    desc: 'Stop switching between accounts—manage everything from one dashboard',
    points: ['Manage 500+ TikTok accounts at once', 'Group accounts by category, creator, or region', 'Real-time authorization monitoring with expiry alerts'],
    wide: false,
  },
  {
    icon: '🛒', title: 'TikTok Shop product links', color: '#FF6B35',
    desc: 'Merchant + creator authorization in one flow, bind products to all accounts',
    points: ['Unified authorization for merchants and creators', 'Bulk distribution of product links', 'Full coverage for showcase accounts'],
    wide: false,
  },
  {
    icon: '📤', title: 'Bulk video publishing', color: '#7C4DFF',
    desc: 'Upload once, distribute to all selected accounts, with scheduled publishing',
    points: ['Centralized cloud video library', 'Sync to multiple accounts in one click', 'Real-time publishing status tracking'],
    wide: true,
  },
  {
    icon: '💬', title: 'Smart comment management', color: '#00BFA5',
    desc: 'Sentiment analysis + bulk replies, never miss important comments',
    points: ['Automatic positive/neutral/negative classification', 'Quick reply templates', 'Bulk replies for higher efficiency'],
    wide: false,
  },
  {
    icon: '📊', title: 'Data Center', color: '#FF6B35',
    desc: 'Follower growth, like trends, and publish performance at a glance',
    points: ['Multi-dimensional data visualization', 'Account health scoring', 'Data export and reporting'],
    wide: false,
  },
]

const statsData = [
  { num: '500+', label: 'Account limit', desc: 'Manage concurrently in a single workspace' },
  { num: '10x', label: 'Operational efficiency', desc: 'Compared to manual workflows' },
  { num: '99.9%', label: 'System uptime', desc: 'Stable operation with reliable authorization' },
  { num: '<2s', label: 'Response time', desc: 'Smooth experience without lag' },
]

const flowSteps = [
  { icon: '🔑', title: 'Account authorization', desc: 'Secure OAuth authorization for standard, creator, and Shop merchant accounts' },
  { icon: '📁', title: 'Content upload', desc: 'Upload videos to the cloud library with bulk uploads and categorization' },
  { icon: '⚙️', title: 'Publishing setup', desc: 'Select target accounts, set titles, configure products, and schedule publish times' },
  { icon: '🚀', title: 'One-click distribution', desc: 'Automatically publish to all selected accounts with real-time status updates' },
  { icon: '📈', title: 'Performance tracking', desc: 'Review views, likes, and comments per account to optimize operations' },
]
</script>

<style scoped>
/* ─── 全局变量 ───────────────────────────────── */
.landing {
  --teal: #00BFA5;
  --teal-dim: rgba(0,191,165,0.15);
  --teal-glow: rgba(0,191,165,0.4);
  --orange: #FF6B35;
  --purple: #7C4DFF;
  --bg: #050a0e;
  --bg2: #080f14;
  --surface: rgba(255,255,255,0.04);
  --surface2: rgba(255,255,255,0.07);
  --border: rgba(255,255,255,0.08);
  --text: #e8f0f5;
  --text-secondary: #8a9db0;
  --text-muted: #4a5a6a;

  background: var(--bg);
  color: var(--text);
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  overflow-x: hidden;
  min-height: 100vh;
}

/* ─── 导航 ───────────────────────────────────── */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 48px;
  transition: background 0.3s, backdrop-filter 0.3s, border-color 0.3s;
  border-bottom: 1px solid transparent;
}
.nav.scrolled {
  background: rgba(5,10,14,0.85);
  backdrop-filter: blur(20px);
  border-color: var(--border);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; height: 64px; gap: 40px;
}
.nav-logo { display: flex; align-items: center; gap: 8px; }
.logo-word { font-size: 20px; font-weight: 800; color: var(--teal); letter-spacing: -0.5px; }
.logo-tag { background: rgba(0,191,165,0.2); color: var(--teal); font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(0,191,165,0.3); }
.nav-links { display: flex; gap: 32px; margin-left: auto; }
.nav-links a { color: var(--text-secondary); font-size: 14px; text-decoration: none; transition: color 0.2s; }
.nav-links a:hover { color: var(--text); }
.nav-cta {
  background: var(--teal); color: #fff; padding: 8px 20px;
  border-radius: 8px; font-size: 14px; font-weight: 600;
  text-decoration: none; transition: all 0.2s; white-space: nowrap;
}
.nav-cta:hover { background: #00a896; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,191,165,0.4); }

/* ─── Hero ───────────────────────────────────── */
.hero {
  min-height: 100vh;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; position: relative;
  padding: 120px 48px 80px; overflow: hidden;
}

/* 网格背景 */
.grid-bg {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(0,191,165,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,191,165,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
}

/* 光晕 */
.glow {
  position: absolute; border-radius: 50%;
  filter: blur(80px); pointer-events: none;
}
.glow-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(0,191,165,0.12) 0%, transparent 70%);
  top: -100px; left: -100px;
  animation: floatGlow 8s ease-in-out infinite;
}
.glow-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%);
  bottom: 0; right: -50px;
  animation: floatGlow 10s ease-in-out infinite reverse;
}
.glow-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(124,77,255,0.06) 0%, transparent 70%);
  top: 50%; left: 50%;
  animation: floatGlow 12s ease-in-out infinite 2s;
}

/* 粒子 */
.particles { position: absolute; inset: 0; pointer-events: none; }
.particle {
  position: absolute; bottom: -10px; border-radius: 50%;
  background: var(--teal);
  animation: riseUp linear infinite;
}

.hero-content {
  position: relative; z-index: 2;
  text-align: center; max-width: 800px;
  animation: fadeInUp 0.8s ease both;
}

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(0,191,165,0.1); border: 1px solid rgba(0,191,165,0.25);
  color: var(--teal); font-size: 13px; font-weight: 600;
  padding: 6px 16px; border-radius: 20px; margin-bottom: 28px;
  animation: fadeInUp 0.8s ease 0.1s both;
}
.badge-dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--teal);
  animation: pulse 2s ease-in-out infinite;
}

.hero-title {
  font-size: clamp(48px, 7vw, 80px);
  font-weight: 900; line-height: 1.1; margin-bottom: 24px;
  letter-spacing: -2px;
  animation: fadeInUp 0.8s ease 0.2s both;
}
.title-line { display: block; }
.title-line.accent {
  background: linear-gradient(135deg, var(--teal) 0%, #80DEEA 50%, var(--teal) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite, fadeInUp 0.8s ease 0.2s both;
}

.hero-desc {
  font-size: 18px; color: var(--text-secondary); line-height: 1.8;
  margin-bottom: 36px; animation: fadeInUp 0.8s ease 0.3s both;
}
.hero-desc strong { color: var(--teal); }

.hero-actions {
  display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  animation: fadeInUp 0.8s ease 0.4s both;
}

.btn-primary-hero {
  display: inline-flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, var(--teal), #0097A7);
  color: #fff; padding: 14px 32px; border-radius: 12px;
  font-size: 16px; font-weight: 700; text-decoration: none;
  box-shadow: 0 0 40px rgba(0,191,165,0.3);
  transition: all 0.25s; position: relative; overflow: hidden;
}
.btn-primary-hero::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  opacity: 0; transition: opacity 0.2s;
}
.btn-primary-hero:hover::before { opacity: 1; }
.btn-primary-hero:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,191,165,0.45); }

.btn-ghost-hero {
  display: inline-flex; align-items: center;
  color: var(--text-secondary); border: 1px solid var(--border);
  padding: 14px 28px; border-radius: 12px; font-size: 16px;
  text-decoration: none; transition: all 0.2s;
}
.btn-ghost-hero:hover { border-color: var(--teal); color: var(--teal); background: var(--teal-dim); }

/* 浮动卡片 */
.hero-floats {
  display: flex; gap: 16px; justify-content: center; margin-top: 48px; flex-wrap: wrap;
  animation: fadeInUp 0.8s ease 0.5s both;
}
.float-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 16px; padding: 16px 24px; text-align: center;
  backdrop-filter: blur(10px); min-width: 120px;
  transition: transform 0.3s, border-color 0.3s;
}
.float-card:hover { transform: translateY(-4px); border-color: var(--teal); }
.float-a { animation: float 6s ease-in-out infinite; }
.float-b { animation: float 7s ease-in-out infinite 1s; }
.float-c { animation: float 8s ease-in-out infinite 2s; }
.fc-icon { font-size: 22px; margin-bottom: 4px; }
.fc-num { font-size: 22px; font-weight: 800; color: var(--teal); }
.fc-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* 产品截图 */
.hero-screen {
  position: relative; z-index: 2; margin-top: 64px; width: 100%; max-width: 900px;
  animation: fadeInUp 0.8s ease 0.6s both;
}
.screen-wrap {
  background: rgba(8,15,20,0.9); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,191,165,0.1);
}
.screen-bar {
  background: rgba(255,255,255,0.04); padding: 12px 16px;
  display: flex; gap: 7px; align-items: center;
  border-bottom: 1px solid var(--border);
}
.screen-bar span { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.1); }
.screen-bar span:nth-child(1) { background: #ff5f57; }
.screen-bar span:nth-child(2) { background: #febc2e; }
.screen-bar span:nth-child(3) { background: #28c840; }

.screen-body { display: flex; height: 280px; }
.mock-sidebar {
  width: 52px; background: rgba(0,191,165,0.05); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 12px;
}
.ms-logo { width: 30px; height: 30px; background: var(--teal); border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; }
.ms-item { width: 30px; height: 30px; background: var(--surface); border-radius: 6px; }
.ms-item.active { background: var(--teal-dim); border: 1px solid rgba(0,191,165,0.3); }

.mock-main { flex: 1; display: flex; flex-direction: column; padding: 16px; gap: 12px; overflow: hidden; }
.mock-topbar { display: flex; justify-content: space-between; align-items: center; }
.mt-title { width: 120px; height: 14px; background: var(--surface2); border-radius: 4px; }
.mt-btn { width: 80px; height: 26px; background: var(--teal-dim); border-radius: 6px; }

.mock-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.stat-mock { background: var(--surface); border-radius: 8px; padding: 10px; }
.sm-num { height: 16px; background: var(--teal-dim); border-radius: 3px; margin-bottom: 6px; }
.sm-label { width: 60%; height: 8px; background: var(--surface2); border-radius: 3px; }

.mock-table { flex: 1; background: var(--surface); border-radius: 8px; overflow: hidden; }
.mt-head { height: 28px; background: var(--surface2); border-bottom: 1px solid var(--border); }
.mt-row {
  display: flex; align-items: center; gap: 12px; padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  animation: rowSlide 3s ease-in-out infinite;
}
.mt-row:nth-child(even) { animation-delay: 0.5s; }
.mr-avatar { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
.av-1{background:#00BFA5} .av-2{background:#FF6B35} .av-3{background:#7C4DFF} .av-4{background:#00B0FF} .av-5{background:#FFB300}
.mr-name { flex: 1; height: 10px; background: var(--surface2); border-radius: 3px; }
.mr-tag { width: 40px; height: 18px; background: rgba(0,191,165,0.15); border-radius: 4px; }
.mr-num { width: 30px; height: 10px; background: var(--surface2); border-radius: 3px; }
.mr-status { width: 50px; height: 18px; background: rgba(0,191,165,0.2); border-radius: 4px; }

.scroll-hint {
  position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: var(--text-muted); font-size: 12px; cursor: pointer;
  animation: fadeInUp 1s ease 1s both;
  transition: color 0.2s;
}
.scroll-hint:hover { color: var(--teal); }
.scroll-arrow { animation: bounce 1.5s ease-in-out infinite; font-size: 18px; }

/* ─── 通用 Section ───────────────────────────── */
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
.section-label {
  display: inline-block; color: var(--teal); font-size: 13px; font-weight: 600;
  letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;
  padding: 4px 14px; border: 1px solid rgba(0,191,165,0.25);
  border-radius: 20px; background: rgba(0,191,165,0.06);
}
.section-title {
  font-size: clamp(32px, 4vw, 48px); font-weight: 800;
  line-height: 1.2; margin-bottom: 16px; letter-spacing: -1px;
}
.section-desc { font-size: 17px; color: var(--text-secondary); line-height: 1.7; max-width: 560px; }

/* ─── Features ───────────────────────────────── */
.features { padding: 120px 0; }

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px; margin-top: 60px;
}
.feature-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 20px; padding: 28px; position: relative; overflow: hidden;
  transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
}
.feature-card.wide { grid-column: span 2; }
.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent, var(--teal));
  box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--accent, var(--teal));
}
.feature-card::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 0% 0%, rgba(var(--accent-rgb, 0,191,165), 0.06) 0%, transparent 60%);
  opacity: 0; transition: opacity 0.3s;
}
.feature-card:hover::before { opacity: 1; }

.fc-header { position: relative; display: inline-block; margin-bottom: 16px; }
.fc-emoji { font-size: 36px; position: relative; z-index: 1; }
.fc-glow {
  position: absolute; width: 60px; height: 60px; border-radius: 50%;
  background: var(--accent, var(--teal)); filter: blur(20px); opacity: 0.2;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
}

.fc-title { font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #fff; }
.fc-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 16px; }
.fc-points { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.fc-points li {
  font-size: 13px; color: var(--text-secondary);
  padding-left: 18px; position: relative;
}
.fc-points li::before { content: '✓'; position: absolute; left: 0; color: var(--teal); font-weight: 700; }

/* ─── Stats ──────────────────────────────────── */
.stats-section { padding: 120px 0; position: relative; }
.stats-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0,191,165,0.03) 50%, transparent 100%);
}
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 2px; margin-top: 60px;
  border: 1px solid var(--border); border-radius: 20px; overflow: hidden;
}
.stat-item {
  padding: 40px 32px; text-align: center; background: var(--surface);
  transition: background 0.2s;
  border-right: 1px solid var(--border);
}
.stat-item:last-child { border-right: none; }
.stat-item:hover { background: var(--surface2); }
.si-num {
  font-size: 52px; font-weight: 900; letter-spacing: -2px;
  background: linear-gradient(135deg, var(--teal), #80DEEA);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}
.si-label { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.si-desc { font-size: 13px; color: var(--text-muted); }

/* ─── Workflow ───────────────────────────────── */
.workflow { padding: 120px 0; }
.flow-steps {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 0; margin-top: 64px; position: relative;
}
.flow-line {
  position: absolute; top: 28px; left: 10%; right: 10%; height: 2px;
  background: linear-gradient(90deg, transparent, var(--teal), transparent);
  opacity: 0.3;
}
.flow-step { padding: 0 20px; text-align: center; position: relative; }
.fs-num {
  font-size: 11px; font-weight: 700; letter-spacing: 2px;
  color: var(--text-muted); margin-bottom: 12px;
}
.fs-icon {
  width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 16px;
  background: var(--surface2); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; font-size: 24px;
  transition: all 0.3s; position: relative; z-index: 1;
}
.flow-step:hover .fs-icon {
  background: var(--teal-dim); border-color: var(--teal);
  transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,191,165,0.2);
}
.fs-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.fs-desc { font-size: 12px; color: var(--text-muted); line-height: 1.6; }

/* ─── CTA ────────────────────────────────────── */
.cta-section {
  padding: 160px 48px; text-align: center; position: relative; overflow: hidden;
}
.cta-glow {
  position: absolute; width: 800px; height: 800px; border-radius: 50%;
  background: radial-gradient(circle, rgba(0,191,165,0.08) 0%, transparent 70%);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  pointer-events: none;
}
.cta-inner { position: relative; z-index: 1; }
.cta-title {
  font-size: clamp(36px, 5vw, 60px); font-weight: 900; line-height: 1.2;
  margin-bottom: 20px; letter-spacing: -1.5px;
}
.cta-desc { font-size: 18px; color: var(--text-secondary); margin-bottom: 40px; }
.btn-cta {
  display: inline-flex; align-items: center;
  background: linear-gradient(135deg, var(--teal), #0097A7);
  color: #fff; padding: 18px 48px; border-radius: 16px;
  font-size: 18px; font-weight: 700; text-decoration: none;
  box-shadow: 0 0 60px rgba(0,191,165,0.35);
  transition: all 0.25s; margin-bottom: 20px;
}
.btn-cta:hover { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(0,191,165,0.5); }
.cta-note { font-size: 14px; color: var(--text-muted); }
.cta-note strong { color: var(--teal); }

/* ─── Footer ─────────────────────────────────── */
.footer {
  border-top: 1px solid var(--border); padding: 32px 48px;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
}
.footer-copy { font-size: 13px; color: var(--text-muted); }

/* ─── 动画 ───────────────────────────────────── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes floatGlow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
@keyframes riseUp {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.3; }
  100% { transform: translateY(-100vh); opacity: 0; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.4); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
@keyframes rowSlide {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ─── 响应式 ─────────────────────────────────── */
@media (max-width: 1024px) {
  .features-grid { grid-template-columns: 1fr 1fr; }
  .feature-card.wide { grid-column: span 1; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .flow-steps { grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .flow-line { display: none; }
}
@media (max-width: 768px) {
  .nav { padding: 0 20px; }
  .nav-links { display: none; }
  .hero { padding: 100px 20px 60px; }
  .hero-screen { display: none; }
  .features-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .flow-steps { grid-template-columns: 1fr 1fr; }
  .section-inner { padding: 0 20px; }
  .features, .stats-section, .workflow { padding: 80px 0; }
}
</style>

