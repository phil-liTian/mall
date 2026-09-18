import { useEffect, useState } from 'react'
import {
  Table,
  Space,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  listResource,
  createResource,
  updateResource,
  deleteResource,
  listAllResourceCategory,
  type UmsResource,
  type UmsResourceCategory,
} from '@/api/resource'

export default function ResourcePage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<UmsResource[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [nameKeyword, setNameKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [categories, setCategories] = useState<UmsResourceCategory[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UmsResource | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listResource({ categoryId, nameKeyword, pageNum, pageSize })
      setDataSource(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    const list = await listAllResourceCategory()
    setCategories(list)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize, categoryId])

  const handleSearch = () => {
    setPageNum(1)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteResource(id)
    message.success('删除成功')
    fetchData()
  }

  const openEdit = (record?: UmsResource) => {
    setEditing(record ?? null)
    form.resetFields()
    if (record) {
      form.setFieldsValue(record)
    }
    setEditOpen(true)
  }

  const handleEditOk = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updateResource(editing.id, values)
      message.success('修改成功')
    } else {
      await createResource(values)
      message.success('添加成功')
    }
    setEditOpen(false)
    fetchData()
  }

  const columns: ColumnsType<UmsResource> = [
    { title: '资源名', dataIndex: 'name' },
    { title: '资源路径', dataIndex: 'url' },
    { title: '描述', dataIndex: 'description' },
    { title: '添加时间', dataIndex: 'createTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该资源吗？" onConfirm={() => handleDelete(record.id)}>
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
        <Select
          placeholder="资源分类"
          style={{ width: 160 }}
          allowClear
          value={categoryId}
          onChange={(v) => {
            setPageNum(1)
            setCategoryId(v)
          }}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
        <Input
          placeholder="请输入资源名"
          value={nameKeyword}
          onChange={(e) => setNameKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={() => openEdit()}>添加</Button>
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
        title={editing ? '编辑资源' : '添加资源'}
        open={editOpen}
        onOk={handleEditOk}
        onCancel={() => setEditOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="资源名" rules={[{ required: true, message: '请输入资源名' }]}>
            <Input placeholder="请输入资源名" />
          </Form.Item>
          <Form.Item name="url" label="资源路径" rules={[{ required: true, message: '请输入资源路径' }]}>
            <Input placeholder="请输入资源路径" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="categoryId" label="资源分类">
            <Select
              placeholder="请选择资源分类"
              allowClear
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
