import { useEffect, useState } from 'react'
import {
  Descriptions,
  Table,
  Card,
  Button,
  Space,
  Spin,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getOrder,
  updateReceiverInfo,
  updateMoneyInfo,
  updateOrderNote,
  type OmsOrderDetail,
  type OmsOrderItem,
  type OmsOrderHistory,
} from '@/api/order'
import { renderOrderStatus } from './index'

type ModalType = 'receiver' | 'money' | 'note' | null

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<OmsOrderDetail | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getOrder(Number(id))
      setDetail(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openModal = (type: ModalType) => {
    if (!detail) return
    if (type === 'receiver') {
      form.setFieldsValue({
        receiverName: detail.receiverName,
        receiverPhone: detail.receiverPhone,
        receiverDetailAddress: detail.receiverDetailAddress,
      })
    } else if (type === 'money') {
      form.setFieldsValue({ freightAmount: detail.freightAmount, discountAmount: detail.discountAmount })
    } else if (type === 'note') {
      form.setFieldsValue({ note: detail.note })
    }
    setModalType(type)
  }

  const handleOk = async () => {
    if (!detail) return
    const values = await form.validateFields()
    if (modalType === 'receiver') {
      await updateReceiverInfo({ orderId: detail.id, ...values })
    } else if (modalType === 'money') {
      await updateMoneyInfo({ orderId: detail.id, ...values })
    } else if (modalType === 'note') {
      await updateOrderNote({ id: detail.id, note: values.note, status: detail.status })
    }
    message.success('修改成功')
    setModalType(null)
    fetchData()
  }

  const itemColumns: ColumnsType<OmsOrderItem> = [
    { title: '商品名称', dataIndex: 'productName' },
    { title: '商品SKU', dataIndex: 'productSkuCode' },
    { title: '规格', dataIndex: 'productAttr' },
    { title: '单价', dataIndex: 'productPrice', render: (v: number) => `￥${v}` },
    { title: '数量', dataIndex: 'productQuantity' },
  ]

  const historyColumns: ColumnsType<OmsOrderHistory> = [
    { title: '时间', dataIndex: 'createTime' },
    { title: '状态', dataIndex: 'orderStatus', render: (v: number) => renderOrderStatus(v) },
    { title: '操作说明', dataIndex: 'note' },
    { title: '操作人', dataIndex: 'operateMan' },
  ]

  if (loading || !detail) {
    return <Spin style={{ margin: 40 }} />
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space>
        <Button onClick={() => navigate(-1)}>返回</Button>
        <Button onClick={() => openModal('receiver')}>修改收货人</Button>
        <Button onClick={() => openModal('money')}>修改费用</Button>
        <Button onClick={() => openModal('note')}>备注</Button>
      </Space>

      <Card title="订单信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="订单编号">{detail.orderSn}</Descriptions.Item>
          <Descriptions.Item label="订单状态">{renderOrderStatus(detail.status)}</Descriptions.Item>
          <Descriptions.Item label="用户账号">{detail.memberUsername}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{detail.createTime}</Descriptions.Item>
          <Descriptions.Item label="备注">{detail.note}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="收货人信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="收货人">{detail.receiverName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{detail.receiverPhone}</Descriptions.Item>
          <Descriptions.Item label="邮政编码">{detail.receiverPostCode}</Descriptions.Item>
          <Descriptions.Item label="收货地址">
            {`${detail.receiverProvince ?? ''}${detail.receiverCity ?? ''}${detail.receiverRegion ?? ''}${detail.receiverDetailAddress ?? ''}`}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="商品清单">
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          columns={itemColumns}
          dataSource={detail.orderItemList}
        />
      </Card>

      <Card title="费用信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="商品总金额">￥{detail.totalAmount}</Descriptions.Item>
          <Descriptions.Item label="应付金额">￥{detail.payAmount}</Descriptions.Item>
          <Descriptions.Item label="运费">￥{detail.freightAmount}</Descriptions.Item>
          <Descriptions.Item label="优惠金额">￥{detail.discountAmount}</Descriptions.Item>
          <Descriptions.Item label="优惠券抵扣">￥{detail.couponAmount}</Descriptions.Item>
          <Descriptions.Item label="积分抵扣">￥{detail.integrationAmount}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="操作记录">
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          columns={historyColumns}
          dataSource={detail.historyList}
        />
      </Card>

      <Modal
        title={
          modalType === 'receiver' ? '修改收货人' : modalType === 'money' ? '修改费用' : '备注'
        }
        open={modalType !== null}
        onOk={handleOk}
        onCancel={() => setModalType(null)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          {modalType === 'receiver' && (
            <>
              <Form.Item name="receiverName" label="收货人" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="receiverPhone" label="联系电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="receiverDetailAddress" label="详细地址">
                <Input />
              </Form.Item>
            </>
          )}
          {modalType === 'money' && (
            <>
              <Form.Item name="freightAmount" label="运费">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="discountAmount" label="优惠金额">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {modalType === 'note' && (
            <Form.Item name="note" label="备注">
              <Input.TextArea rows={4} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Space>
  )
}
