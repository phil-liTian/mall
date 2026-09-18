import { useEffect, useState } from 'react'
import {
  Table,
  Tabs,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate, useParams } from 'react-router-dom'
import {
  listAttr,
  createAttr,
  updateAttr,
  deleteAttr,
  type PmsProductAttribute,
} from '@/api/productAttr'

const selectTypeText = ['唯一', '单选', '多选']
const inputTypeText = ['手工录入', '从列表选取']

export default function AttrListPage() {
  const navigate = useNavigate()
  const { cid } = useParams()
  const categoryId = Number(cid)
  const [type, setType] = useState(0) // 0 属性 1 参数
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PmsProductAttribute[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PmsProductAttribute | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listAttr(categoryId, type, pageNum, pageSize)
      setDataSource(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pageSize, type])

  const handleDelete = async (id: number) => {
    await deleteAttr([id])
    message.success('删除成功')
    fetchData()
  }

  const openModal = (record?: PmsProductAttribute) => {
    setEditing(record ?? null)
    form.resetFields()
    if (record) form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    const payload = { ...values, type, productAttributeCategoryId: categoryId }
    if (editing) {
      await updateAttr(editing.id, payload)
    } else {
      await createAttr(payload)
    }
    message.success('保存成功')
    setModalOpen(false)
    fetchData()
  }

  const columns: ColumnsType<PmsProductAttribute> = [
    { title: type === 0 ? '属性名称' : '参数名称', dataIndex: 'name' },
    {
      title: '是否可选',
      dataIndex: 'selectType',
      render: (v: number) => selectTypeText[v] ?? '-',
    },
    {
      title: '录入方式',
      dataIndex: 'inputType',
      render: (v: number) => inputTypeText[v] ?? '-',
    },
    { title: '可选值', dataIndex: 'inputList' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const table = (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => openModal()}>
          添加{type === 0 ? '属性' : '参数'}
        </Button>
        <Button onClick={() => navigate('/pms/productAttr')}>返回</Button>
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
    </>
  )

  return (
    <div>
      <Tabs
        activeKey={String(type)}
        onChange={(k) => {
          setType(Number(k))
          setPageNum(1)
        }}
        items={[
          { key: '0', label: '商品属性', children: table },
          { key: '1', label: '商品参数', children: table },
        ]}
      />
      <Modal
        title={editing ? '编辑' : '添加'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ selectType: 0, inputType: 0, sort: 0 }}
        >
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item label="是否可选" name="selectType">
            <Select
              options={selectTypeText.map((label, value) => ({ label, value }))}
            />
          </Form.Item>
          <Form.Item label="录入方式" name="inputType">
            <Select options={inputTypeText.map((label, value) => ({ label, value }))} />
          </Form.Item>
          <Form.Item label="可选值" name="inputList">
            <Input placeholder="多个值用逗号分隔" />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
