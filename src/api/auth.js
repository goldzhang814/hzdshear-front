/**
 * useAuth - Global auth state
 * Vue 3 reactivity + localStorage token persistence
 */
import {ref, computed} from 'vue'
import {authApi} from './index'

// Module-level singleton state (shared across components)
const token = ref(localStorage.getItem('token') || '')
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

export function useAuth() {
    const isLoggedIn = computed(() => !!token.value)

    const setAuth = (tokenValue, userInfo) => {
        token.value = tokenValue
        user.value = userInfo
        localStorage.setItem('token', tokenValue)
        localStorage.setItem('user', JSON.stringify(userInfo))
    }

    const clearAuth = () => {
        token.value = ''
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    const login = async (username, password) => {
        const res = await authApi.login({username, password})
        setAuth(res.access_token, res.user)
        return res
    }

    const register = async (data) => {
        const res = await authApi.register(data)
        setAuth(res.access_token, res.user)
        return res
    }

    const logout = () => {
        clearAuth()
    }

    const refreshUser = async () => {
        try {
            const u = await authApi.me()
            user.value = u
            localStorage.setItem('user', JSON.stringify(u))
        } catch {
            clearAuth()
        }
    }

    return {
        token,
        user,
        isLoggedIn,
        login,
        register,
        logout,
        refreshUser,
        setAuth,
        clearAuth,
    }
}

