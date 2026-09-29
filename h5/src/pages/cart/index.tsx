import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, Toast, Checkbox } from 'antd-mobile'
import { getCartListAPI, deleteCartAPI, updateCartQuantityAPI, clearCartAPI } from '@/api/cart'
import type { CartItem } from '@/types/cart'
import { QuantityStepper } from '@/components/Stepper'
import { Empty } from '@/components/Empty'
import { formatPrice } from '@/utils/format'
import './index.css'

export default function Cart() {
  const navigate = useNavigate()
  const [cartList, setCartList] = useState<CartItem[]>([])

  const loadData = async () => {
    try {
      const list = await getCartListAPI()
      const mapped = list.map((item) => {
        let spDataStr = ''
        try {
          const arr = JSON.parse(item.productAttr || '[]') as { key: string; value: string }[]
          spDataStr = arr.map((a) => `${a.key}:${a.value}`).join('; ')
        } catch {
          spDataStr = ''
        }
        return { ...item, checked: true, spDataStr }
      })
      setCartList(mapped)
    } catch (e) {
      console.error('加载购物车失败', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 解析规格文字
  const parseSpData = (item: CartItem): string => {
    try {
      const arr = JSON.parse(item.productAttr || '[]') as { key: string; value: string }[]
      return arr.map((a) => `${a.key}:${a.value}`).join('; ')
    } catch {
      return ''
    }
  }

  const allChecked = useMemo(
    () => cartList.length > 0 && cartList.every((item) => item.checked),
    [cartList],
  )

  const totalPrice = useMemo(
    () =>
      cartList
        .filter((item) => item.checked)
        .reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartList],
  )

  const checkedCount = useMemo(
    () => cartList.filter((item) => item.checked).length,
    [cartList],
  )

  const handleCheck = (id: string) => {
    setCartList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    )
  }

  const handleCheckAll = () => {
    const checked = !allChecked
    setCartList((prev) => prev.map((item) => ({ ...item, checked })))
  }

  const handleNumberChange = async (id: string, quantity: number) => {
    try {
      await updateCartQuantityAPI({ id, quantity })
      setCartList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
      )
    } catch (e) {
      console.error('更新数量失败', e)
    }
  }

  const handleDelete = async (id: string) => {
    const confirm = await Dialog.confirm({ content: '确定删除该商品？' })
    if (confirm) {
      try {
        await deleteCartAPI({ ids: id })
        setCartList((prev) => prev.filter((item) => item.id !== id))
        Toast.show({ icon: 'success', content: '删除成功' })
      } catch (e) {
        console.error('删除失败', e)
      }
    }
  }

  const handleClearCart = async () => {
    const confirm = await Dialog.confirm({ content: '清空购物车？' })
    if (confirm) {
      try {
        await clearCartAPI()
        setCartList([])
        Toast.show({ icon: 'success', content: '已清空' })
      } catch (e) {
        console.error('清空失败', e)
      }
    }
  }

  const handleCreateOrder = () => {
    const checkedIds = cartList.filter((item) => item.checked).map((item) => Number(item.id))
    if (checkedIds.length === 0) {
      Toast.show({ content: '您还未选择要下单的商品！' })
      return
    }
    navigate(`/order/create?cartIds=${JSON.stringify(checkedIds)}`)
  }

  if (cartList.length === 0) {
    return (
      <div className="cart-empty">
        <Empty text="购物车空空如也" icon={<span className="cart-empty__icon">🛒</span>} />
        <button className="cart-empty__btn" onClick={() => navigate('/')}>
          随便逛逛
        </button>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-page__header">
        <span>购物车 ({cartList.length})</span>
        {allChecked && (
          <span className="cart-page__clear" onClick={handleClearCart}>
            清空
          </span>
        )}
      </div>

      <div className="cart-page__list">
        {cartList.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item__check">
              <Checkbox
                checked={item.checked}
                onChange={() => handleCheck(item.id)}
                style={{ '--icon-size': '40px', '--font-size': '0px' }}
              />
            </div>
            <div
              className="cart-item__img"
              onClick={() => navigate(`/product/detail/${item.productId}`)}
            >
              <img src={item.productPic} alt={item.productName} loading="lazy" />
            </div>
            <div className="cart-item__info">
              <p
                className="cart-item__name ellipsis-2"
                onClick={() => navigate(`/product/detail/${item.productId}`)}
              >
                {item.productName}
              </p>
              {item.spDataStr && (
                <p className="cart-item__attr ellipsis">{parseSpData(item)}</p>
              )}
              <div className="cart-item__bottom">
                <span className="price">
                  <span className="price-symbol">¥</span>
                  {formatPrice(item.price, false)}
                </span>
                <div className="cart-item__action">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(val) => handleNumberChange(item.id, val)}
                  />
                  <span className="cart-item__del" onClick={() => handleDelete(item.id)}>
                    删除
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部结算栏 */}
      <div className="cart-footer">
        <div className="cart-footer__left">
          <Checkbox
            checked={allChecked}
            onChange={handleCheckAll}
            style={{ '--icon-size': '40px', '--font-size': '24px' }}
          >
            全选
          </Checkbox>
        </div>
        <div className="cart-footer__total">
          合计：<span className="price">¥{formatPrice(totalPrice, false)}</span>
        </div>
        <button
          className="cart-footer__btn"
          disabled={checkedCount === 0}
          onClick={handleCreateOrder}
        >
          去结算({checkedCount})
        </button>
      </div>
    </div>
  )
}
