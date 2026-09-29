import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TabLayout } from '@/layout/TabLayout'
import { RequireAuth } from '@/router/RequireAuth'

// 懒加载页面，减小首屏体积
const Index = lazy(() => import('@/pages/index'))
const Category = lazy(() => import('@/pages/category'))
const Cart = lazy(() => import('@/pages/cart'))
const User = lazy(() => import('@/pages/user'))
const Login = lazy(() => import('@/pages/login'))
const Register = lazy(() => import('@/pages/register'))
const ProductList = lazy(() => import('@/pages/product/list'))
const ProductSearch = lazy(() => import('@/pages/product/search'))
const ProductDetail = lazy(() => import('@/pages/product/detail'))
const HotProductList = lazy(() => import('@/pages/product/hot'))
const NewProductList = lazy(() => import('@/pages/product/new'))
const OrderCreate = lazy(() => import('@/pages/order/create'))
const OrderList = lazy(() => import('@/pages/order/list'))
const OrderDetail = lazy(() => import('@/pages/order/detail'))
const AddressList = lazy(() => import('@/pages/address/list'))
const AddressManage = lazy(() => import('@/pages/address/manage'))
const Pay = lazy(() => import('@/pages/money/pay'))
const PaySuccess = lazy(() => import('@/pages/money/paySuccess'))

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <span style={{ color: '#909399', fontSize: '28px' }}>加载中...</span>
  </div>
)

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* 带 TabBar 的主路由 */}
          <Route element={<TabLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/category" element={<Category />} />
            <Route
              path="/cart"
              element={
                <RequireAuth>
                  <Cart />
                </RequireAuth>
              }
            />
            <Route
              path="/user"
              element={
                <RequireAuth>
                  <User />
                </RequireAuth>
              }
            />
          </Route>

          {/* 不带 TabBar 的子页面 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/list" element={<ProductList />} />
          <Route path="/product/search" element={<ProductSearch />} />
          <Route path="/product/detail/:id" element={<ProductDetail />} />
          <Route path="/product/hot" element={<HotProductList />} />
          <Route path="/product/new" element={<NewProductList />} />

          <Route
            path="/order/create"
            element={
              <RequireAuth>
                <OrderCreate />
              </RequireAuth>
            }
          />
          <Route
            path="/order/list"
            element={
              <RequireAuth>
                <OrderList />
              </RequireAuth>
            }
          />
          <Route
            path="/order/detail/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />

          <Route
            path="/address/list"
            element={
              <RequireAuth>
                <AddressList />
              </RequireAuth>
            }
          />
          <Route
            path="/address/manage"
            element={
              <RequireAuth>
                <AddressManage />
              </RequireAuth>
            }
          />
          <Route
            path="/address/manage/:id"
            element={
              <RequireAuth>
                <AddressManage />
              </RequireAuth>
            }
          />

          <Route
            path="/money/pay"
            element={
              <RequireAuth>
                <Pay />
              </RequireAuth>
            }
          />
          <Route
            path="/money/paySuccess"
            element={
              <RequireAuth>
                <PaySuccess />
              </RequireAuth>
            }
          />

          {/* 兜底重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
