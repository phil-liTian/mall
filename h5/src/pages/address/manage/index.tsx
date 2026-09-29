import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Toast, Switch } from 'antd-mobile'
import { addAddressAPI, updateAddressAPI, fetchAddressDetailAPI } from '@/api/address'
import type { MemberReceiveAddress } from '@/types/address'
import { NavBarCustom } from '@/components/NavBarCustom'
import './index.css'

// 将省市区字符串解析为 province / city / region
const covertAddress = (address: string): Pick<MemberReceiveAddress, 'province' | 'city' | 'region'> => {
  let rest = address
  let province = ''
  let city = ''
  let region = ''
  if (address.indexOf('省') !== -1) {
    province = rest.substring(0, rest.indexOf('省') + 1)
    rest = rest.replace(province, '')
    city = rest.substring(0, rest.indexOf('市') + 1)
    rest = rest.replace(city, '')
    region = rest.substring(0, rest.indexOf('区') + 1)
  } else {
    province = rest.substring(0, rest.indexOf('市') + 1)
    rest = rest.replace(province, '')
    city = ''
    region = rest.substring(0, rest.indexOf('区') + 1)
  }
  return { province, city, region }
}

export default function AddressManage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [addressData, setAddressData] = useState<MemberReceiveAddress>({
    name: '',
    phoneNumber: '',
    postCode: '',
    detailAddress: '',
    defaultStatus: 0,
    province: '',
    city: '',
    region: '',
    prefixAddress: '',
  })

  const loadAddressDetail = useCallback(async () => {
    if (!id) return
    try {
      const data = await fetchAddressDetailAPI(Number(id))
      setAddressData({
        ...data,
        prefixAddress:
          (data.province || '') + (data.city || '') + (data.region || ''),
      })
    } catch (e) {
      console.error('加载地址详情失败', e)
    }
  }, [id])

  useEffect(() => {
    loadAddressDetail()
  }, [loadAddressDetail])

  const update = (key: keyof MemberReceiveAddress, value: any) => {
    setAddressData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    update('defaultStatus', checked ? 1 : 0)
  }

  const handleConfirm = async () => {
    const data = { ...addressData }
    if (!data.name) {
      Toast.show({ content: '请填写收货人姓名' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(data.phoneNumber)) {
      Toast.show({ content: '请输入正确的手机号码' })
      return
    }
    if (!data.prefixAddress) {
      Toast.show({ content: '请输入所在区域' })
      return
    }
    const parsed = covertAddress(data.prefixAddress)
    data.province = parsed.province
    data.city = parsed.city
    data.region = parsed.region
    if (!data.province) {
      Toast.show({ content: '请输入正确的省市区' })
      return
    }
    if (!data.detailAddress) {
      Toast.show({ content: '请填写详细地址信息' })
      return
    }

    try {
      if (isEdit) {
        await updateAddressAPI({ ...data, id: Number(id) })
        Toast.show({ icon: 'success', content: '地址修改成功' })
      } else {
        await addAddressAPI(data)
        Toast.show({ icon: 'success', content: '地址添加成功' })
      }
      setTimeout(() => navigate(-1), 800)
    } catch (e) {
      console.error('保存地址失败', e)
    }
  }

  return (
    <div className="address-manage-page">
      <NavBarCustom title={isEdit ? '编辑收货地址' : '新增收货地址'} />

      <div className="am-form">
        <div className="am-row">
          <span className="am-row__tit">姓名</span>
          <input
            className="am-row__input"
            type="text"
            value={addressData.name}
            placeholder="收货人姓名"
            onChange={(e) => update('name', e.target.value)}
          />
        </div>
        <div className="am-row">
          <span className="am-row__tit">手机号码</span>
          <input
            className="am-row__input"
            type="tel"
            maxLength={11}
            value={addressData.phoneNumber}
            placeholder="收货人手机号码"
            onChange={(e) => update('phoneNumber', e.target.value)}
          />
        </div>
        <div className="am-row">
          <span className="am-row__tit">邮政编码</span>
          <input
            className="am-row__input"
            type="text"
            value={addressData.postCode || ''}
            placeholder="收货人邮政编码"
            onChange={(e) => update('postCode', e.target.value)}
          />
        </div>
        <div className="am-row">
          <span className="am-row__tit">所在区域</span>
          <input
            className="am-row__input"
            type="text"
            value={addressData.prefixAddress || ''}
            placeholder="如：广东省深圳市南山区"
            onChange={(e) => update('prefixAddress', e.target.value)}
          />
        </div>
        <div className="am-row">
          <span className="am-row__tit">详细地址</span>
          <input
            className="am-row__input"
            type="text"
            value={addressData.detailAddress}
            placeholder="详细地址"
            onChange={(e) => update('detailAddress', e.target.value)}
          />
        </div>

        <div className="am-row am-row--default">
          <span className="am-row__tit">设为默认</span>
          <Switch
            checked={addressData.defaultStatus === 1}
            onChange={handleSwitchChange}
            style={{ '--checked-color': '#fa436a' }}
          />
        </div>
      </div>

      <button className="am-submit-btn" onClick={handleConfirm}>
        提交
      </button>
    </div>
  )
}
