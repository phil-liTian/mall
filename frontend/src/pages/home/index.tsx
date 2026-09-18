import { Card, Col, Row, Statistic } from 'antd'
import {
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  ProfileOutlined,
} from '@ant-design/icons'

const stats = [
  { title: '今日订单', value: 128, icon: <ProfileOutlined />, color: '#1677ff' },
  { title: '今日销售额', value: 8674, prefix: '¥', icon: <DollarOutlined />, color: '#52c41a' },
  { title: '新增会员', value: 32, icon: <UserOutlined />, color: '#faad14' },
  { title: '待发货', value: 17, icon: <ShoppingCartOutlined />, color: '#f5222d' },
]

export default function Home() {
  return (
    <div>
      <Row gutter={16}>
        {stats.map((s) => (
          <Col span={6} key={s.title}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={s.prefix}
                valueStyle={{ color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="欢迎使用 mall 电商后台管理系统" style={{ marginTop: 16 }}>
        <p>本系统基于 React + Vite + Ant Design 构建，接口当前由 vite-plugin-mock 提供。</p>
        <p>后端接口就绪后，将 src/api 中的地址指向真实服务并移除 mock 即可无缝替换。</p>
      </Card>
    </div>
  )
}
