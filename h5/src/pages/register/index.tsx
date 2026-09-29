import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar, Toast } from 'antd-mobile'
import { registerAPI, getAuthCodeAPI } from '@/api/member'
import type { RegisterParam } from '@/types/member'
import './index.css'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterParam>({
    username: '',
    password: '',
    telephone: '',
    authCode: '',
  })
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCountdown = () => {
    setCountdown(60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleGetAuthCode = async () => {
    if (!formData.telephone) {
      Toast.show({ content: '请输入手机号' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.telephone)) {
      Toast.show({ content: '手机号格式不正确' })
      return
    }
    try {
      const code = await getAuthCodeAPI(formData.telephone)
      Toast.show({ content: `验证码：${code || '已发送'}`, duration: 3000 })
      startCountdown()
    } catch {
      Toast.show({ content: '获取验证码失败' })
    }
  }

  const handleRegister = async () => {
    const { username, telephone, password, authCode } = formData
    if (!username) return Toast.show({ content: '请输入用户名' })
    if (!telephone) return Toast.show({ content: '请输入手机号' })
    if (!password) return Toast.show({ content: '请输入密码' })
    if (!authCode) return Toast.show({ content: '请输入验证码' })

    setLoading(true)
    try {
      await registerAPI(formData)
      Toast.show({ icon: 'success', content: '注册成功' })
      setTimeout(() => navigate('/login', { replace: true }), 1000)
    } catch {
      Toast.show({ content: '注册失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <NavBar onBack={() => navigate(-1)}>注册账号</NavBar>
      <div className="register-page__wrapper">
        <div className="register-page__logo">REGISTER</div>
        <div className="register-page__welcome">注册账号！</div>
        <div className="register-page__form">
          <div className="register-page__item">
            <span className="register-page__label">用户名</span>
            <input
              type="text"
              maxLength={20}
              placeholder="请输入用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div className="register-page__item">
            <span className="register-page__label">手机号</span>
            <input
              type="tel"
              maxLength={11}
              placeholder="请输入手机号"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>
          <div className="register-page__item">
            <span className="register-page__label">密码</span>
            <input
              type="password"
              maxLength={20}
              placeholder="8-18位数字、字母组合"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="register-page__item">
            <span className="register-page__label">验证码</span>
            <div className="register-page__code-row">
              <input
                type="text"
                maxLength={6}
                placeholder="请输入验证码"
                value={formData.authCode}
                onChange={(e) => setFormData({ ...formData, authCode: e.target.value })}
              />
              <button
                className="register-page__code-btn"
                disabled={countdown > 0}
                onClick={handleGetAuthCode}
              >
                {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
              </button>
            </div>
          </div>
        </div>
        <button className="register-page__btn" disabled={loading} onClick={handleRegister}>
          {loading ? '注册中...' : '注册'}
        </button>
      </div>
    </div>
  )
}
