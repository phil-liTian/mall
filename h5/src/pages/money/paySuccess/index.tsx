import { useNavigate } from 'react-router-dom'
import './index.css'

export default function PaySuccess() {
  const navigate = useNavigate()

  return (
    <div className="pay-success-page">
      <span className="pay-success__icon">✅</span>
      <span className="pay-success__text">支付成功</span>

      <div className="pay-success__btn-group">
        <button
          className="pay-success__btn"
          onClick={() => navigate('/order/list?status=1', { replace: true })}
        >
          查看订单
        </button>
        <button
          className="pay-success__btn hollow"
          onClick={() => navigate('/', { replace: true })}
        >
          返回首页
        </button>
      </div>
    </div>
  )
}
