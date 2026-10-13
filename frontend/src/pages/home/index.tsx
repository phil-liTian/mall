import type { ReactNode } from 'react'
import { Card, Col, Row, Statistic, Tag, Typography, theme } from 'antd'
import {
  ShoppingOutlined,
  ProfileOutlined,
  SoundOutlined,
  TeamOutlined,
  BgColorsOutlined,
  BulbOutlined,
  AppstoreOutlined,
  LockOutlined,
  SearchOutlined,
  SafetyOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

const tagGroups = [
  {
    side: '前端',
    tags: ['React 18', 'TypeScript 5.7', 'Vite 6', 'Ant Design 5', 'React Router 6', 'zustand', 'Axios'],
  },
  {
    side: '后端',
    tags: [
      'Spring Boot 2.7',
      'JDK 8',
      'MyBatis',
      'MySQL 8',
      'Redis 7',
      'Spring Security',
      'JWT',
      'MinIO',
      'Docker',
    ],
  },
]

const overview = [
  { title: '业务模块', value: 4, suffix: '个' },
  { title: '功能页面', value: 20, suffix: '个' },
  { title: '前端 API 模块', value: 18, suffix: '个' },
  { title: '后端 Maven 模块', value: 5, suffix: '个' },
]

const frontendStack = [
  {
    layer: '框架',
    name: 'React 18 + TypeScript 5.7',
    desc: '全函数组件 + Hooks，接口出入参与业务模型均有 TS 类型约束',
  },
  {
    layer: '构建',
    name: 'Vite 6',
    desc: '开发期 ESM 按需编译，生产构建先 tsc -b 做全量类型检查再打包',
  },
  {
    layer: 'UI',
    name: 'Ant Design 5',
    desc: 'ConfigProvider 统一注入主题算法、主色与 CSS 变量，配中文语言包',
  },
  {
    layer: '路由',
    name: 'React Router 6',
    desc: 'createBrowserRouter 配置式路由，页面全部 lazy 懒加载，RequireAuth 拦截未登录访问',
  },
  {
    layer: '状态',
    name: 'zustand',
    desc: 'auth 保存登录态与用户信息，pref 经 persist 中间件把主题偏好落到 localStorage',
  },
  {
    layer: '请求',
    name: 'Axios',
    desc: '单实例统一 baseURL，请求拦截注入 Bearer Token，响应拦截解包 CommonResult 并在 401 时清登录态',
  },
  {
    layer: '导航',
    name: 'menuConfig 单一数据源',
    desc: '侧边栏菜单、面包屑、多标签页标题全部由同一份配置推导，新增页面只改一处',
  },
]

const backendStack = [
  {
    layer: '框架',
    name: 'Spring Boot 2.7.5 / JDK 8',
    desc: 'Maven 多模块聚合工程，管理端 mall-admin 与 C 端 mall-portal 两个服务独立部署',
  },
  {
    layer: '分层',
    name: 'admin / portal / security / mbg / common',
    desc: '接口层按端拆分，安全、数据访问与通用能力下沉为可复用模块',
  },
  {
    layer: '持久层',
    name: 'MyBatis + MyBatis Generator',
    desc: '实体与 Mapper 依据表结构生成，统一收敛在 mall-mbg 模块',
  },
  {
    layer: '数据源',
    name: 'MySQL 8 + Druid + PageHelper',
    desc: 'Druid 提供连接池与监控，PageHelper 以插件方式实现物理分页',
  },
  {
    layer: '缓存',
    name: 'Redis 7',
    desc: '经 Spring Data Redis 接入，承载热点数据缓存与登录态',
  },
  {
    layer: '安全',
    name: 'Spring Security + jjwt',
    desc: '无状态 JWT 鉴权，结合 RBAC 模型做到接口级权限控制',
  },
  {
    layer: '存储',
    name: 'MinIO',
    desc: '兼容 S3 协议的对象存储，承接商品图片等文件上传',
  },
  {
    layer: '文档',
    name: 'Springdoc OpenAPI',
    desc: '由注解自动生成 Swagger 接口文档，前后端按同一份契约联调',
  },
  {
    layer: '部署',
    name: 'Docker + Nginx',
    desc: '各服务容器化编排，前端构建产物由 Nginx 托管并将 /api 反代到后端',
  },
]

type ModuleItem = {
  key: string
  name: string
  icon: ReactNode
  color: string
  desc: string
  pages: string[]
  /** 该模块在 h5 商城（C 端）的对应页面 */
  portalPages?: string[]
}

const modules: ModuleItem[] = [
  {
    key: 'pms',
    name: 'PMS 商品',
    icon: <ShoppingOutlined />,
    color: '#1677ff',
    desc: '维护商品主数据，覆盖商品信息、分类树、属性参数模板与品牌资料',
    pages: ['商品列表', '商品分类', '商品类型', '品牌管理'],
  },
  {
    key: 'oms',
    name: 'OMS 订单',
    icon: <ProfileOutlined />,
    color: '#52c41a',
    desc: '承接订单全链路，含订单详情追踪、发货处理、退货审核与超时规则配置；用户在 h5 商城提交售后申请与商品评价，后台在此审核退货并查看评价数据',
    pages: ['订单列表', '订单设置', '退货申请处理', '退货原因设置'],
    portalPages: ['申请售后', '退款/售后列表', '售后详情', '发表评价', '我的评价', '商详页评价'],
  },
  {
    key: 'sms',
    name: 'SMS 营销',
    icon: <SoundOutlined />,
    color: '#faad14',
    desc: '管理促销玩法与商城首页运营位，包括秒杀、优惠券及各类推荐广告',
    pages: ['秒杀活动', '优惠券', '品牌推荐', '新品推荐', '人气推荐', '专题推荐', '广告列表'],
  },
  {
    key: 'ums',
    name: 'UMS 权限',
    icon: <TeamOutlined />,
    color: '#f5222d',
    desc: '基于 RBAC 的后台权限体系，按用户—角色—菜单/资源三级进行授权',
    pages: ['用户列表', '角色列表', '菜单列表', '资源列表'],
  },
]

const capabilities = [
  { icon: <BulbOutlined />, title: '深浅色主题', desc: '支持浅色、深色与跟随系统三种模式' },
  { icon: <BgColorsOutlined />, title: '主题色切换', desc: '内置 12 种主色，实时生效' },
  { icon: <AppstoreOutlined />, title: '多标签页', desc: '页面以标签形式驻留，可一键关闭' },
  { icon: <SearchOutlined />, title: '全局搜索', desc: '⌘K / Ctrl+K 唤起，直达任意页面' },
  { icon: <LockOutlined />, title: '锁屏', desc: '离开工位时锁定界面，解锁后回到原页' },
  { icon: <SafetyOutlined />, title: '路由守卫', desc: '未登录自动跳转，登录态失效即时清理' },
]

export default function Home() {
  const { token } = theme.useToken()

  return (
    <div>
      <Card>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          mall 电商后台管理系统
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          面向电商业务的一体化管理后台，覆盖商品、订单、营销与权限四条主线。
          采用前后端分离架构：React 单页应用负责交互，Spring Boot 多模块服务负责业务与数据，
          两端通过统一的 RESTful 接口与 JWT 鉴权协作。
        </Paragraph>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tagGroups.map((g) => (
            <div key={g.side} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 13, minWidth: 32 }}>
                {g.side}
              </Text>
              {g.tags.map((t) => (
                <Tag key={t} color={token.colorPrimary} style={{ margin: 0 }}>
                  {t}
                </Tag>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {overview.map((o) => (
          <Col xs={24} sm={12} xl={6} key={o.title}>
            <Card>
              <Statistic
                title={o.title}
                value={o.value}
                suffix={o.suffix}
                valueStyle={{ color: token.colorPrimary }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {[
        { title: '前端技术栈', items: frontendStack },
        { title: '后端技术栈', items: backendStack },
      ].map((section) => (
        <Card title={section.title} style={{ marginTop: 16 }} key={section.title}>
          <Row gutter={[16, 16]}>
            {section.items.map((t) => (
              <Col xs={24} lg={12} key={t.layer}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Tag
                    style={{
                      margin: 0,
                      height: 'fit-content',
                      minWidth: 48,
                      textAlign: 'center',
                    }}
                  >
                    {t.layer}
                  </Tag>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong>{t.name}</Text>
                    <div style={{ color: token.colorTextSecondary, fontSize: 13, marginTop: 2 }}>
                      {t.desc}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      ))}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {modules.map((m) => (
          <Col xs={24} sm={12} xl={6} key={m.key}>
            <Card style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ color: m.color, fontSize: 20 }}>{m.icon}</span>
                <Text strong style={{ fontSize: 16 }}>
                  {m.name}
                </Text>
              </div>
              <div
                style={{
                  color: token.colorTextSecondary,
                  fontSize: 13,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
              >
                {m.desc}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {m.pages.map((p) => (
                  <Tag key={p} style={{ margin: 0 }}>
                    {p}
                  </Tag>
                ))}
              </div>
              {m.portalPages && (
                <>
                  <div
                    style={{
                      color: token.colorTextTertiary,
                      fontSize: 12,
                      margin: '12px 0 8px',
                    }}
                  >
                    h5 商城（C 端）
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {m.portalPages.map((p) => (
                      <Tag key={p} color={m.color} style={{ margin: 0 }}>
                        {p}
                      </Tag>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="前端交互能力" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {capabilities.map((c) => (
            <Col xs={24} sm={12} xl={8} key={c.title}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: token.colorPrimary, fontSize: 18, lineHeight: '22px' }}>
                  {c.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong>{c.title}</Text>
                  <div style={{ color: token.colorTextSecondary, fontSize: 13, marginTop: 2 }}>
                    {c.desc}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
