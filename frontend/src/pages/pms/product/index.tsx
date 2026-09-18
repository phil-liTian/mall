import { useEffect, useState } from 'react'
import {
  Table,
  Input,
  Space,
  Button,
  Switch,
  Select,
  message,
  Popconfirm,
  Image,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import {
  listProduct,
  updatePublishStatus,
  updateNewStatus,
  updateRecommendStatus,
  updateVerifyStatus,
  updateDeleteStatus,
  type PmsProduct,
} from '@/api/product'
import { listWithChildren, type PmsProductCategory } from '@/api/productCate'

const verifyText = ['未审核', '审核通过']
const verifyColor = ['orange', 'green']

export default function ProductPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PmsProduct[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [publishStatus, setPublishStatus] = useState<number | undefined>()
  const [verifyStatus, setVerifyStatus] = useState<number | undefined>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [cateOptions, setCateOptions] = useState<{ label: string; value: number }[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listProduct({
        keyword,
        productCategoryId: categoryId,
        publishStatus,
        verifyStatus,
        pageNum,
        pageSize,
      })
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

  useEffect(() => {
    listWithChildren().then((list: PmsProductCategory[]) => {
      const opts: { label: string; value: number }[] = []
      list.forEach((l1) => {
        opts.push({ label: l1.name, value: l1.id })
        l1.children?.forEach((l2) => opts.push({ label: `- ${l2.name}`, value: l2.id }))
      })
      setCateOptions(opts)
    })
  }, [])

  const handleSearch = () => {
    setPageNum(1)
    fetchData()
  }

  const handlePublish = async (record: PmsProduct, checked: boolean) => {
    await updatePublishStatus({ ids: [record.id], publishStatus: checked ? 1 : 0 })
    message.success('操作成功')
    fetchData()
  }

  const handleNew = async (record: PmsProduct, checked: boolean) => {
    await updateNewStatus({ ids: [record.id], newStatus: checked ? 1 : 0 })
    message.success('操作成功')
    fetchData()
  }

  const handleRecommend = async (record: PmsProduct, checked: boolean) => {
    await updateRecommendStatus({ ids: [record.id], recommendStatus: checked ? 1 : 0 })
    message.success('操作成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await updateDeleteStatus({ ids: [id], deleteStatus: 1 })
    message.success('删除成功')
    fetchData()
  }

  const batch = async (fn: () => Promise<unknown>) => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择商品')
      return
    }
    await fn()
    message.success('批量操作成功')
    setSelectedRowKeys([])
    fetchData()
  }

  const columns: ColumnsType<PmsProduct> = [
    {
      title: '图片',
      dataIndex: 'pic',
      width: 80,
      render: (pic: string) => (pic ? <Image src={pic} width={50} height={50} /> : '-'),
    },
    { title: '商品名称', dataIndex: 'name' },
    { title: '货号', dataIndex: 'productSn', width: 120 },
    { title: '价格', dataIndex: 'price', width: 100, render: (v: number) => `￥${v}` },
    {
      title: '新品',
      dataIndex: 'newStatus',
      width: 70,
      render: (v: number, record) => (
        <Switch checked={v === 1} onChange={(c) => handleNew(record, c)} />
      ),
    },
    {
      title: '推荐',
      dataIndex: 'recommandStatus',
      width: 70,
      render: (v: number, record) => (
        <Switch checked={v === 1} onChange={(c) => handleRecommend(record, c)} />
      ),
    },
    {
      title: '上架',
      dataIndex: 'publishStatus',
      width: 70,
      render: (v: number, record) => (
        <Switch checked={v === 1} onChange={(c) => handlePublish(record, c)} />
      ),
    },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '审核状态',
      dataIndex: 'verifyStatus',
      width: 90,
      render: (v: number) => <Tag color={verifyColor[v]}>{verifyText[v]}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/pms/updateProduct/${record.id}`)}
          >
            编辑
          </Button>
          <Button type="link" size="small">
            查看SKU
          </Button>
          <Popconfirm title="确定删除该商品吗？" onConfirm={() => handleDelete(record.id)}>
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
          placeholder="商品名称/货号"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 180 }}
        />
        <Select
          placeholder="商品分类"
          value={categoryId}
          onChange={setCategoryId}
          options={cateOptions}
          allowClear
          style={{ width: 160 }}
        />
        <Select
          placeholder="上架状态"
          value={publishStatus}
          onChange={setPublishStatus}
          allowClear
          style={{ width: 120 }}
          options={[
            { label: '已上架', value: 1 },
            { label: '未上架', value: 0 },
          ]}
        />
        <Select
          placeholder="审核状态"
          value={verifyStatus}
          onChange={setVerifyStatus}
          allowClear
          style={{ width: 120 }}
          options={[
            { label: '审核通过', value: 1 },
            { label: '未审核', value: 0 },
          ]}
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="primary" onClick={() => navigate('/pms/addProduct')}>
          添加商品
        </Button>
      </Space>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button
          onClick={() =>
            batch(() => updatePublishStatus({ ids: selectedRowKeys, publishStatus: 1 }))
          }
        >
          批量上架
        </Button>
        <Button
          onClick={() =>
            batch(() => updatePublishStatus({ ids: selectedRowKeys, publishStatus: 0 }))
          }
        >
          批量下架
        </Button>
        <Button
          onClick={() =>
            batch(() => updateVerifyStatus({ ids: selectedRowKeys, verifyStatus: 1 }))
          }
        >
          批量审核
        </Button>
        <Button
          onClick={() => batch(() => updateNewStatus({ ids: selectedRowKeys, newStatus: 1 }))}
        >
          设为新品
        </Button>
        <Button
          onClick={() =>
            batch(() => updateRecommendStatus({ ids: selectedRowKeys, recommendStatus: 1 }))
          }
        >
          设为推荐
        </Button>
        <Popconfirm
          title="确定批量删除选中商品吗？"
          onConfirm={() =>
            batch(() => updateDeleteStatus({ ids: selectedRowKeys, deleteStatus: 1 }))
          }
        >
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
        scroll={{ x: 1100 }}
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
