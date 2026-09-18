import { createHashRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { Spin } from 'antd'
import Layout from '@/layout'
import { getToken } from '@/store/auth'

const Login = lazy(() => import('@/pages/login'))
const Home = lazy(() => import('@/pages/home'))

// PMS
const ProductList = lazy(() => import('@/pages/pms/product'))
const ProductAdd = lazy(() => import('@/pages/pms/product/edit'))
const ProductCate = lazy(() => import('@/pages/pms/productCate'))
const ProductAttr = lazy(() => import('@/pages/pms/productAttr'))
const ProductAttrList = lazy(() => import('@/pages/pms/productAttr/attrList'))
const Brand = lazy(() => import('@/pages/pms/brand'))
const BrandEdit = lazy(() => import('@/pages/pms/brand/edit'))
// OMS
const OrderList = lazy(() => import('@/pages/oms/order'))
const OrderDetail = lazy(() => import('@/pages/oms/order/detail'))
const OrderSetting = lazy(() => import('@/pages/oms/orderSetting'))
const ReturnApply = lazy(() => import('@/pages/oms/returnApply'))
const ReturnApplyDetail = lazy(() => import('@/pages/oms/returnApply/detail'))
const ReturnReason = lazy(() => import('@/pages/oms/returnReason'))
// SMS
const Flash = lazy(() => import('@/pages/sms/flash'))
const Coupon = lazy(() => import('@/pages/sms/coupon'))
const CouponEdit = lazy(() => import('@/pages/sms/coupon/edit'))
const HomeBrand = lazy(() => import('@/pages/sms/brand'))
const HomeNew = lazy(() => import('@/pages/sms/new'))
const HomeHot = lazy(() => import('@/pages/sms/hot'))
const HomeSubject = lazy(() => import('@/pages/sms/subject'))
const Advertise = lazy(() => import('@/pages/sms/advertise'))
const AdvertiseEdit = lazy(() => import('@/pages/sms/advertise/edit'))
// UMS
const Admin = lazy(() => import('@/pages/ums/admin'))
const Role = lazy(() => import('@/pages/ums/role'))
const Menu = lazy(() => import('@/pages/ums/menu'))
const Resource = lazy(() => import('@/pages/ums/resource'))

function lazyEl(node: ReactNode): ReactNode {
  return <Suspense fallback={<Spin style={{ margin: 40 }} />}>{node}</Suspense>
}

function RequireAuth({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

const router = createHashRouter([
  { path: '/login', element: lazyEl(<Login />) },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: lazyEl(<Home />) },
      // PMS
      { path: 'pms/product', element: lazyEl(<ProductList />) },
      { path: 'pms/addProduct', element: lazyEl(<ProductAdd />) },
      { path: 'pms/updateProduct/:id', element: lazyEl(<ProductAdd />) },
      { path: 'pms/productCate', element: lazyEl(<ProductCate />) },
      { path: 'pms/productAttr', element: lazyEl(<ProductAttr />) },
      { path: 'pms/productAttrList/:cid', element: lazyEl(<ProductAttrList />) },
      { path: 'pms/brand', element: lazyEl(<Brand />) },
      { path: 'pms/addBrand', element: lazyEl(<BrandEdit />) },
      { path: 'pms/updateBrand/:id', element: lazyEl(<BrandEdit />) },
      // OMS
      { path: 'oms/order', element: lazyEl(<OrderList />) },
      { path: 'oms/orderDetail/:id', element: lazyEl(<OrderDetail />) },
      { path: 'oms/orderSetting', element: lazyEl(<OrderSetting />) },
      { path: 'oms/returnApply', element: lazyEl(<ReturnApply />) },
      { path: 'oms/returnApplyDetail/:id', element: lazyEl(<ReturnApplyDetail />) },
      { path: 'oms/returnReason', element: lazyEl(<ReturnReason />) },
      // SMS
      { path: 'sms/flash', element: lazyEl(<Flash />) },
      { path: 'sms/coupon', element: lazyEl(<Coupon />) },
      { path: 'sms/addCoupon', element: lazyEl(<CouponEdit />) },
      { path: 'sms/updateCoupon/:id', element: lazyEl(<CouponEdit />) },
      { path: 'sms/brand', element: lazyEl(<HomeBrand />) },
      { path: 'sms/new', element: lazyEl(<HomeNew />) },
      { path: 'sms/hot', element: lazyEl(<HomeHot />) },
      { path: 'sms/subject', element: lazyEl(<HomeSubject />) },
      { path: 'sms/advertise', element: lazyEl(<Advertise />) },
      { path: 'sms/addAdvertise', element: lazyEl(<AdvertiseEdit />) },
      { path: 'sms/updateAdvertise/:id', element: lazyEl(<AdvertiseEdit />) },
      // UMS
      { path: 'ums/admin', element: lazyEl(<Admin />) },
      { path: 'ums/role', element: lazyEl(<Role />) },
      { path: 'ums/menu', element: lazyEl(<Menu />) },
      { path: 'ums/resource', element: lazyEl(<Resource />) },
    ],
  },
  { path: '*', element: <Navigate to="/home" replace /> },
])

export default router
