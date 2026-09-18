import { useEffect, useState } from 'react'
import { Table, Input, Space, Button, Switch, Image, Tag, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import {
  listAdvertise,
  deleteAdvertise,
  updateAdvertiseStatus,
  type SmsHomeAdvertise,
} from '@/api/advertise'

const positionMap: Record<number, string> = { 1: 'PC首页轮播', 2: 'APP首页轮播' }

export default function AdvertisePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<SmsHomeAdvertise[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [name, setName] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listAdvertise({ name, pageNum, pageSize })
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

  const handleStatusChange = async (record: SmsHomeAdvertise, checked: boolean) => {
    await updateAdvertiseStatus(record.id, checked ? 1 : 0)
    message.success('状态修改成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteAdvertise([id])
    message.success('删除成功')
    fetchData()
  }

  const columns: ColumnsType<SmsHomeAdvertise> = [
    { title: '广告名称', dataIndex: 'name' },
    {
      title: '图片',
      dataIndex: 'pic',
      render: (pic: string) => <Image src={pic} width={80} />,
    },
    {
      title: '广告位置',
      dataIndex: 'type',
      render: (t: number) => <Tag color="blue">{positionMap[t] ?? '未知'}</Tag>,
    },
    { title: '开始时间', dataIndex: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime' },
    {
      title: '上下线状态',
      dataIndex: 'status',
      render: (status: number, record) => (
        <Switch checked={status === 1} onChange={(checked) => handleStatusChange(record, checked)} />
      ),
    },
    { title: '排序', dataIndex: 'sort' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/sms/updateAdvertise/${record.id}`)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该广告吗？" onConfirm={() => handleDelete(record.id)}>
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
          placeholder="请输入广告名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="primary" onClick={() => navigate('/sms/addAdvertise')}>
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
