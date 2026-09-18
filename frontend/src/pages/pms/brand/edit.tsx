import { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Switch, Button, Space, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { createBrand, updateBrand, getBrand, type PmsBrand } from '@/api/brand'
import ImageUpload from '@/components/ImageUpload'

export default function BrandEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getBrand(Number(id)).then((data: PmsBrand) => {
        form.setFieldsValue({
          ...data,
          showStatus: data.showStatus === 1,
          factoryStatus: data.factoryStatus === 1,
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload: Partial<PmsBrand> = {
      ...values,
      showStatus: values.showStatus ? 1 : 0,
      factoryStatus: values.factoryStatus ? 1 : 0,
    }
    setSubmitting(true)
    try {
      if (isEdit) {
        await updateBrand(Number(id), payload)
      } else {
        await createBrand(payload)
      }
      message.success('提交成功')
      navigate('/pms/brand')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title={isEdit ? '编辑品牌' : '添加品牌'}>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        initialValues={{ sort: 0, showStatus: true, factoryStatus: false }}
      >
        <Form.Item label="品牌名称" name="name" rules={[{ required: true, message: '请输入品牌名称' }]}>
          <Input placeholder="请输入品牌名称" />
        </Form.Item>
        <Form.Item label="品牌首字母" name="firstLetter">
          <Input placeholder="请输入品牌首字母" />
        </Form.Item>
        <Form.Item label="排序" name="sort">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="品牌Logo" name="logo">
          <ImageUpload />
        </Form.Item>
        <Form.Item label="品牌大图" name="bigPic">
          <ImageUpload />
        </Form.Item>
        <Form.Item label="品牌故事" name="brandStory">
          <Input.TextArea rows={4} placeholder="请输入品牌故事" />
        </Form.Item>
        <Form.Item label="是否显示" name="showStatus" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="品牌制造商" name="factoryStatus" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4 }}>
          <Space>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              提交
            </Button>
            <Button onClick={() => navigate('/pms/brand')}>返回</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
