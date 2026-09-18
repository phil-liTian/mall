import { useEffect, useState } from 'react'
import { Table, Input, Space, Button, Switch, Select, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { homeNewApi, type HomeRecommend } from '@/api/homeRecommend'

const statusOptions = [
  { label: '已推荐', value: 1 },
  { label: '未推荐', value: 0 },
]

export default function HomeNewPage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<HomeRecommend[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [productName, setProductName] = useState('')
  const [recommendStatus, setRecommendStatus] = useState<number | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await homeNewApi.list({ productName, recommendStatus, pageNum, pageSize })
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

  const handleStatusChange = async (record: HomeRecommend, checked: boolean) => {
    await homeNewApi.updateRecommendStatus({ ids: [record.id], recommendStatus: checked ? 1 : 0 })
    message.success('推荐状态修改成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await homeNewApi.delete([id])
    message.success('删除成功')
    fetchData()
  }

  const handleBatchDelete = async () => {
    await homeNewApi.delete(selectedIds)
    message.success('批量删除成功')
    setSelectedIds([])
    fetchData()
  }

  const handleBatchStatus = async (recommendStatusValue: number) => {
    await homeNewApi.updateRecommendStatus({ ids: selectedIds, recommendStatus: recommendStatusValue })
    message.success('批量修改成功')
    setSelectedIds([])
    fetchData()
  }

  const columns: ColumnsType<HomeRecommend> = [
    { title: '商品名称', dataIndex: 'productName' },
    {
      title: '推荐状态',
      dataIndex: 'recommendStatus',
      render: (status: number, record) => (
        <Switch checked={status === 1} onChange={(checked) => handleStatusChange(record, checked)} />
      ),
    },
    { title: '排序', dataIndex: 'sort' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="请输入商品名称"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Select
          placeholder="请选择推荐状态"
          style={{ width: 160 }}
          value={recommendStatus}
          onChange={setRecommendStatus}
          allowClear
          options={statusOptions}
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button disabled={!selectedIds.length} onClick={() => handleBatchStatus(1)}>
          批量推荐
        </Button>
        <Button disabled={!selectedIds.length} onClick={() => handleBatchStatus(0)}>
          批量取消
        </Button>
        <Popconfirm title="确定批量删除吗？" onConfirm={handleBatchDelete} disabled={!selectedIds.length}>
          <Button danger disabled={!selectedIds.length}>
            批量删除
          </Button>
        </Popconfirm>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as number[]),
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
