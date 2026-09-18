import { useState } from 'react'
import { Upload, App } from 'antd'
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

interface ImageUploadProps {
  value?: string
  onChange?: (url: string) => void
}

// 图片上传：值为图片 URL 字符串，可作为 Form.Item 受控子组件。
// mock 环境无真实上传接口，这里用本地 objectURL 模拟成功。
// 接入真实 OSS/MinIO 时，把 doUpload 换成调用上传接口并返回图片地址即可。
export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件')
      return Upload.LIST_IGNORE
    }
    const under5M = file.size / 1024 / 1024 < 5
    if (!under5M) {
      message.error('图片需小于 5MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  // ponytail: mock 上传——直接用本地 objectURL，不打后端。接后端时改这里。
  const customRequest: UploadProps['customRequest'] = ({ file, onSuccess }) => {
    setLoading(true)
    const url = URL.createObjectURL(file as File)
    setTimeout(() => {
      onChange?.(url)
      setLoading(false)
      onSuccess?.(url)
    }, 300)
  }

  return (
    <Upload
      listType="picture-card"
      showUploadList={false}
      accept="image/*"
      beforeUpload={beforeUpload}
      customRequest={customRequest}
    >
      {value ? (
        <img src={value} alt="图片" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <div>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      )}
    </Upload>
  )
}
