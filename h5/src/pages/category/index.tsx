import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProductCateListAPI } from '@/api/home'
import type { PmsProductCategory } from '@/types/product'
import './index.css'

const DEFAULT_ICON = 'https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png'

export default function Category() {
  const navigate = useNavigate()
  const [topCateList, setTopCateList] = useState<PmsProductCategory[]>([])
  const [subCateList, setSubCateList] = useState<PmsProductCategory[]>([])
  const [currentCateId, setCurrentCateId] = useState(0)

  useEffect(() => {
    const loadTop = async () => {
      try {
        const res = await getProductCateListAPI('0')
        setTopCateList(res)
        if (res.length > 0) {
          setCurrentCateId(res[0].id)
          const subRes = await getProductCateListAPI(String(res[0].id))
          setSubCateList(subRes)
        }
      } catch (e) {
        console.error('加载分类数据失败', e)
      }
    }
    loadTop()
  }, [])

  const handleTabTap = async (item: PmsProductCategory) => {
    setCurrentCateId(item.id)
    try {
      const res = await getProductCateListAPI(String(item.id))
      setSubCateList(res)
    } catch (e) {
      console.error('加载子分类失败', e)
    }
  }

  const handleNavToList = (sid: number) => {
    navigate(`/product/list?fid=${currentCateId}&sid=${sid}`)
  }

  return (
    <div className="category-page">
      {/* 左侧一级分类 */}
      <div className="category-page__left">
        {topCateList.map((item) => (
          <div
            key={item.id}
            className={`category-page__left-item ${item.id === currentCateId ? 'active' : ''}`}
            onClick={() => handleTabTap(item)}
          >
            {item.name}
          </div>
        ))}
      </div>

      {/* 右侧二级分类 */}
      <div className="category-page__right">
        <div className="category-page__right-list">
          {subCateList.map((item) => (
            <div
              key={item.id}
              className="category-page__right-item"
              onClick={() => handleNavToList(item.id)}
            >
              <img src={item.icon || DEFAULT_ICON} alt={item.name} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
