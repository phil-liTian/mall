import { useEffect, useState } from 'react'
import {
  Table,
  Input,
  Space,
  Button,
  Switch,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  listRole,
  createRole,
  updateRole,
  deleteRole,
  updateRoleStatus,
  listMenuByRole,
  listResourceByRole,
  allocMenu,
  allocResource,
  type UmsRole,
} from '@/api/role'

type AllocType = 'menu' | 'resource'

export default function RolePage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<UmsRole[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UmsRole | null>(null)
  const [form] = Form.useForm()

  const [allocOpen, setAllocOpen] = useState(false)
  const [allocType, setAllocType] = useState<AllocType>('menu')
  const [allocRole, setAllocRole] = useState<UmsRole | null>(null)
  const [allocOptions, setAllocOptions] = useState<{ label: string; value: number }[]>([])
  const [allocSelected, setAllocSelected] = useState<number[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listRole({ keyword, pageNum, pageSize })
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

  const handleStatusChange = async (record: UmsRole, checked: boolean) => {
    await updateRoleStatus(record.id, checked ? 1 : 0)
    message.success('状态修改成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteRole([id])
    message.success('删除成功')
    fetchData()
  }

  const openEdit = (record?: UmsRole) => {
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
      await updateRole(editing.id, values)
      message.success('修改成功')
    } else {
      await createRole(values)
      message.success('添加成功')
    }
    setEditOpen(false)
    fetchData()
  }

  const openAlloc = async (record: UmsRole, type: AllocType) => {
    setAllocRole(record)
    setAllocType(type)
    setAllocSelected([])
    if (type === 'menu') {
      const list = await listMenuByRole(record.id)
      setAllocOptions(list.map((m) => ({ label: m.title, value: m.id })))
    } else {
      const list = await listResourceByRole(record.id)
      setAllocOptions(list.map((r) => ({ label: r.name, value: r.id })))
    }
    setAllocOpen(true)
  }

  const handleAllocOk = async () => {
    if (!allocRole) return
    if (allocType === 'menu') {
      await allocMenu(allocRole.id, allocSelected)
    } else {
      await allocResource(allocRole.id, allocSelected)
    }
    message.success('分配成功')
    setAllocOpen(false)
  }

  const columns: ColumnsType<UmsRole> = [
    { title: '名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description' },
    { title: '用户数', dataIndex: 'adminCount' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number, record) => (
        <Switch checked={status === 1} onChange={(checked) => handleStatusChange(record, checked)} />
      ),
    },
    { title: '添加时间', dataIndex: 'createTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button type="link" size="small" onClick={() => openAlloc(record, 'menu')}>
            分配菜单
          </Button>
          <Button type="link" size="small" onClick={() => openAlloc(record, 'resource')}>
            分配资源
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该角色吗？" onConfirm={() => handleDelete(record.id)}>
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
          placeholder="请输入角色名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
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
        title={editing ? '编辑角色' : '添加角色'}
        open={editOpen}
        onOk={handleEditOk}
        onCancel={() => setEditOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`${allocType === 'menu' ? '分配菜单' : '分配资源'} - ${allocRole?.name ?? ''}`}
        open={allocOpen}
        onOk={handleAllocOk}
        onCancel={() => setAllocOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label={allocType === 'menu' ? '菜单' : '资源'}>
            <Select
              mode="multiple"
              placeholder="请选择"
              value={allocSelected}
              onChange={setAllocSelected}
              options={allocOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
