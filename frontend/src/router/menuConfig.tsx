import type { ReactNode } from 'react'
import {
  DashboardOutlined,
  ShoppingOutlined,
  ProfileOutlined,
  SoundOutlined,
  TeamOutlined,
} from '@ant-design/icons'

export interface MenuItem {
  key: string
  label: string
  icon?: ReactNode
  children?: MenuItem[]
}

// 侧边栏菜单结构，key 即路由 path
export const menuConfig: MenuItem[] = [
  { key: '/home', label: '首页', icon: <DashboardOutlined /> },
  {
    key: '/pms',
    label: '商品',
    icon: <ShoppingOutlined />,
    children: [
      { key: '/pms/product', label: '商品列表' },
      { key: '/pms/productCate', label: '商品分类' },
      { key: '/pms/productAttr', label: '商品类型' },
      { key: '/pms/brand', label: '品牌管理' },
    ],
  },
  {
    key: '/oms',
    label: '订单',
    icon: <ProfileOutlined />,
    children: [
      { key: '/oms/order', label: '订单列表' },
      { key: '/oms/orderSetting', label: '订单设置' },
      { key: '/oms/returnApply', label: '退货申请处理' },
      { key: '/oms/returnReason', label: '退货原因设置' },
    ],
  },
  {
    key: '/sms',
    label: '营销',
    icon: <SoundOutlined />,
    children: [
      { key: '/sms/flash', label: '秒杀活动列表' },
      { key: '/sms/coupon', label: '优惠券列表' },
      { key: '/sms/brand', label: '品牌推荐' },
      { key: '/sms/new', label: '新品推荐' },
      { key: '/sms/hot', label: '人气推荐' },
      { key: '/sms/subject', label: '专题推荐' },
      { key: '/sms/advertise', label: '广告列表' },
    ],
  },
  {
    key: '/ums',
    label: '权限',
    icon: <TeamOutlined />,
    children: [
      { key: '/ums/admin', label: '用户列表' },
      { key: '/ums/role', label: '角色列表' },
      { key: '/ums/menu', label: '菜单列表' },
      { key: '/ums/resource', label: '资源列表' },
    ],
  },
]
