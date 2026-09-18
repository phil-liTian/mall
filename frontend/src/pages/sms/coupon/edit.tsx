import { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  message,
} from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { createCoupon, updateCoupon, getCoupon } from '@/api/coupon'

const { RangePicker } = DatePicker
const { TextArea } = Input

const typeOptions = [
  { label: '全场赠券', value: 0 },
  { label: '会员赠券', value: 1 },
  { label: '购物赠券', value: 2 },
  { label: '注册赠券', value: 3 },
]

const useTypeOptions = [
  { label: '全部', value: 0 },
  { label: '指定分类', value: 1 },
  { label: '指定商品', value: 2 },
]

export default function CouponEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      getCoupon(Number(id)).then((data) => {
        form.setFieldsValue({
          name: data.name,
          type: data.type,
          amount: data.amount,
          publishCount: data.publishCount,
          perLimit: data.perLimit,
          minPoint: data.minPoint,
          range: [dayjs(data.startTime), dayjs(data.endTime)],
          useType: data.useType,
          note: data.note,
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const [start, end] = values.range as [dayjs.Dayjs, dayjs.Dayjs]
    const payload = {
      name: values.name,
      type: values.type,
      amount: values.amount,
      publishCount: values.publishCount,
      perLimit: values.perLimit,
      minPoint: values.minPoint,
      startTime: start.format('YYYY-MM-DD HH:mm:ss'),
      endTime: end.format('YYYY-MM-DD HH:mm:ss'),
      useType: values.useType,
      note: values.note,
    }
    setSubmitting(true)
    try {
      if (id) {
        await updateCoupon(Number(id), payload)
        message.success('修改成功')
      } else {
        await createCoupon(payload)
        message.success('添加成功')
      }
      navigate('/sms/coupon')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title={id ? '编辑优惠券' : '添加优惠券'}>
      <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 12 }}>
        <Form.Item name="name" label="优惠券名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="请输入优惠券名称" />
        </Form.Item>
        <Form.Item name="type" label="优惠券类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select placeholder="请选择类型" options={typeOptions} />
        </Form.Item>
        <Form.Item name="amount" label="面值" rules={[{ required: true, message: '请输入面值' }]}>
          <InputNumber min={0} style={{ width: '100%' }} addonAfter="元" />
        </Form.Item>
        <Form.Item name="publishCount" label="发行数量" rules={[{ required: true, message: '请输入发行数量' }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="perLimit" label="每人限领" rules={[{ required: true, message: '请输入每人限领' }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="minPoint" label="最低消费" rules={[{ required: true, message: '请输入最低消费' }]}>
          <InputNumber min={0} style={{ width: '100%' }} addonAfter="元" />
        </Form.Item>
        <Form.Item name="range" label="有效期" rules={[{ required: true, message: '请选择有效期' }]}>
          <RangePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="useType" label="使用范围" rules={[{ required: true, message: '请选择使用范围' }]}>
          <Select placeholder="请选择使用范围" options={useTypeOptions} />
        </Form.Item>
        <Form.Item name="note" label="优惠券说明">
          <TextArea rows={3} placeholder="请输入优惠券说明" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4 }}>
          <Space>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              提交
            </Button>
            <Button onClick={() => navigate('/sms/coupon')}>返回</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
