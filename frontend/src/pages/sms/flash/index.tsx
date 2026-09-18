import { useEffect, useState } from 'react'
import { Table, Input, Space, Button, Switch, Modal, Form, DatePicker, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  listFlash,
  createFlash,
  updateFlash,
  deleteFlash,
  updateFlashStatus,
  type SmsFlash,
} from '@/api/flash'

const { RangePicker } = DatePicker

export default function FlashPage() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<SmsFlash[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listFlash(keyword, pageNum, pageSize)
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

  const handleStatusChange = async (record: SmsFlash, checked: boolean) => {
    await updateFlashStatus(record.id, checked ? 1 : 0)
    message.success('状态修改成功')
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteFlash(id)
    message.success('删除成功')
    fetchData()
  }

  const openModal = (record?: SmsFlash) => {
    if (record) {
      setEditId(record.id)
      form.setFieldsValue({
        title: record.title,
        range: [dayjs(record.startTime), dayjs(record.endTime)],
      })
    } else {
      setEditId(null)
      form.resetFields()
    }
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const [start, end] = values.range as [dayjs.Dayjs, dayjs.Dayjs]
    const payload = {
      title: values.title,
      startTime: start.format('YYYY-MM-DD HH:mm:ss'),
      endTime: end.format('YYYY-MM-DD HH:mm:ss'),
    }
    if (editId) {
      await updateFlash(editId, payload)
      message.success('修改成功')
    } else {
      await createFlash(payload)
      message.success('添加成功')
    }
    setModalOpen(false)
    fetchData()
  }

  const columns: ColumnsType<SmsFlash> = [
    { title: '活动名称', dataIndex: 'title' },
    { title: '开始时间', dataIndex: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime' },
    {
      title: '上下线状态',
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
          <Popconfirm title="确定删除该活动吗？" onConfirm={() => handleDelete(record.id)}>
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
          placeholder="请输入活动名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="primary" onClick={() => openModal()}>
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
        title={editId ? '编辑秒杀活动' : '添加秒杀活动'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input placeholder="请输入活动名称" />
          </Form.Item>
          <Form.Item name="range" label="活动时间" rules={[{ required: true, message: '请选择活动时间' }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
