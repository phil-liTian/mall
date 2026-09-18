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
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import {
  listReturnApply,
  deleteReturnApply,
  type OmsReturnApply,
  type ReturnApplyQueryParams,
} from '@/api/returnApply'

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待处理', color: 'orange' },
  1: { text: '退货中', color: 'blue' },
  2: { text: '已完成', color: 'green' },
  3: { text: '已拒绝', color: 'red' },
}

export function renderReturnStatus(status: number) {
  const s = statusMap[status] || { text: '未知', color: 'default' }
  return <Tag color={s.color}>{s.text}</Tag>
}

type Filters = Omit<ReturnApplyQueryParams, 'pageNum' | 'pageSize'>

export default function ReturnApplyPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<OmsReturnApply[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Filters>({})
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listReturnApply({ pageNum, pageSize, ...filters })
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
    const range = values.handleTimeRange
    setPageNum(1)
    setFilters({
      receiverKeyword: values.receiverKeyword,
      status: values.status,
      handleTime: range?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
    })
  }

  const handleReset = () => {
    form.resetFields()
    setPageNum(1)
    setFilters({})
  }

  const handleDelete = async (id: number) => {
    await deleteReturnApply([id])
    message.success('删除成功')
    fetchData()
  }

  const columns: ColumnsType<OmsReturnApply> = [
    { title: '申请编号', dataIndex: 'id' },
    { title: '申请状态', dataIndex: 'status', render: (v: number) => renderReturnStatus(v) },
    { title: '订单编号', dataIndex: 'orderSn' },
    { title: '申请时间', dataIndex: 'createTime' },
    { title: '用户账号', dataIndex: 'memberUsername' },
    { title: '退款金额', dataIndex: 'returnAmount', render: (v: number) => `￥${v}` },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/oms/returnApplyDetail/${record.id}`)}
          >
            查看详情
          </Button>
          <Popconfirm title="确定删除该申请吗？" onConfirm={() => handleDelete(record.id)}>
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
        <Form.Item name="receiverKeyword" label="收货人">
          <Input placeholder="请输入收货人" allowClear />
        </Form.Item>
        <Form.Item name="status" label="申请状态">
          <Select
            placeholder="全部"
            allowClear
            style={{ width: 120 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v.text, value: Number(k) }))}
          />
        </Form.Item>
        <Form.Item name="handleTimeRange" label="处理时间">
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
