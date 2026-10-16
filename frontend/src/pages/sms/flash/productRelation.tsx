import { useEffect, useState } from 'react'
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Image,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  listFlashProductRelation,
  createFlashProductRelation,
  updateFlashProductRelation,
  deleteFlashProductRelation,
  type SmsFlashProductRelation,
} from '@/api/flashProductRelation'
import { listFlashSession, type SmsFlashSession } from '@/api/flashSession'
import { listFlash, type SmsFlash } from '@/api/flash'
import { simpleList, type PmsProduct } from '@/api/product'

export default function FlashProductRelationPage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<SmsFlashProductRelation[]>([])
  const [sessions, setSessions] = useState<SmsFlashSession[]>([])
  const [promotions, setPromotions] = useState<SmsFlash[]>([])

  const [filterPromotionId, setFilterPromotionId] = useState<number | undefined>()
  const [filterSessionId, setFilterSessionId] = useState<number | undefined>()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [productKeyword, setProductKeyword] = useState('')
  const [productOptions, setProductOptions] = useState<PmsProduct[]>([])
  const [productSearching, setProductSearching] = useState(false)

  const fetchSessions = async () => {
    const data = await listFlashSession()
    setSessions(data)
  }

  const fetchPromotions = async () => {
    const page = await listFlash('', 1, 200)
    setPromotions(page.list ?? [])
  }

  const fetchData = async () => {
    if (filterPromotionId == null) {
      setDataSource([])
      return
    }
    setLoading(true)
    try {
      const data = await listFlashProductRelation({
        flashPromotionId: filterPromotionId,
        flashPromotionSessionId: filterSessionId,
      })
      setDataSource(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchPromotions()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filterPromotionId, filterSessionId])

  const handleSearchProduct = async () => {
    setProductSearching(true)
    try {
      const data = await simpleList(productKeyword || undefined)
      setProductOptions(data)
    } finally {
      setProductSearching(false)
    }
  }

  const openModal = (record?: SmsFlashProductRelation) => {
    if (record) {
      setEditId(record.id ?? null)
      form.setFieldsValue({
        productId: record.productId,
        flashPromotionPrice: record.flashPromotionPrice,
        flashPromotionCount: record.flashPromotionCount,
        flashPromotionLimit: record.flashPromotionLimit,
        sort: record.sort ?? 0,
      })
      setProductOptions(
        record.productName
          ? [
              {
                id: record.productId,
                name: record.productName,
                productSn: record.productSn,
                pic: record.productPic,
                price: record.productPrice ?? 0,
                stock: record.productStock,
              } as unknown as PmsProduct,
            ]
          : []
      )
    } else {
      setEditId(null)
      form.resetFields()
      form.setFieldsValue({ flashPromotionCount: 100, flashPromotionLimit: 1, sort: 0 })
      setProductOptions([])
      setProductKeyword('')
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (filterPromotionId == null) {
      message.warning('请先在顶部选择秒杀活动')
      return
    }
    if (filterSessionId == null) {
      message.warning('请先在顶部选择场次')
      return
    }
    const payload = {
      flashPromotionId: filterPromotionId,
      flashPromotionSessionId: filterSessionId,
      productId: values.productId,
      flashPromotionPrice: values.flashPromotionPrice,
      flashPromotionCount: values.flashPromotionCount,
      flashPromotionLimit: values.flashPromotionLimit,
      sort: values.sort,
    }
    if (editId) {
      await updateFlashProductRelation(editId, payload)
      message.success('修改成功')
    } else {
      await createFlashProductRelation([payload])
      message.success('添加成功')
    }
    setModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteFlashProductRelation(id)
    message.success('删除成功')
    fetchData()
  }

  const columns: ColumnsType<SmsFlashProductRelation> = [
    {
      title: '商品',
      key: 'product',
      render: (_, record) =>
        record.productName ? (
          <Space>
            {record.productPic && (
              <Image src={record.productPic} width={40} height={40} style={{ objectFit: 'cover' }} />
            )}
            <span>{record.productName}</span>
          </Space>
        ) : (
          <span>-</span>
        ),
    },
    {
      title: '货号',
      dataIndex: 'productSn',
      render: (v?: string) => v ?? '-',
    },
    {
      title: '原价',
      dataIndex: 'productPrice',
      render: (v?: number) => (v != null ? `¥${v.toFixed(2)}` : '-'),
    },
    {
      title: '秒杀价',
      dataIndex: 'flashPromotionPrice',
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    { title: '秒杀库存', dataIndex: 'flashPromotionCount' },
    { title: '限购数量', dataIndex: 'flashPromotionLimit' },
    { title: '排序', dataIndex: 'sort' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该关联？"
            onConfirm={() => record.id != null && handleDelete(record.id)}
          >
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
      <Space style={{ marginBottom: 16 }} wrap>
        <span>秒杀活动：</span>
        <Select
          placeholder="选择秒杀活动"
          style={{ width: 280 }}
          value={filterPromotionId}
          onChange={setFilterPromotionId}
          allowClear
          showSearch
          optionFilterProp="label"
          options={promotions.map((p) => ({
            value: p.id,
            label: `${p.title}（${p.startDate}~${p.endDate}）`,
          }))}
        />
        <span>场次：</span>
        <Select
          placeholder="选择场次"
          style={{ width: 260 }}
          value={filterSessionId}
          onChange={setFilterSessionId}
          allowClear
          options={sessions.map((s) => ({
            value: s.id,
            label: `${s.name}（${s.startTime}~${s.endTime}）`,
          }))}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!filterPromotionId || !filterSessionId}
          onClick={() => openModal()}
        >
          添加秒杀商品
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      />
      <Modal
        title={editId ? '编辑秒杀商品' : '添加秒杀商品'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={680}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="productId" label="选择商品" rules={[{ required: true, message: '请选择商品' }]}>
            <Select
              showSearch
              placeholder="输入关键字搜索商品"
              filterOption={false}
              loading={productSearching}
              onSearch={setProductKeyword}
              onFocus={handleSearchProduct}
              options={productOptions.map((p) => ({
                value: p.id,
                label: `${p.name}（货号：${p.productSn ?? '-'}）`,
              }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Space style={{ padding: 8 }}>
                    <Input
                      placeholder="商品名称 / 货号"
                      value={productKeyword}
                      onChange={(e) => setProductKeyword(e.target.value)}
                      onPressEnter={handleSearchProduct}
                    />
                    <Button icon={<SearchOutlined />} onClick={handleSearchProduct}>
                      搜索
                    </Button>
                  </Space>
                </>
              )}
            />
          </Form.Item>
          <Form.Item
            name="flashPromotionPrice"
            label="秒杀价"
            rules={[{ required: true, message: '请输入秒杀价' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} addonAfter="元" />
          </Form.Item>
          <Form.Item
            name="flashPromotionCount"
            label="秒杀库存"
            rules={[{ required: true, message: '请输入秒杀库存' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="flashPromotionLimit"
            label="限购数量"
            rules={[{ required: true, message: '请输入限购数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}