# Mall H5 应用迁移设计文档

> 将 `0resource/mall-app-web`(uniapp+Vue3) 的核心购物闭环功能迁移到 `mall/frontend/h5/` 下，使用 React 18 开发 H5 应用，不使用 uniapp。

## 一、背景与目标

### 源项目
- 路径：`/Users/litian.phil/phil/java/0resource/mall-app-web`
- 技术栈：uniapp + Vue3 + Pinia + vue-router + uni-ui
- 对接后端：mall-portal（端口 8085，源项目自带，当前 mall 仓库**没有**）
- 页面：27 个（含品牌、优惠券、消息、足迹、收藏、关注、设置等）

### 目标
- 在 `mall/frontend/h5/` 下新建独立的 React H5 应用
- 第一批迁移**核心购物闭环**：15 个页面
- 不影响现有 `mall/frontend`(React admin 后台)

### 后端现状（重要）
- `mall/Backend` 当前只有 **单体的 mall-admin 模块**（Spring Boot，端口 8082），提供 B 端管理接口
- **没有 mall-portal 模块**，也没有 mall-search/mall-portal 等微服务
- `mall-mbg` 生成的 mapper 只覆盖 Pms*/Sms*/Ums*（admin 相关），**没有** OmsOrder/OmsCartItem/UmsMember/UmsMemberReceiveAddress 等 C 端表的 mapper
- 即 H5 所需的 `/sso /home /product /cart /order /member/address` 等 C 端接口**后端目前都不存在**

### 本次会话范围
- **只做 H5 前端**，后端 mall-portal 模块另开任务
- H5 使用 **mock 数据**跑通所有页面交互
- 后端 portal 接口就绪后，前端只需改 `request.ts` baseURL 或关闭 mock 开关，无需改页面代码

### 非目标
- 不迁移小程序/App 端能力
- 不迁移品牌详情、优惠券列表、消息通知、足迹、收藏、关注等次要页面（第二批再说）
- 本次不写后端 portal 代码、不建 C 端表

## 二、整体架构

### 目录结构

在 `mall/frontend/h5/` 下新建独立 Vite 应用，与 admin 完全隔离：

```
mall/frontend/h5/
├── index.html
├── package.json            # 独立依赖
├── vite.config.ts          # 独立配置，proxy → mall-portal(8085)
├── tsconfig.json
├── .env.development        # VITE_API_BASE_URL=http://localhost:8085
├── .env.production
└── src/
    ├── main.tsx
    ├── App.tsx             # 路由根
    ├── api/
    │   ├── request.ts      # axios 封装
    │   ├── home.ts
    │   ├── product.ts
    │   ├── cart.ts
    │   ├── order.ts
    │   ├── address.ts
    │   ├── member.ts
    │   ├── brand.ts
    │   └── coupon.ts
    ├── types/              # 从源项目 types/ 原样迁移
    ├── store/              # zustand: member.ts, search.ts
    ├── router/
    │   └── index.tsx
    ├── layout/
    │   └── TabLayout.tsx   # 底部 TabBar 布局
    ├── components/         # Empty, Stepper
    ├── pages/
    │   ├── index/          # 首页
    │   ├── category/       # 分类
    │   ├── cart/           # 购物车
    │   ├── user/           # 我的
    │   ├── public/         # login, register
    │   ├── product/        # list, search, detail, hot, new
    │   ├── order/          # create, list, detail
    │   ├── address/        # list, manage
    │   └── money/          # pay, paySuccess
    ├── styles/
    │   ├── global.css
    │   └── variables.css
    └── utils/
        ├── date.ts
        └── format.ts
```

### 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | React 18 + TypeScript 5 | 与 admin 一致 |
| 构建 | Vite 6 | 与 admin 一致 |
| UI 组件库 | antd-mobile 5 | 移动端组件 |
| 路由 | react-router-dom 6 + BrowserRouter | 按用户选择 |
| HTTP | axios 1.7 | 与 admin 一致，独立实例 |
| 状态管理 | zustand 5 + persist | 替代 Pinia |
| 样式 | CSS Modules + 全局 CSS | 配合 postcss-px-to-viewport |

## 三、页面清单（第一批，共 15 个）

| 分组 | 页面 | 路由 | 说明 |
|---|---|---|---|
| TabBar | 首页 | `/index` | 轮播广告 + 品牌直供 + 秒杀 + 新品 + 人气推荐 |
| TabBar | 分类 | `/category` | 左侧分类树 + 右侧商品列表 |
| TabBar | 购物车 | `/cart` | 列表 + 选中 + 数量 + 结算 |
| TabBar | 我的 | `/user` | 用户信息 + 功能入口 |
| 用户 | 登录 | `/login` | 用户名密码登录 |
| 用户 | 注册 | `/register` | 注册 + 验证码 |
| 商品 | 商品列表 | `/product/list` | 搜索结果 + 筛选排序 |
| 商品 | 搜索 | `/product/search` | 搜索框 + 历史记录 |
| 商品 | 商品详情 | `/product/detail/:id` | 轮播 + 规格 + 详情 + 加购 |
| 商品 | 人气推荐 | `/product/hot` | 人气商品列表 |
| 商品 | 新鲜好物 | `/product/new` | 新品列表 |
| 订单 | 创建订单 | `/order/create` | 地址 + 商品 + 优惠券 + 提交 |
| 订单 | 订单列表 | `/order/list` | 按状态分页列表 |
| 订单 | 订单详情 | `/order/detail/:id` | 订单信息 + 操作 |
| 地址 | 地址列表 | `/address/list` | 收货地址列表 |
| 地址 | 地址管理 | `/address/manage` | 新增/编辑地址 |
| 支付 | 支付页 | `/money/pay` | 选择支付方式 |
| 支付 | 支付成功 | `/money/paySuccess` | 支付结果展示 |

> 实际页面文件 15 个（合并部分入口），路由 18 条。

## 四、Mock 策略（本次会话核心）

由于后端 portal 接口尚未实现，H5 第一批使用 mock 数据：

### Mock 实现方式

在 `h5/src/mock/` 下建立 mock 数据文件，通过 axios 拦截器或 vite-plugin-mock 实现：

```
h5/src/mock/
├── home.ts        # 首页内容 mock
├── product.ts     # 商品列表/详情/分类 mock
├── cart.ts        # 购物车 mock（localStorage 持久化）
├── order.ts       # 订单 mock（localStorage 持久化）
├── address.ts     # 地址 mock（localStorage 持久化）
├── member.ts      # 登录/用户信息 mock
└── index.ts       # mock 注册入口
```

### Mock 开关

- `.env.development`: `VITE_USE_MOCK=true`
- `.env.production`: `VITE_USE_MOCK=false`
- `vite.config.ts` 根据 `VITE_USE_MOCK` 决定是否启用 `vite-plugin-mock`
- 启用 mock 时不走 proxy，禁用时 proxy → 8085（后端就绪后）

### Mock 数据原则

- 数据结构严格遵循 `types/` 定义，便于后端就绪后无缝切换
- 购物车、订单、地址等需持久化的数据用 localStorage 存储
- 登录 mock：任意账号密码返回 token（`Bearer mock-token`）+ 用户信息
- 商品数据参考源项目 `static/` 下的图片，使用占位图

## 五、API 层设计

### request.ts

axios 实例，与 admin 的 `utils/request.ts` 风格一致但独立配置：

- `baseURL`: `/api`（mock 开启时由 vite-plugin-mock 拦截；关闭时由 vite proxy 转发到 mall-portal 8085）
- 请求拦截：添加 `source-client: miniapp`；有 token 则加 `Authorization`
- 响应拦截：
  - HTTP 2xx 且 `res.code === 200` → 返回 `res.data`（业务层直接拿 data）
  - `code === 401` → 清 token + 跳 `/login`
  - 其他业务错误 → `Toast.show({ content: res.message })` + reject
  - 网络错误 → `Toast.show('网络异常')`

### API 文件迁移

从源项目 `apis/` 迁移，仅做以下调整：

| 源调用 | 迁移后 |
|---|---|
| `http({ method: 'GET', url, params })` | `request< T >({ method: 'GET', url, params })` |
| `http({ method: 'POST', url, data })` | `request< T >({ method: 'POST', url, data })` |
| `http({ method: 'GET', url, data: params })` | 改为 `params`（GET 不应用 data） |

涉及文件：`home.ts, product.ts, cart.ts, order.ts, address.ts, member.ts, brand.ts, coupon.ts`

### 类型定义迁移

源项目 `types/` 已是 `.d.ts` 纯类型文件，无 Vue 依赖，直接复制：
`common.d.ts, home.d.ts, product.d.ts, brand.d.ts, cart.d.ts, order.d.ts, address.d.ts, member.d.ts, coupon.d.ts`

## 五、状态管理（zustand）

### memberStore

```typescript
interface MemberState {
  memberInfo: MemberInfo | null
  token: string
  hasLogin: boolean
  login: (username: string, password: string) => Promise<void>
  fetchMemberInfo: () => Promise<void>
  logout: () => void
}
```

- `login`：调 `loginAPI` → 拼 `tokenHead + token` → 存 store + localStorage
- `fetchMemberInfo`：调 `getMemberInfoAPI`
- `logout`：清 memberInfo + token
- persist 到 localStorage

### searchStore

- `historyList: string[]`
- `addKeyword / removeKeyword / clearHistory`
- persist

## 六、路由设计

BrowserRouter，根路由 `/`：

```typescript
const routes = [
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: <TabLayout />,   // 含底部 TabBar
    children: [
      { path: 'index', element: <Index /> },
      { path: 'category', element: <Category /> },
      { path: 'cart', element: <Cart /> },      // 需登录
      { path: 'user', element: <User /> },       // 需登录
    ],
  },
  // 非 TabBar 页面，独立路由
  { path: '/product/list', element: <ProductList /> },
  { path: '/product/search', element: <ProductSearch /> },
  { path: '/product/detail/:id', element: <ProductDetail /> },
  { path: '/product/hot', element: <HotProductList /> },
  { path: '/product/new', element: <NewProductList /> },
  { path: '/order/create', element: <RequireAuth><CreateOrder /></RequireAuth> },
  { path: '/order/list', element: <RequireAuth><OrderList /></RequireAuth> },
  { path: '/order/detail/:id', element: <RequireAuth><OrderDetail /></RequireAuth> },
  { path: '/address/list', element: <RequireAuth><AddressList /></RequireAuth> },
  { path: '/address/manage', element: <RequireAuth><AddressManage /></RequireAuth> },
  { path: '/money/pay', element: <RequireAuth><Pay /></RequireAuth> },
  { path: '/money/paySuccess', element: <RequireAuth><PaySuccess /></RequireAuth> },
  { path: '*', element: <Navigate to="/index" replace /> },
]
```

### RequireAuth

包裹需登录页面，无 token 跳 `/login`，登录后回跳原路径。

## 七、样式与 H5 适配

### 设计基准

- 设计稿宽度 750px（源项目 rpx 基准）
- 使用 `postcss-px-to-viewport-8-plugin` 将 px 转为 vw，1px = 1/7.5 vw
- antd-mobile 组件尺寸保持原样

### 主题色

```css
:root {
  --primary-color: #fa436a;       /* 源项目主题色 */
  --bg-color: #f8f8f8;
  --text-color: #303133;
  --text-color-secondary: #606266;
  --border-color: #e4e7ed;
}
```

### 安全区适配

- 底部 TabBar：`padding-bottom: env(safe-area-inset-bottom)`
- 顶部状态栏：使用 antd-mobile `NavBar` 自带安全区

### 全局样式

- 引入 antd-mobile ResetCSS
- `body { font-family: -apple-system, ... }`
- `img { display: block }`

## 八、Vite 配置

```typescript
// h5/vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'
import postcssPxToViewport from 'postcss-px-to-viewport-8-plugin'
import path from 'node:path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_USE_MOCK === 'true'
  return {
    plugins: [
      react(),
      viteMockServe({
        mockPath: 'src/mock',
        enable: useMock,
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    css: {
      postcss: {
        plugins: [
          postcssPxToViewport({
            viewportWidth: 750,
            unitToConvert: 'px',
            viewportUnit: 'vw',
          }),
        ],
      },
    },
    server: {
      port: 5174,  // 与 admin(5173) 错开
      open: true,
      proxy: useMock
        ? undefined
        : {
            '/api': {
              target: env.VITE_API_BASE_URL || 'http://localhost:8085',
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/api/, ''),
            },
          },
    },
  }
})
```

## 九、错误处理

- 网络错误/业务错误统一在 axios 拦截器 `Toast.show` 提示
- 401 清 token + 跳 `/login`
- 页面级 loading：用 antd-mobile `SpinLoading`
- 列表空状态：自定义 `Empty` 组件
- 下拉刷新/上拉加载：antd-mobile `PullToRefresh` + `InfiniteScroll`

## 十、测试策略

第一批不写单测，以页面跑通为准（与 admin 一致）。验收方式：
1. `pnpm dev` 启动 H5（5174），mock 模式
2. 浏览器移动端模拟器访问，走通：首页 → 商品详情 → 加购 → 购物车 → 下单 → 支付成功
3. 验证登录态持久化、401 跳转
4. 后端 portal 就绪后，改 `.env` 的 `VITE_USE_MOCK=false`，同一套页面应无缝切换到真实接口

## 十一、实施顺序

1. **脚手架**：创建 `h5/` 目录、package.json、vite/ts 配置、入口文件、env
2. **基础设施**：request.ts、types/、store/、router/、layout/、global.css、mock 框架
3. **Mock 数据**：home/product/cart/order/address/member mock 文件
4. **用户模块**：login、register、memberStore
5. **首页 + 分类**：index、category
6. **商品模块**：list、search、detail、hot、new
7. **购物车**：cart（含 localStorage 持久化 mock）
8. **订单 + 地址 + 支付**：create、list、detail、address、money
9. **联调验收**：启动 dev，mock 模式走通主流程

## 十二、环境要求

- 本次只需 Node 18+ 和 pnpm，**不需要后端**
- 后端 portal 就绪后（另开任务），改 env 切换为真实接口
