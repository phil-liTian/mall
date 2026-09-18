import { useEffect, useState } from 'react'
import {
  Table,
  Form,
  Input,
  Space,
  Button,
  Select,
  DatePicker,
  Tag,
  message,
  Popconfirm,
  Modal,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import {
  listOrder,
  deliveryOrder,
  closeOrder,
  deleteOrder,
  type OmsOrder,
  type OrderQueryParams,
} from '@/api/order'

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待付款', color: 'orange' },
  1: { text: '待发货', color: 'blue' },
  2: { text: '已发货', color: 'cyan' },
  3: { text: '已完成', color: 'green' },
  4: { text: '已关闭', color: 'default' },
  5: { text: '无效订单', color: 'red' },
}

const payTypeMap: Record<number, string> = { 0: '未支付', 1: '支付宝', 2: '微信' }
const sourceTypeMap: Record<number, string> = { 0: 'PC订单', 1: 'APP订单' }

export function renderOrderStatus(status: number) {
  const s = statusMap[status] || { text: '未知', color: 'default' }
  return <Tag color={s.color}>{s.text}</Tag>
}

type Filters = Omit<OrderQueryParams, 'pageNum' | 'pageSize'>

export default function OrderListPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<OmsOrder[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Filters>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listOrder({ pageNum, pageSize, ...filters })
      setDataSource(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize, filters])

  const handleSearch = () => {
    const values = form.getFieldsValue()
    const range = values.createTimeRange
    const next: Filters = {
      orderSn: values.orderSn,
      receiverKeyword: values.receiverKeyword,
      status: values.status,
      orderType: values.orderType,
      createTime: range?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      createTimeEnd: range?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    }
    setPageNum(1)
    setFilters(next)
  }

  const handleReset = () => {
    form.resetFields()
    setPageNum(1)
    setFilters({})
  }

  const handleDelete = async (ids: number[]) => {
    await deleteOrder(ids)
    message.success('删除成功')
    setSelectedRowKeys([])
    fetchData()
  }

  const handleClose = async (ids: number[]) => {
    await closeOrder({ ids, note: '后台关闭订单' })
    message.success('关闭成功')
    setSelectedRowKeys([])
    fetchData()
  }

  const handleDelivery = async (ids: number[]) => {
    await deliveryOrder(
      ids.map((orderId) => ({ orderId, deliveryCompany: '顺丰速运', deliverySn: '' })),
    )
    message.success('发货成功')
    setSelectedRowKeys([])
    fetchData()
  }

  const batchAction = (action: (ids: number[]) => void, label: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择订单')
      return
    }
    Modal.confirm({
      title: `确定${label}选中的 ${selectedRowKeys.length} 条订单吗？`,
      onOk: () => action(selectedRowKeys),
    })
  }

  const columns: ColumnsType<OmsOrder> = [
    { title: '订单编号', dataIndex: 'orderSn' },
    { title: '提交时间', dataIndex: 'createTime' },
    { title: '用户账号', dataIndex: 'memberUsername' },
    { title: '订单金额', dataIndex: 'totalAmount', render: (v: number) => `￥${v}` },
    { title: '支付方式', dataIndex: 'payType', render: (v: number) => payTypeMap[v] ?? '-' },
    { title: '订单来源', dataIndex: 'sourceType', render: (v: number) => sourceTypeMap[v] ?? '-' },
    { title: '订单状态', dataIndex: 'status', render: (v: number) => renderOrderStatus(v) },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size={0} wrap>
          <Button type="link" size="small" onClick={() => navigate(`/oms/orderDetail/${record.id}`)}>
            详情
          </Button>
          <Popconfirm title="确定关闭该订单吗？" onConfirm={() => handleClose([record.id])}>
            <Button type="link" size="small">
              关闭
            </Button>
          </Popconfirm>
          <Button type="link" size="small" onClick={() => handleDelivery([record.id])}>
            发货
          </Button>
          <Popconfirm title="确定删除该订单吗？" onConfirm={() => handleDelete([record.id])}>
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
      <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item name="orderSn" label="订单编号">
          <Input placeholder="请输入订单编号" allowClear />
        </Form.Item>
        <Form.Item name="receiverKeyword" label="收货人">
          <Input placeholder="请输入收货人" allowClear />
        </Form.Item>
        <Form.Item name="status" label="订单状态">
          <Select
            placeholder="全部"
            allowClear
            style={{ width: 120 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v.text, value: Number(k) }))}
          />
        </Form.Item>
        <Form.Item name="orderType" label="订单分类">
          <Select
            placeholder="全部"
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '正常订单', value: 0 },
              { label: '秒杀订单', value: 1 },
            ]}
          />
        </Form.Item>
        <Form.Item name="createTimeRange" label="提交时间">
          <DatePicker.RangePicker showTime />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => batchAction(handleDelivery, '发货')}>批量发货</Button>
        <Button onClick={() => batchAction(handleClose, '关闭')}>批量关闭</Button>
        <Button danger onClick={() => batchAction(handleDelete, '删除')}>
          批量删除
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
        }}
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
