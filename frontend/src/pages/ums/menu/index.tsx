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
  listMenu,
  createMenu,
  updateMenu,
  deleteMenu,
  updateMenuHidden,
  type UmsMenu,
} from '@/api/menu'

export default function MenuPage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<UmsMenu[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [parentId, setParentId] = useState(0)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UmsMenu | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listMenu(parentId, { pageNum, pageSize })
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

  const handleHiddenChange = async (record: UmsMenu, checked: boolean) => {
    // Switch 打开表示显示，hidden=0
    await updateMenuHidden(record.id, checked ? 0 : 1)
    message.success('修改成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteMenu(id)
    message.success('删除成功')
    fetchData()
  }

  const openEdit = (record?: UmsMenu) => {
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
      await updateMenu(editing.id, values)
      message.success('修改成功')
    } else {
      await createMenu({ ...values, parentId })
      message.success('添加成功')
    }
    setEditOpen(false)
    fetchData()
  }

  const viewSub = (record: UmsMenu) => {
    setPageNum(1)
    setParentId(record.id)
  }

  const columns: ColumnsType<UmsMenu> = [
    { title: '菜单名称', dataIndex: 'title' },
    { title: '级别', dataIndex: 'level' },
    { title: '前端名称', dataIndex: 'name' },
    { title: '前端图标', dataIndex: 'icon' },
    { title: '排序', dataIndex: 'sort' },
    {
      title: '是否显示',
      dataIndex: 'hidden',
      render: (hidden: number, record) => (
        <Switch checked={hidden === 0} onChange={(checked) => handleHiddenChange(record, checked)} />
      ),
    },
    { title: '添加时间', dataIndex: 'createTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            修改
          </Button>
          <Button type="link" size="small" onClick={() => viewSub(record)}>
            查看下级
          </Button>
          <Popconfirm title="确定删除该菜单吗？" onConfirm={() => handleDelete(record.id)}>
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
              setPageNum(1)
              setParentId(0)
            }}
          >
            返回上级
          </Button>
        )}
        <Button type="primary" onClick={() => openEdit()}>
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
      <Modal
        title={editing ? '编辑菜单' : '添加菜单'}
        open={editOpen}
        onOk={handleEditOk}
        onCancel={() => setEditOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item name="name" label="前端名称">
            <Input placeholder="请输入前端名称" />
          </Form.Item>
          <Form.Item name="icon" label="前端图标">
            <Input placeholder="请输入前端图标" />
          </Form.Item>
          <Form.Item name="level" label="级别" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
