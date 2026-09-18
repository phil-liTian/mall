import { useEffect, useState } from 'react'
import { Table, Input, Space, Button, Switch, Select, message, Popconfirm, Image } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import {
  listBrand,
  deleteBrand,
  deleteBrandBatch,
  updateBrandShowStatus,
  updateBrandFactoryStatus,
  type PmsBrand,
} from '@/api/brand'

export default function BrandPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PmsBrand[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [showStatus, setShowStatus] = useState<number | undefined>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listBrand({ keyword, showStatus, pageNum, pageSize })
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

  const handleShow = async (record: PmsBrand, checked: boolean) => {
    await updateBrandShowStatus({ ids: [record.id], showStatus: checked ? 1 : 0 })
    message.success('操作成功')
    fetchData()
  }

  const handleFactory = async (record: PmsBrand, checked: boolean) => {
    await updateBrandFactoryStatus({ ids: [record.id], factoryStatus: checked ? 1 : 0 })
    message.success('操作成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteBrand(id)
    message.success('删除成功')
    fetchData()
  }

  const handleBatchDelete = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择品牌')
      return
    }
    await deleteBrandBatch(selectedRowKeys)
    message.success('批量删除成功')
    setSelectedRowKeys([])
    fetchData()
  }

  const columns: ColumnsType<PmsBrand> = [
    {
      title: 'Logo',
      dataIndex: 'logo',
      width: 80,
      render: (logo: string) => (logo ? <Image src={logo} width={40} height={40} /> : '-'),
    },
    { title: '品牌名称', dataIndex: 'name' },
    { title: '首字母', dataIndex: 'firstLetter', width: 80 },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '品牌制造商',
      dataIndex: 'factoryStatus',
      width: 110,
      render: (v: number, record) => (
        <Switch checked={v === 1} onChange={(c) => handleFactory(record, c)} />
      ),
    },
    {
      title: '是否显示',
      dataIndex: 'showStatus',
      width: 100,
      render: (v: number, record) => (
        <Switch checked={v === 1} onChange={(c) => handleShow(record, c)} />
      ),
    },
    { title: '相关商品数', dataIndex: 'productCount', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/pms/updateBrand/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该品牌吗？" onConfirm={() => handleDelete(record.id)}>
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
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="品牌名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 180 }}
        />
        <Select
          placeholder="显示状态"
          value={showStatus}
          onChange={setShowStatus}
          allowClear
          style={{ width: 120 }}
          options={[
            { label: '显示', value: 1 },
            { label: '不显示', value: 0 },
          ]}
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="primary" onClick={() => navigate('/pms/addBrand')}>
          添加品牌
        </Button>
        <Popconfirm title="确定批量删除选中品牌吗？" onConfirm={handleBatchDelete}>
          <Button danger>批量删除</Button>
        </Popconfirm>
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
