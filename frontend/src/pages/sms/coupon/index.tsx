import { useEffect, useState } from 'react'
import { Table, Input, Space, Button, Select, Tag, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { listCoupon, deleteCoupon, type SmsCoupon } from '@/api/coupon'

const typeMap = ['全场赠券', '会员赠券', '购物赠券', '注册赠券']

export default function CouponPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<SmsCoupon[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [name, setName] = useState('')
  const [type, setType] = useState<number | undefined>(undefined)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listCoupon({ name, type, pageNum, pageSize })
      setDataSource(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize])

  const handleSearch = () => {
    setPageNum(1)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteCoupon(id)
    message.success('删除成功')
    fetchData()
  }

  const columns: ColumnsType<SmsCoupon> = [
    { title: '优惠券名称', dataIndex: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (t: number) => <Tag color="blue">{typeMap[t] ?? '未知'}</Tag>,
    },
    { title: '面值', dataIndex: 'amount', render: (v: number) => `￥${v}` },
    { title: '发行量', dataIndex: 'publishCount' },
    { title: '已领取', dataIndex: 'receiveCount' },
    { title: '已使用', dataIndex: 'useCount' },
    {
      title: '有效期',
      key: 'validity',
      render: (_, record) => `${record.startTime} ~ ${record.endTime}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">
            查看领取详情
          </Button>
          <Button type="link" size="small" onClick={() => navigate(`/sms/updateCoupon/${record.id}`)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该优惠券吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="请输入优惠券名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Select
          placeholder="请选择类型"
          style={{ width: 160 }}
          value={type}
          onChange={setType}
          allowClear
          options={typeMap.map((label, value) => ({ label, value }))}
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="primary" onClick={() => navigate('/sms/addCoupon')}>
          添加
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPageNum(p)
            setPageSize(s)
          },
        }}
      />
    </div>
  )
}
