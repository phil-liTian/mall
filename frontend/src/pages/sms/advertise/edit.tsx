import { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Radio,
  Button,
  Space,
  message,
} from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { createAdvertise, updateAdvertise, getAdvertise } from '@/api/advertise'
import ImageUpload from '@/components/ImageUpload'

const { RangePicker } = DatePicker
const { TextArea } = Input

const positionOptions = [
  { label: 'PC首页轮播', value: 1 },
  { label: 'APP首页轮播', value: 2 },
]

export default function AdvertiseEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      getAdvertise(Number(id)).then((data) => {
        form.setFieldsValue({
          name: data.name,
          type: data.type,
          range: [dayjs(data.startTime), dayjs(data.endTime)],
          status: data.status,
          sort: data.sort,
          pic: data.pic,
          url: data.url,
          note: data.note,
        })
      })
    } else {
      form.setFieldsValue({ status: 1, sort: 0, type: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const [start, end] = values.range as [dayjs.Dayjs, dayjs.Dayjs]
    const payload = {
      name: values.name,
      type: values.type,
      startTime: start.format('YYYY-MM-DD HH:mm:ss'),
      endTime: end.format('YYYY-MM-DD HH:mm:ss'),
      status: values.status,
      sort: values.sort,
      pic: values.pic,
      url: values.url,
      note: values.note,
    }
    setSubmitting(true)
    try {
      if (id) {
        await updateAdvertise(Number(id), payload)
        message.success('修改成功')
      } else {
        await createAdvertise(payload)
        message.success('添加成功')
      }
      navigate('/sms/advertise')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title={id ? '编辑广告' : '添加广告'}>
      <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 12 }}>
        <Form.Item name="name" label="广告名称" rules={[{ required: true, message: '请输入广告名称' }]}>
          <Input placeholder="请输入广告名称" />
        </Form.Item>
        <Form.Item name="type" label="广告位置" rules={[{ required: true, message: '请选择广告位置' }]}>
          <Select placeholder="请选择广告位置" options={positionOptions} />
        </Form.Item>
        <Form.Item name="range" label="投放时间" rules={[{ required: true, message: '请选择投放时间' }]}>
          <RangePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="status" label="上线/下线" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value={1}>上线</Radio>
            <Radio value={0}>下线</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="sort" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="pic" label="广告图片" rules={[{ required: true, message: '请上传广告图片' }]}>
          <ImageUpload />
        </Form.Item>
        <Form.Item name="url" label="链接地址">
          <Input placeholder="请输入链接地址" />
        </Form.Item>
        <Form.Item name="note" label="备注">
          <TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4 }}>
          <Space>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              提交
            </Button>
            <Button onClick={() => navigate('/sms/advertise')}>返回</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
