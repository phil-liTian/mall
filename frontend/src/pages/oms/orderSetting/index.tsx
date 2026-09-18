import { useEffect, useState } from 'react'
import { Card, Form, InputNumber, Button, message, Spin, Space } from 'antd'
import { getOrderSetting, updateOrderSetting } from '@/api/orderSetting'

const SETTING_ID = 1

export default function OrderSettingPage() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getOrderSetting(SETTING_ID)
      form.setFieldsValue(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await updateOrderSetting(SETTING_ID, values)
      message.success('保存成功')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Spin style={{ margin: 40 }} />
  }

  return (
    <Card title="订单设置" style={{ maxWidth: 600 }}>
      <Form form={form} labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>
        <Form.Item name="flashOrderOvertime" label="秒杀订单超时关闭时间(分)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="normalOrderOvertime" label="正常订单超时时间(分)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="confirmOvertime" label="发货后自动确认收货时间(天)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="finishOvertime" label="自动完成交易时间(天)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="commentOvertime" label="订单完成后多少天不能申请售后">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 12 }}>
          <Space>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              保存
            </Button>
            <Button onClick={fetchData}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
