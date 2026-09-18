import { useEffect, useState } from 'react'
import { Table, Form, Input, Space, Button, Switch, Modal, Select, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { listAdmin, updateAdminStatus, deleteAdmin, type UmsAdmin } from '@/api/admin'
import { listAllRole, type UmsRole } from '@/api/role'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<UmsAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<UmsAdmin | null>(null)
  const [allRoles, setAllRoles] = useState<UmsRole[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listAdmin({ keyword, pageNum, pageSize })
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

  const handleStatusChange = async (record: UmsAdmin, checked: boolean) => {
    await updateAdminStatus(record.id, checked ? 1 : 0)
    message.success('状态修改成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteAdmin(id)
    message.success('删除成功')
    fetchData()
  }

  const openRoleModal = async (record: UmsAdmin) => {
    setCurrentAdmin(record)
    setSelectedRoleIds([])
    const roles = await listAllRole()
    setAllRoles(roles)
    setRoleModalOpen(true)
  }

  const handleAllocRole = async () => {
    message.success('分配角色成功')
    setRoleModalOpen(false)
  }

  const columns: ColumnsType<UmsAdmin> = [
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickName' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '备注', dataIndex: 'note' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number, record) => (
        <Switch checked={status === 1} onChange={(checked) => handleStatusChange(record, checked)} />
      ),
    },
    { title: '添加时间', dataIndex: 'createTime' },
    { title: '最后登录', dataIndex: 'loginTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">
            修改
          </Button>
          <Button type="link" size="small" onClick={() => openRoleModal(record)}>
            分配角色
          </Button>
          <Popconfirm title="确定删除该用户吗？" onConfirm={() => handleDelete(record.id)}>
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
          placeholder="请输入用户名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
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
        title={`分配角色 - ${currentAdmin?.username ?? ''}`}
        open={roleModalOpen}
        onOk={handleAllocRole}
        onCancel={() => setRoleModalOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="角色">
            <Select
              mode="multiple"
              placeholder="请选择角色"
              value={selectedRoleIds}
              onChange={setSelectedRoleIds}
              options={allRoles.map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
