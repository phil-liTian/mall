import { useEffect, useState } from 'react'
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Card,
  Space,
  message,
} from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  updateProduct,
  getProductUpdateInfo,
  type PmsProduct,
} from '@/api/product'
import { listAllBrand, type PmsBrand } from '@/api/brand'
import { listWithChildren, type PmsProductCategory } from '@/api/productCate'
import ImageUpload from '@/components/ImageUpload'

const steps = ['填写商品信息', '填写商品促销', '填写商品属性', '选择商品关联']

export default function ProductEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [current, setCurrent] = useState(0)
  const [form] = Form.useForm()
  const [brands, setBrands] = useState<PmsBrand[]>([])
  const [cateOptions, setCateOptions] = useState<{ label: string; value: number }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listAllBrand().then(setBrands)
    listWithChildren().then((list: PmsProductCategory[]) => {
      const opts: { label: string; value: number }[] = []
      list.forEach((l1) => {
        l1.children?.forEach((l2) => opts.push({ label: `${l1.name} / ${l2.name}`, value: l2.id }))
      })
      setCateOptions(opts)
    })
    if (isEdit) {
      getProductUpdateInfo(Number(id)).then((data: PmsProduct) => {
        form.setFieldsValue({
          ...data,
          newStatus: data.newStatus === 1,
          recommandStatus: data.recommandStatus === 1,
          publishStatus: data.publishStatus === 1,
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload: Partial<PmsProduct> = {
      ...values,
      newStatus: values.newStatus ? 1 : 0,
      recommandStatus: values.recommandStatus ? 1 : 0,
      publishStatus: values.publishStatus ? 1 : 0,
    }
    setSubmitting(true)
    try {
      if (isEdit) {
        await updateProduct(Number(id), payload)
      } else {
        await createProduct(payload)
      }
      message.success('提交成功')
      navigate('/pms/product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <Steps
        current={current}
        items={steps.map((t) => ({ title: t }))}
        style={{ marginBottom: 24 }}
      />
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        initialValues={{ sort: 0, stock: 0, newStatus: false, recommandStatus: false, publishStatus: false }}
      >
        {/* 所有步骤字段都渲染，用显示切换，简化实现 */}
        <div style={{ display: current === 0 ? 'block' : 'none' }}>
          <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item label="货号" name="productSn">
            <Input placeholder="请输入货号" />
          </Form.Item>
          <Form.Item label="副标题" name="subTitle">
            <Input placeholder="请输入副标题" />
          </Form.Item>
          <Form.Item label="品牌" name="brandId">
            <Select
              placeholder="请选择品牌"
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>
          <Form.Item label="商品分类" name="productCategoryId">
            <Select placeholder="请选择商品分类" options={cateOptions} />
          </Form.Item>
          <Form.Item label="商品图片" name="pic">
            <ImageUpload />
          </Form.Item>
          <Form.Item label="商品详情" name="detailHtml">
            <Input.TextArea rows={4} placeholder="请输入商品详情" />
          </Form.Item>
        </div>
        <div style={{ display: current === 1 ? 'block' : 'none' }}>
          <Form.Item label="市场价" name="originalPrice">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入市场价" />
          </Form.Item>
          <Form.Item label="销售价格" name="price" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入销售价格" />
          </Form.Item>
          <Form.Item label="库存" name="stock">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入库存" />
          </Form.Item>
          <Form.Item label="排序" name="sort">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="上架" name="publishStatus" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="新品" name="newStatus" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="推荐" name="recommandStatus" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
        <div style={{ display: current === 2 ? 'block' : 'none' }}>
          <p style={{ color: '#999', paddingLeft: 40 }}>商品属性（简化实现，可在此扩展属性录入）</p>
        </div>
        <div style={{ display: current === 3 ? 'block' : 'none' }}>
          <p style={{ color: '#999', paddingLeft: 40 }}>选择商品关联（简化实现，可在此扩展关联商品）</p>
        </div>
      </Form>
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Space>
          {current > 0 && <Button onClick={() => setCurrent(current - 1)}>上一步</Button>}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => setCurrent(current + 1)}>
              下一步
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              提交
            </Button>
          )}
          <Button onClick={() => navigate('/pms/product')}>返回</Button>
        </Space>
      </div>
    </Card>
  )
}
