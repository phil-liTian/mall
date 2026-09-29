import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dialog, Toast } from 'antd-mobile'
import { fetchAddressListAPI, deleteAddressAPI } from '@/api/address'
import type { MemberReceiveAddress } from '@/types/address'
import { NavBarCustom } from '@/components/NavBarCustom'
import { Empty } from '@/components/Empty'
import './index.css'

export default function AddressList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // source=1 表示从订单页进入选择地址
  const source = Number(searchParams.get('source')) || 0
  const [addressList, setAddressList] = useState<MemberReceiveAddress[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const list = await fetchAddressListAPI()
      setAddressList(list || [])
    } catch (e) {
      console.error('加载地址列表失败', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 选择地址（订单页进入时）
  const handleCheckAddress = (item: MemberReceiveAddress) => {
    if (source === 1) {
      // 通过 sessionStorage 传递选中的地址给上一页
      sessionStorage.setItem('mall_h5_selected_address_id', String(item.id))
      navigate(-1)
    }
  }

  // 新增 / 编辑地址
  const handleAddAddress = (type: 'add' | 'edit', item?: MemberReceiveAddress) => {
    if (type === 'edit' && item?.id) {
      navigate(`/address/manage/${item.id}`)
    } else {
      navigate('/address/manage')
    }
  }

  // 删除地址
  const handleDeleteAddress = async (id: number) => {
    const confirm = await Dialog.confirm({ content: '是否要删除该地址？' })
    if (!confirm) return
    try {
      await deleteAddressAPI(id)
      Toast.show({ icon: 'success', content: '已删除' })
      loadData()
    } catch (e) {
      console.error('删除地址失败', e)
    }
  }

  return (
    <div className="address-list-page">
      <NavBarCustom title="收货地址" />

      <div className="address-list__content">
        {!loading && addressList.length === 0 ? (
          <Empty text="暂无收货地址" icon={<span className="address-list__empty">📍</span>} />
        ) : (
          addressList.map((item) => (
            <div className="address-item" key={item.id}>
              <div className="address-item__wrapper" onClick={() => handleCheckAddress(item)}>
                <div className="address-item__address-box">
                  {item.defaultStatus === 1 && <span className="address-item__tag">默认</span>}
                  <span className="address-item__address">
                    {item.province} {item.city} {item.region} {item.detailAddress}
                  </span>
                </div>
                <div className="address-item__u-box">
                  <span className="address-item__name">{item.name}</span>
                  <span className="address-item__mobile">{item.phoneNumber}</span>
                </div>
              </div>
              <span className="address-item__edit" onClick={() => handleAddAddress('edit', item)}>
                ✏️
              </span>
              <span
                className="address-item__del"
                onClick={() => handleDeleteAddress(item.id as number)}
              >
                🗑️
              </span>
            </div>
          ))
        )}
      </div>

      <button className="address-list__add-btn" onClick={() => handleAddAddress('add')}>
        新增地址
      </button>
    </div>
  )
}
