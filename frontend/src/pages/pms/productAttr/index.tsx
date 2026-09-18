import { useEffect, useState } from 'react'
import { Table, Space, Button, Modal, Form, Input, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import {
  listAttrCate,
  createAttrCate,
  updateAttrCate,
  deleteAttrCate,
  type PmsProductAttributeCategory,
} from '@/api/productAttr'

export default function ProductAttrPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PmsProductAttributeCategory[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PmsProductAttributeCategory | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listAttrCate(pageNum, pageSize)
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

  const handleDelete = async (id: number) => {
    await deleteAttrCate(id)
    message.success('删除成功')
    fetchData()
  }

  const openModal = (record?: PmsProductAttributeCategory) => {
    setEditing(record ?? null)
    form.resetFields()
    if (record) form.setFieldsValue({ name: record.name })
    setModalOpen(true)
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updateAttrCate(editing.id, values.name)
    } else {
      await createAttrCate(values.name)
    }
    message.success('保存成功')
    setModalOpen(false)
    fetchData()
  }

  const columns: ColumnsType<PmsProductAttributeCategory> = [
    { title: '分类名称', dataIndex: 'name' },
    { title: '属性数量', dataIndex: 'attributeCount' },
    { title: '参数数量', dataIndex: 'paramCount' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/pms/productAttrList/${record.id}`)}
          >
            设置
          </Button>
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
        <Button type="primary" onClick={() => openModal()}>
          添加属性分类
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
        title={editing ? '编辑属性分类' : '添加属性分类'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="分类名称" name="name" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
