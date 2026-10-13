import { useNavigate } from 'react-router-dom'
import { Dialog, Toast } from 'antd-mobile'
import { useMemberStore } from '@/store/member'
import './index.css'

export default function User() {
  const navigate = useNavigate()
  const memberInfo = useMemberStore((s) => s.memberInfo)
  const hasLogin = useMemberStore((s) => s.hasLogin)
  const logout = useMemberStore((s) => s.logout)

  const goLogin = () => navigate(`/login?redirect=${encodeURIComponent('/user')}`)

  /** 需要登录的入口，访客点击先去登录 */
  const guardedNavigate = (path: string) => {
    if (!hasLogin) {
      goLogin()
      return
    }
    navigate(path)
  }

  const handleLogout = async () => {
    const confirm = await Dialog.confirm({ content: '确定退出登录？' })
    if (confirm) {
      logout()
      Toast.show({ icon: 'success', content: '已退出登录' })
      navigate('/', { replace: true })
    }
  }

  const orderItems = [
    { icon: '📋', text: '全部订单', path: '/order/list?status=-1' },
    { icon: '💰', text: '待付款', path: '/order/list?status=0' },
    { icon: '📦', text: '待收货', path: '/order/list?status=2' },
    { icon: '↩️', text: '退款/售后', path: '/aftersale/list' },
  ]

  const menuItems = [
    { icon: '📍', text: '收货地址', color: '#5fcda2', path: '/address/list' },
    { icon: '📜', text: '我的足迹', color: '#e07472', path: '' },
    { icon: '⭐', text: '我的关注', color: '#5fcda2', path: '' },
    { icon: '❤️', text: '我的收藏', color: '#54b4ef', path: '' },
    { icon: '✏️', text: '我的评价', color: '#ee883b', path: '/comment/my' },
    { icon: '⚙️', text: '设置', color: '#e07472', path: '' },
  ]

  return (
    <div className="user-page">
      {/* 用户头部信息 */}
      <div className="user-header">
        <div className="user-header__bg" />
        <div className="user-header__info" onClick={hasLogin ? undefined : goLogin}>
          <img
            className="user-header__avatar"
            src={
              memberInfo?.icon ||
              'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png'
            }
            alt="avatar"
          />
          {hasLogin ? (
            <div className="user-header__name">
              {memberInfo?.nickname || memberInfo?.username || '用户'}
            </div>
          ) : (
            <div>
              <div className="user-header__name">登录 / 注册</div>
              <div className="user-header__guest-tip">登录后查看订单与会员权益</div>
            </div>
          )}
        </div>
        <div className="user-header__vip">
          <div className="user-header__vip-card">
            <div className="user-header__vip-tit">👑 黄金会员</div>
            <div className="user-header__vip-sub">mall移动端商城</div>
            <div className="user-header__vip-desc">黄金及以上会员可享有会员价优惠商品</div>
            <button className="user-header__vip-btn">立即开通</button>
          </div>
        </div>
      </div>

      {/* 积分统计 */}
      <div className="user-stats">
        <div className="user-stats__item">
          <span className="user-stats__num">{memberInfo?.integration ?? '暂无'}</span>
          <span className="user-stats__label">积分</span>
        </div>
        <div className="user-stats__item">
          <span className="user-stats__num">{memberInfo?.growth ?? '暂无'}</span>
          <span className="user-stats__label">成长值</span>
        </div>
        <div className="user-stats__item">
          <span className="user-stats__num">暂无</span>
          <span className="user-stats__label">优惠券</span>
        </div>
      </div>

      {/* 我的订单 */}
      <div className="user-orders">
        <div
          className="user-orders__header"
          onClick={() => guardedNavigate('/order/list?status=-1')}
        >
          <span>我的订单</span>
          <span className="user-orders__more">查看全部订单 ›</span>
        </div>
        <div className="user-orders__list">
          {orderItems.map((item) => (
            <div
              key={item.text}
              className="user-orders__item"
              onClick={() => guardedNavigate(item.path)}
            >
              <div className="user-orders__icon">{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="user-menu">
        {menuItems.map((item, idx) => (
          <div
            key={item.text}
            className={`user-menu__item ${idx === menuItems.length - 1 ? 'last' : ''}`}
            onClick={() => item.path && guardedNavigate(item.path)}
          >
            <span className="user-menu__icon" style={{ color: item.color }}>
              {item.icon}
            </span>
            <span className="user-menu__text">{item.text}</span>
            <span className="user-menu__arrow">›</span>
          </div>
        ))}
      </div>

      {/* 退出登录 */}
      {hasLogin ? (
        <button className="user-logout" onClick={handleLogout}>
          退出登录
        </button>
      ) : (
        <button className="user-logout primary" onClick={goLogin}>
          立即登录
        </button>
      )}
    </div>
  )
}
