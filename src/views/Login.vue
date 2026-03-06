<template>
  <div class="auth-page">
    <!-- Left branding panel -->
    <div class="auth-left">
      <div class="brand">
        <span class="brand-logo">SHEAR</span>
        <span class="brand-badge">int</span>
      </div>
      <div class="brand-bar"></div>
      <div class="auth-hero">
        <h1 class="hero-title">TikTok<br/>Account Management Platform</h1>
        <p class="hero-sub">Unified multi-account management · TikTok Shop product links · Bulk publishing · Data analytics</p>
      </div>
      <div class="feature-list">
        <div class="feature-item" v-for="f in features" :key="f.text">
          <span class="feature-icon">{{ f.icon }}</span>
          <span>{{ f.text }}</span>
        </div>
      </div>
      <div class="auth-decoration">
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
        <div class="deco-circle deco-3"></div>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="auth-right">
      <div class="auth-card">
        <!-- Tab switch -->
        <div class="auth-tabs">
          <div class="auth-tab" :class="{ active: mode === 'login' }" @click="mode = 'login'; clearError()">Sign In</div>
          <div class="auth-tab" :class="{ active: mode === 'register' }" @click="mode = 'register'; clearError()">Sign Up</div>
          <div class="tab-slider" :style="{ left: mode === 'login' ? '4px' : '50%' }"></div>
        </div>

        <!-- Login Form -->
        <Transition name="slide-fade" mode="out-in">
          <div v-if="mode === 'login'" key="login" class="auth-form">
            <h2 class="form-title">Welcome back</h2>
            <p class="form-sub">Sign in to manage your TikTok accounts</p>

            <div class="field-group">
              <label class="field-label">Username</label>
              <div class="field-wrap" :class="{ error: errors.username }">
                <span class="field-icon">👤</span>
                <input
                  class="field-input"
                  v-model="loginForm.username"
                  placeholder="Enter username"
                  @keyup.enter="submitLogin"
                  @input="clearError"
                />
              </div>
              <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
            </div>

            <div class="field-group">
              <label class="field-label">Password</label>
              <div class="field-wrap" :class="{ error: errors.password }">
                <span class="field-icon">🔒</span>
                <input
                  class="field-input"
                  v-model="loginForm.password"
                  :type="showPwd ? 'text' : 'password'"
                  placeholder="Enter password"
                  @keyup.enter="submitLogin"
                  @input="clearError"
                />
                <span class="field-suffix" @click="showPwd = !showPwd">
                  {{ showPwd ? '🙈' : '👁️' }}
                </span>
              </div>
              <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
            </div>

            <div v-if="globalError" class="global-error">
              <span>⚠️</span> {{ globalError }}
            </div>

            <button class="submit-btn" @click="submitLogin" :disabled="loading">
              <span v-if="loading" class="btn-spinner"></span>
              <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
            </button>

<!--            <div class="auth-divider"><span>Or use a demo account</span></div>

            <div class="demo-accounts">
              <div class="demo-item" v-for="d in demoAccounts" :key="d.username" @click="fillDemo(d)">
                <span class="demo-avatar">{{ d.avatar }}</span>
                <div>
                  <div class="demo-name">{{ d.label }}</div>
                  <div class="demo-cred">{{ d.username }} / {{ d.password }}</div>
                </div>
              </div>
            </div>-->
          </div>

          <!-- Register Form -->
          <div v-else key="register" class="auth-form">
            <h2 class="form-title">Create an account</h2>
            <p class="form-sub">Register to manage your TikTok accounts</p>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Username <span class="required">*</span></label>
                <div class="field-wrap" :class="{ error: errors.username }">
                  <span class="field-icon">👤</span>
                  <input class="field-input" v-model="regForm.username" placeholder="3-64 characters" @input="clearError" />
                </div>
                <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
              </div>
              <div class="field-group">
                <label class="field-label">Display name</label>
                <div class="field-wrap">
                  <span class="field-icon">✏️</span>
                  <input class="field-input" v-model="regForm.display_name" placeholder="Optional" />
                </div>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Email <span class="required">*</span></label>
              <div class="field-wrap" :class="{ error: errors.email }">
                <span class="field-icon">📧</span>
                <input class="field-input" v-model="regForm.email" type="email" placeholder="your@email.com" @input="clearError" />
              </div>
              <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
            </div>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Password <span class="required">*</span></label>
                <div class="field-wrap" :class="{ error: errors.password }">
                  <span class="field-icon">🔒</span>
                  <input class="field-input" v-model="regForm.password" :type="showPwd ? 'text' : 'password'" placeholder="At least 6 characters" @input="validatePwd" />
                  <span class="field-suffix" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</span>
                </div>
                <div v-if="regForm.password" class="pwd-strength">
                  <div class="strength-bar" :style="{ width: pwdStrength.pct + '%', background: pwdStrength.color }"></div>
                  <span :style="{ color: pwdStrength.color }">{{ pwdStrength.label }}</span>
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Confirm password <span class="required">*</span></label>
                <div class="field-wrap" :class="{ error: errors.confirm }">
                  <span class="field-icon">🔒</span>
                  <input class="field-input" v-model="regForm.confirm" :type="showPwd ? 'text' : 'password'" placeholder="Re-enter" @input="clearError" />
                </div>
                <span v-if="errors.confirm" class="field-error">{{ errors.confirm }}</span>
              </div>
            </div>

            <div v-if="globalError" class="global-error">
              <span>⚠️</span> {{ globalError }}
            </div>

            <button class="submit-btn" @click="submitRegister" :disabled="loading">
              <span v-if="loading" class="btn-spinner"></span>
              <span>{{ loading ? 'Signing up...' : 'Sign up' }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const { login, register } = useAuth()

const mode = ref('login')
const loading = ref(false)
const showPwd = ref(false)
const globalError = ref('')
const errors = ref({})

const loginForm = ref({ username: '', password: '' })
const regForm = ref({ username: '', email: '', password: '', confirm: '', display_name: '' })

const features = [
  { icon: '👥', text: 'Multi-user support with full data isolation' },
  { icon: '🔐', text: 'JWT stateless authentication, secure and reliable' },
  { icon: '📊', text: 'Real-time dashboards to track account activity' },
  { icon: '🛒', text: 'One-stop TikTok Shop product link management' },
  { icon: '🤖', text: 'Bulk publishing and automated operations' },
]

const demoAccounts = [
  { avatar: '🏢', label: 'Demo Account A', username: 'demo_user', password: '123456' },
  { avatar: '🛍️', label: 'Demo Account B', username: 'shop_demo', password: '123456' },
]

const fillDemo = (d) => {
  loginForm.value.username = d.username
  loginForm.value.password = d.password
  clearError()
}

const clearError = () => {
  errors.value = {}
  globalError.value = ''
}

// Password strength
const pwdStrength = computed(() => {
  const pwd = regForm.value.password
  if (!pwd) return { pct: 0, color: '#e8edf2', label: '' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const map = [
    { pct: 20, color: '#ff4d4f', label: 'Too weak' },
    { pct: 40, color: '#fa8c16', label: 'Weak' },
    { pct: 60, color: '#fadb14', label: 'Fair' },
    { pct: 80, color: '#52c41a', label: 'Strong' },
    { pct: 100, color: '#00BFA5', label: 'Very strong' },
  ]
  return map[Math.min(score, 4)]
})

const validatePwd = () => {
  clearError()
}

const submitLogin = async () => {
  if (!loginForm.value.username) { errors.value.username = 'Please enter a username'; return }
  if (!loginForm.value.password) { errors.value.password = 'Please enter a password'; return }

  loading.value = true
  try {
    await login(loginForm.value.username, loginForm.value.password)
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    globalError.value = err.response?.data?.detail || 'Sign in failed. Check username or password.'
  } finally {
    loading.value = false
  }
}

const submitRegister = async () => {
  errors.value = {}
  if (!regForm.value.username || regForm.value.username.length < 3) { errors.value.username = 'Username must be at least 3 characters'; return }
  if (!regForm.value.email) { errors.value.email = 'Please enter an email'; return }
  if (!regForm.value.password || regForm.value.password.length < 6) { errors.value.password = 'Password must be at least 6 characters'; return }
  if (regForm.value.password !== regForm.value.confirm) { errors.value.confirm = 'Passwords do not match'; return }

  loading.value = true
  try {
    await register({
      username: regForm.value.username,
      email: regForm.value.email,
      password: regForm.value.password,
      display_name: regForm.value.display_name || undefined,
    })
    router.push('/dashboard')
  } catch (err) {
    globalError.value = err.response?.data?.detail || 'Sign up failed. Please try again later.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
}

/* Left panel */
.auth-left {
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #00BFA5 0%, #0097A7 50%, #006064 100%);
  padding: 40px 44px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.brand { display: flex; align-items: center; gap: 8px; }
.brand-logo { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.brand-badge { background: rgba(255,255,255,0.25); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
.brand-bar { width: 36px; height: 3px; background: rgba(255,255,255,0.4); border-radius: 2px; margin: 10px 0 40px; }

.hero-title { font-size: 36px; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 14px; }
.hero-sub { font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.7; margin-bottom: 40px; }

.feature-list { display: flex; flex-direction: column; gap: 14px; }
.feature-item { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.9); font-size: 14px; }
.feature-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }

/* Decorative circles */
.auth-decoration { position: absolute; right: -60px; bottom: -60px; }
.deco-circle { position: absolute; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); }
.deco-1 { width: 200px; height: 200px; right: 0; bottom: 0; }
.deco-2 { width: 340px; height: 340px; right: -70px; bottom: -70px; }
.deco-3 { width: 480px; height: 480px; right: -140px; bottom: -140px; }

/* Right panel */
.auth-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 40px 24px;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* Tab switcher */
.auth-tabs {
  display: flex;
  background: #f5f7fa;
  padding: 4px;
  position: relative;
  margin: 24px 24px 0;
  border-radius: 10px;
}
.auth-tab {
  flex: 1;
  text-align: center;
  padding: 9px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: #8a9ab0;
  position: relative;
  z-index: 1;
  transition: color 0.2s;
  border-radius: 8px;
}
.auth-tab.active { color: var(--text); }
.tab-slider {
  position: absolute;
  width: calc(50% - 4px);
  top: 4px;
  bottom: 4px;
  background: #fff;
  border-radius: 7px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: left 0.22s cubic-bezier(0.4,0,0.2,1);
}

/* Form */
.auth-form { padding: 24px 28px 28px; }
.form-title { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.form-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }

.field-group { margin-bottom: 16px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field-label { font-size: 13px; font-weight: 600; color: #4a5568; display: block; margin-bottom: 6px; }
.required { color: var(--danger); }

.field-wrap {
  display: flex; align-items: center;
  border: 1.5px solid var(--border); border-radius: 8px;
  background: #fff; transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;
}
.field-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,191,165,0.12); }
.field-wrap.error { border-color: var(--danger); }
.field-icon { padding: 0 10px 0 12px; font-size: 16px; flex-shrink: 0; }
.field-input { flex: 1; border: none; outline: none; padding: 10px 4px; font-size: 14px; color: var(--text); background: transparent; font-family: inherit; }
.field-input::placeholder { color: var(--text-muted); }
.field-suffix { padding: 0 12px; font-size: 16px; cursor: pointer; flex-shrink: 0; }
.field-error { font-size: 12px; color: var(--danger); margin-top: 4px; display: block; }

.pwd-strength { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
.strength-bar { height: 4px; border-radius: 2px; transition: all 0.3s ease; flex-shrink: 0; }
.pwd-strength span { font-size: 11px; font-weight: 600; white-space: nowrap; }

.global-error {
  background: #fff2f0; border: 1px solid #ffccc7; border-radius: 8px;
  padding: 10px 14px; color: #cf1322; font-size: 13px;
  margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
}

.submit-btn {
  width: 100%; padding: 12px;
  background: linear-gradient(135deg, #00BFA5, #0097A7);
  color: #fff; border: none; border-radius: 8px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity 0.15s, transform 0.1s;
  font-family: inherit;
}
.submit-btn:hover { opacity: 0.92; transform: translateY(-1px); }
.submit-btn:active { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.auth-divider {
  text-align: center; position: relative; margin: 18px 0 14px;
  color: var(--text-muted); font-size: 12px;
}
.auth-divider::before, .auth-divider::after {
  content: ''; position: absolute; top: 50%; height: 1px;
  background: var(--border); width: calc(50% - 60px);
}
.auth-divider::before { left: 0; }
.auth-divider::after { right: 0; }

.demo-accounts { display: flex; flex-direction: column; gap: 8px; }
.demo-item {
  display: flex; align-items: center; gap: 12px;
  border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px;
  cursor: pointer; transition: all 0.15s;
}
.demo-item:hover { border-color: var(--primary); background: var(--primary-light); }
.demo-avatar { font-size: 20px; }
.demo-name { font-size: 13px; font-weight: 600; color: var(--text); }
.demo-cred { font-size: 11px; color: var(--text-muted); }

/* Transition */
.slide-fade-enter-active { transition: all 0.2s ease; }
.slide-fade-leave-active { transition: all 0.15s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateX(10px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-10px); }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .auth-left { display: none; }
}
</style>




