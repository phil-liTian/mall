import { useEffect, useState } from 'react'
import {
  Table,
  Space,
  Button,
  Switch,
  Modal,
  Form,
  Input,
  TimePicker,
  message,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import {
  listFlashSession,
  createFlashSession,
  updateFlashSession,
  deleteFlashSession,
  updateFlashSessionStatus,
  type SmsFlashSession,
} from '@/api/flashSession'

export default function FlashSessionPage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<SmsFlashSession[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await listFlashSession()
      setDataSource(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusChange = async (record: SmsFlashSession, checked: boolean) => {
    await updateFlashSessionStatus(record.id, checked ? 1 : 0)
    message.success('状态修改成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteFlashSession(id)
    message.success('删除成功')
    fetchData()
  }

  const openModal = (record?: SmsFlashSession) => {
    if (record) {
      setEditId(record.id)
      form.setFieldsValue({
        name: record.name,
        range: [dayjs(record.startTime, 'HH:mm:ss'), dayjs(record.endTime, 'HH:mm:ss')],
        status: record.status,
      })
    } else {
      setEditId(null)
      form.resetFields()
      form.setFieldsValue({ status: 1 })
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const [start, end] = values.range as [Dayjs, Dayjs]
    const payload = {
      name: values.name,
      startTime: start.format('HH:mm:ss'),
      endTime: end.format('HH:mm:ss'),
      status: values.status,
    }
    if (editId) {
      await updateFlashSession(editId, payload)
      message.success('修改成功')
    } else {
      await createFlashSession(payload)
      message.success('添加成功')
    }
    setModalOpen(false)
    fetchData()
  }

  const columns: ColumnsType<SmsFlashSession> = [
    { title: '场次名称', dataIndex: 'name' },
    { title: '开始时间', dataIndex: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime' },
    {
      title: '启用状态',
      dataIndex: 'status',
      render: (status: number, record) => (
        <Switch checked={status === 1} onChange={(checked) => handleStatusChange(record, checked)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该场次吗？" onConfirm={() => handleDelete(record.id)}>
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
          添加秒杀时段
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
        title={editId ? '编辑秒杀时段' : '添加秒杀时段'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="场次名称" rules={[{ required: true, message: '请输入场次名称' }]}>
            <Input placeholder="如：零点场、上午场" />
          </Form.Item>
          <Form.Item name="range" label="时段" rules={[{ required: true, message: '请选择时段' }]}>
            <TimePicker.RangePicker
              style={{ width: '100%' }}
              format="HH:mm:ss"
              minuteStep={15}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}