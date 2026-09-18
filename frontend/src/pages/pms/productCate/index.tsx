import { useEffect, useState } from 'react'
import {
  Table,
  Space,
  Button,
  Switch,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  listCate,
  createCate,
  updateCate,
  deleteCate,
  updateNavStatus,
  updateShowStatus,
  type PmsProductCategory,
} from '@/api/productCate'

export default function ProductCatePage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PmsProductCategory[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [parentId, setParentId] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PmsProductCategory | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listCate(parentId, pageNum, pageSize)
      setDataSource(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize, parentId])

  const handleNav = async (record: PmsProductCategory, checked: boolean) => {
    await updateNavStatus({ ids: [record.id], navStatus: checked ? 1 : 0 })
    message.success('操作成功')
    fetchData()
  }

  const handleShow = async (record: PmsProductCategory, checked: boolean) => {
    await updateShowStatus({ ids: [record.id], showStatus: checked ? 1 : 0 })
    message.success('操作成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteCate(id)
    message.success('删除成功')
    fetchData()
  }

  const openModal = (record?: PmsProductCategory) => {
    setEditing(record ?? null)
    form.resetFields()
    if (record) form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updateCate(editing.id, values)
    } else {
      await createCate({ ...values, parentId, level: parentId === 0 ? 0 : 1 })
    }
    message.success('保存成功')
    setModalOpen(false)
    fetchData()
  }

  const columns: ColumnsType<PmsProductCategory> = [
    { title: '分类名称', dataIndex: 'name' },
    { title: '级别', dataIndex: 'level', render: (v: number) => (v === 0 ? '一级' : '二级') },
    { title: '商品数量', dataIndex: 'productCount' },
    { title: '数量单位', dataIndex: 'productUnit' },
    {
      title: '导航栏',
      dataIndex: 'navStatus',
      render: (v: number, record) => (
        <Switch checked={v === 1} onChange={(c) => handleNav(record, c)} />
      ),
    },
    {
      title: '显示',
      dataIndex: 'showStatus',
      render: (v: number, record) => (
        <Switch checked={v === 1} onChange={(c) => handleShow(record, c)} />
      ),
    },
    { title: '排序', dataIndex: 'sort' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size={0}>
          {record.level === 0 && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setParentId(record.id)
                setPageNum(1)
              }}
            >
              查看下级
            </Button>
          )}
          <Button type="link" size="small" onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该分类吗？" onConfirm={() => handleDelete(record.id)}>
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
        {parentId !== 0 && (
          <Button
            onClick={() => {
              setParentId(0)
              setPageNum(1)
            }}
          >
            返回上级
          </Button>
        )}
        <Button type="primary" onClick={() => openModal()}>
          添加分类
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
      <Modal
        title={editing ? '编辑分类' : '添加分类'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ sort: 0, navStatus: 1, showStatus: 1 }}>
          <Form.Item label="分类名称" name="name" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item label="数量单位" name="productUnit">
            <Input placeholder="请输入数量单位" />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
