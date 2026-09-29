import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Toast } from 'antd-mobile'
import { useMemberStore } from '@/store/member'
import './index.css'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useMemberStore((s) => s.login)

  const [username, setUsername] = useState('mall')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({ content: '请输入用户名和密码' })
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      Toast.show({ icon: 'success', content: '登录成功' })
      const redirect = searchParams.get('redirect')
      setTimeout(() => {
        if (redirect) {
          navigate(decodeURIComponent(redirect), { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      }, 600)
    } catch (e) {
      Toast.show({ content: '登录失败，请检查账号密码' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-page__wrapper">
        <div className="login-page__logo">LOGIN</div>
        <div className="login-page__welcome">欢迎回来！</div>
        <div className="login-page__form">
          <div className="login-page__item">
            <span className="login-page__label">用户名</span>
            <input
              type="text"
              value={username}
              maxLength={20}
              placeholder="请输入用户名"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-page__item">
            <span className="login-page__label">密码</span>
            <input
              type="password"
              value={password}
              maxLength={20}
              placeholder="请输入密码"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>
        <button className="login-page__btn" disabled={loading} onClick={handleLogin}>
          {loading ? '登录中...' : '登录'}
        </button>
        <div className="login-page__tip">演示账号：mall / 123456（任意非空也可登录）</div>
        <div className="login-page__register">
          还没有账号?
          <span onClick={() => navigate('/register')}>马上注册</span>
        </div>
      </div>
    </div>
  )
}
