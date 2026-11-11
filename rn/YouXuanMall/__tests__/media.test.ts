import {imageUri} from '../src/media';

test('MinIO images created on the admin site load through the public H5 file proxy', () => {
  expect(imageUri('http://mall.starchase.xyz/mall-files/mall/products/item.jpg'))
    .toBe('http://m.starchase.xyz/mall-files/mall/products/item.jpg');
  expect(imageUri('http://minio:9000/mall/products/item.jpg'))
    .toBe('http://m.starchase.xyz/mall-files/mall/products/item.jpg');
  expect(imageUri('http://localhost:9000/mall/products/item.jpg'))
    .toBe('http://m.starchase.xyz/mall-files/mall/products/item.jpg');
});

test('external product images use HTTPS where available', () => {
  expect(imageUri(' http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/item.jpg '))
    .toBe('https://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/item.jpg');
  expect(imageUri('http://img10.360buyimg.com/item.jpg'))
    .toBe('https://img10.360buyimg.com/item.jpg');
  expect(imageUri('')).toBeUndefined();
});
