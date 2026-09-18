import { useEffect, useState } from 'react'
import { Descriptions, Card, Button, Space, Spin, Steps, Modal, Input, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getReturnApply,
  updateReturnApplyStatus,
  type OmsReturnApply,
} from '@/api/returnApply'
import { renderReturnStatus } from './index'

export default function ReturnApplyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<OmsReturnApply | null>(null)
  const [note, setNote] = useState('')
  const [pendingStatus, setPendingStatus] = useState<number | null>(null)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getReturnApply(Number(id))
      setDetail(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // status: 1 确认退货(退货中), 2 完成退货, 3 拒绝退货
  const openStatusModal = (status: number) => {
    setNote('')
    setPendingStatus(status)
  }

  const handleConfirm = async () => {
    if (!detail || pendingStatus === null) return
    await updateReturnApplyStatus(detail.id, { status: pendingStatus, handleNote: note })
    message.success('操作成功')
    setPendingStatus(null)
    fetchData()
  }

  if (loading || !detail) {
    return <Spin style={{ margin: 40 }} />
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space>
        <Button onClick={() => navigate(-1)}>返回</Button>
        {detail.status === 0 && (
          <>
            <Button type="primary" onClick={() => openStatusModal(1)}>
              确认退货
            </Button>
            <Button danger onClick={() => openStatusModal(3)}>
              拒绝退货
            </Button>
          </>
        )}
        {detail.status === 1 && (
          <Button type="primary" onClick={() => openStatusModal(2)}>
            完成退货
          </Button>
        )}
      </Space>

      <Card title="退货流程">
        <Steps
          current={detail.status === 3 ? 1 : detail.status}
          status={detail.status === 3 ? 'error' : 'process'}
          items={[
            { title: '待处理' },
            { title: detail.status === 3 ? '已拒绝' : '退货中' },
            { title: '已完成' },
          ]}
        />
      </Card>

      <Card title="申请信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="申请编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="申请状态">{renderReturnStatus(detail.status)}</Descriptions.Item>
          <Descriptions.Item label="订单编号">{detail.orderSn}</Descriptions.Item>
          <Descriptions.Item label="申请时间">{detail.createTime}</Descriptions.Item>
          <Descriptions.Item label="用户账号">{detail.memberUsername}</Descriptions.Item>
          <Descriptions.Item label="退款金额">￥{detail.returnAmount}</Descriptions.Item>
          <Descriptions.Item label="退货原因">{detail.reason}</Descriptions.Item>
          <Descriptions.Item label="问题描述">{detail.description}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="退货人信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="退货人">{detail.returnName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{detail.returnPhone}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="退货商品">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="商品名称">{detail.productName}</Descriptions.Item>
          <Descriptions.Item label="品牌">{detail.productBrand}</Descriptions.Item>
          <Descriptions.Item label="规格">{detail.productAttr}</Descriptions.Item>
          <Descriptions.Item label="数量">{detail.productCount}</Descriptions.Item>
          <Descriptions.Item label="单价">￥{detail.productPrice}</Descriptions.Item>
          <Descriptions.Item label="实际价格">￥{detail.productRealPrice}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="处理退货申请"
        open={pendingStatus !== null}
        onOk={handleConfirm}
        onCancel={() => setPendingStatus(null)}
        destroyOnClose
      >
        <Input.TextArea
          rows={4}
          placeholder="请输入处理备注"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
    </Space>
  )
}
