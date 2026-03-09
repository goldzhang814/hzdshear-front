import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// ─── 请求拦截：自动带上 JWT Token ──────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── 响应拦截：401 自动跳转登录页 ─────────────────────────────
api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 避免登录页自身触发循环跳转
      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      }
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/password', data),
}

export const accountApi = {
  list: (params) => api.get('/accounts', { params }),
  get: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  listGroups: () => api.get('/accounts/groups/list'),
  createGroup: (data) => api.post('/accounts/groups/create', data),
  deleteGroup: (id) => api.delete(`/accounts/groups/${id}`),
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  activities: () => api.get('/dashboard/activities'),
}

export const videoApi = {
  list: (params) => api.get('/videos', { params }),
  get: (id) => api.get(`/videos/${id}`).then(r => r.data),
  delete: (id) => api.delete(`/videos/${id}`),
}

export const publishApi = {
  list: (params) => api.get('/publish', { params }),
  delete: (id) => api.delete(`/publish/${id}`),
  retry: (id) => api.post(`/publish/${id}/retry`),
}

export const commentApi = {
  list: (params) => api.get('/comments', { params }),
  reply: (id, content) => api.post(`/comments/${id}/reply`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
}

export const resourceApi = {
  list: (params) => api.get('/resources', { params }),
  delete: (id) => api.delete(`/resources/${id}`),
}

export default api
