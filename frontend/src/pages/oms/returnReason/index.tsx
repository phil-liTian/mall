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
  listReturnReason,
  createReturnReason,
  updateReturnReason,
  deleteReturnReason,
  updateReturnReasonStatus,
  type OmsReturnReason,
} from '@/api/returnReason'

export default function ReturnReasonPage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<OmsReturnReason[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listReturnReason(pageNum, pageSize)
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

  const openModal = (record?: OmsReturnReason) => {
    if (record) {
      setEditingId(record.id)
      form.setFieldsValue({ name: record.name, sort: record.sort, status: record.status })
    } else {
      setEditingId(null)
      form.setFieldsValue({ name: '', sort: 0, status: 1 })
    }
    setModalOpen(true)
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    if (editingId) {
      await updateReturnReason(editingId, values)
    } else {
      await createReturnReason(values)
    }
    message.success('保存成功')
    setModalOpen(false)
    fetchData()
  }

  const handleDelete = async (ids: number[]) => {
    await deleteReturnReason(ids)
    message.success('删除成功')
    setSelectedRowKeys([])
    fetchData()
  }

  const handleStatusChange = async (ids: number[], status: number) => {
    await updateReturnReasonStatus({ ids, status })
    message.success('状态修改成功')
    setSelectedRowKeys([])
    fetchData()
  }

  const batchStatus = (status: number) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择记录')
      return
    }
    handleStatusChange(selectedRowKeys, status)
  }

  const columns: ColumnsType<OmsReturnReason> = [
    { title: '退货类型', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sort' },
    {
      title: '启用状态',
      dataIndex: 'status',
      render: (status: number, record) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange([record.id], checked ? 1 : 0)}
        />
      ),
    },
    { title: '添加时间', dataIndex: 'createTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该原因吗？" onConfirm={() => handleDelete([record.id])}>
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
          添加
        </Button>
        <Button onClick={() => batchStatus(1)}>批量启用</Button>
        <Button onClick={() => batchStatus(0)}>批量禁用</Button>
        <Popconfirm
          title="确定删除选中的记录吗？"
          onConfirm={() => {
            if (selectedRowKeys.length === 0) {
              message.warning('请先选择记录')
              return
            }
            handleDelete(selectedRowKeys)
          }}
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
        title={editingId ? '编辑退货原因' : '添加退货原因'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="退货类型" rules={[{ required: true, message: '请输入退货类型' }]}>
            <Input placeholder="请输入退货类型" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="启用状态" valuePropName="checked" getValueFromEvent={(c) => (c ? 1 : 0)}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
