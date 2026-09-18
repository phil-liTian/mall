# mall 接口文档

> 基于项目 Controller 源码整理。三个可运行服务各自独立提供 REST API。

## 服务与端口

| 服务 | 端口 | 说明 | Swagger |
|------|------|------|---------|
| mall-admin | 8082 | 后台管理 API | http://localhost:8082/swagger-ui/ |
| mall-portal | 8085 | C 端用户商城 API | http://localhost:8085/swagger-ui/ |
| mall-search | 8081 | 商品搜索 API(依赖 Elasticsearch) | http://localhost:8081/swagger-ui/ |

## 认证说明

- **admin**:`POST /admin/login` 获取 JWT,后续请求带 `Authorization: Bearer <token>`。
- **portal**:`POST /sso/login` 获取 JWT,同样带 `Authorization` 头。
- 白名单(登录/注册/Swagger/静态资源等)无需 token。
- 两端 JWT 独立(密钥不同),互不通用。

---

# 一、mall-admin(后台管理，8082）

## UMS 用户权限管理

### UmsAdminController — 后台用户管理
基础路径: `/admin`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /admin/register | 用户注册 | umsAdminParam(body) |
| POST | /admin/login | 登录返回 token | umsAdminLoginParam(body) |
| GET | /admin/refreshToken | 刷新 token | request |
| GET | /admin/info | 获取当前登录用户信息 | principal |
| POST | /admin/logout | 登出 | principal |
| GET | /admin/list | 分页获取用户列表 | keyword, pageSize, pageNum |
| GET | /admin/{id} | 获取指定用户信息 | id |
| POST | /admin/update/{id} | 修改指定用户信息 | id, admin(body) |
| POST | /admin/updatePassword | 修改用户密码 | updatePasswordParam(body) |
| POST | /admin/delete/{id} | 删除用户 | id |
| POST | /admin/updateStatus/{id} | 修改帐号状态 | id, status |
| POST | /admin/role/update | 给用户分配角色 | adminId, roleIds |
| GET | /admin/role/{adminId} | 获取用户的角色 | adminId |

### UmsRoleController — 后台角色管理
基础路径: `/role`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /role/create | 添加角色 | role(body) |
| POST | /role/update/{id} | 修改角色 | id, role(body) |
| POST | /role/delete | 批量删除角色 | ids |
| GET | /role/listAll | 获取所有角色 | 无 |
| GET | /role/list | 分页获取角色列表 | keyword, pageSize, pageNum |
| POST | /role/updateStatus/{id} | 修改角色状态 | id, status |
| GET | /role/listMenu/{roleId} | 获取角色相关菜单 | roleId |
| GET | /role/listResource/{roleId} | 获取角色相关资源 | roleId |
| POST | /role/allocMenu | 给角色分配菜单 | roleId, menuIds |
| POST | /role/allocResource | 给角色分配资源 | roleId, resourceIds |

### UmsMenuController — 后台菜单管理
基础路径: `/menu`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /menu/create | 添加菜单 | umsMenu(body) |
| POST | /menu/update/{id} | 修改菜单 | id, umsMenu(body) |
| GET | /menu/{id} | 获取菜单详情 | id |
| POST | /menu/delete/{id} | 删除菜单 | id |
| GET | /menu/list/{parentId} | 分页查询菜单 | parentId, pageSize, pageNum |
| GET | /menu/treeList | 树形返回所有菜单 | 无 |
| POST | /menu/updateHidden/{id} | 修改菜单显示状态 | id, hidden |

### UmsResourceController — 后台资源管理
基础路径: `/resource`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /resource/create | 添加资源 | umsResource(body) |
| POST | /resource/update/{id} | 修改资源 | id, umsResource(body) |
| GET | /resource/{id} | 获取资源详情 | id |
| POST | /resource/delete/{id} | 删除资源 | id |
| GET | /resource/list | 分页模糊查询资源 | categoryId, nameKeyword, urlKeyword, pageSize, pageNum |
| GET | /resource/listAll | 查询所有资源 | 无 |

### UmsResourceCategoryController — 资源分类管理
基础路径: `/resourceCategory`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /resourceCategory/listAll | 查询所有资源分类 | 无 |
| POST | /resourceCategory/create | 添加资源分类 | umsResourceCategory(body) |
| POST | /resourceCategory/update/{id} | 修改资源分类 | id, umsResourceCategory(body) |
| POST | /resourceCategory/delete/{id} | 删除资源分类 | id |

### UmsMemberLevelController — 会员等级管理
基础路径: `/memberLevel`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /memberLevel/list | 查询所有会员等级 | defaultStatus |

## PMS 商品管理

### PmsProductController — 商品管理
基础路径: `/product`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /product/create | 创建商品 | productParam(body) |
| GET | /product/updateInfo/{id} | 获取商品编辑信息 | id |
| POST | /product/update/{id} | 更新商品 | id, productParam(body) |
| GET | /product/list | 查询商品 | productQueryParam, pageSize, pageNum |
| GET | /product/simpleList | 按名称/货号模糊查询 | keyword |
| POST | /product/update/verifyStatus | 批量修改审核状态 | ids, verifyStatus, detail |
| POST | /product/update/publishStatus | 批量上下架 | ids, publishStatus |
| POST | /product/update/recommendStatus | 批量推荐 | ids, recommendStatus |
| POST | /product/update/newStatus | 批量设为新品 | ids, newStatus |
| POST | /product/update/deleteStatus | 批量修改删除状态 | ids, deleteStatus |

### PmsProductCategoryController — 商品分类管理
基础路径: `/productCategory`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /productCategory/create | 添加分类 | productCategoryParam(body) |
| POST | /productCategory/update/{id} | 修改分类 | id, productCategoryParam(body) |
| GET | /productCategory/list/{parentId} | 分页查询分类 | parentId, pageSize, pageNum |
| GET | /productCategory/{id} | 获取分类 | id |
| POST | /productCategory/delete/{id} | 删除分类 | id |
| POST | /productCategory/update/navStatus | 修改导航显示状态 | ids, navStatus |
| POST | /productCategory/update/showStatus | 修改显示状态 | ids, showStatus |
| GET | /productCategory/list/withChildren | 查询一级分类及子分类 | 无 |

### PmsBrandController — 商品品牌管理
基础路径: `/brand`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /brand/listAll | 获取全部品牌 | 无 |
| POST | /brand/create | 添加品牌 | pmsBrand(body) |
| POST | /brand/update/{id} | 更新品牌 | id, pmsBrandParam(body) |
| GET | /brand/delete/{id} | 删除品牌 | id |
| GET | /brand/list | 分页获取品牌列表 | keyword, showStatus, pageNum, pageSize |
| GET | /brand/{id} | 查询品牌信息 | id |
| POST | /brand/delete/batch | 批量删除品牌 | ids |
| POST | /brand/update/showStatus | 批量更新显示状态 | ids, showStatus |
| POST | /brand/update/factoryStatus | 批量更新厂家状态 | ids, factoryStatus |

### PmsProductAttributeController — 商品属性管理
基础路径: `/productAttribute`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /productAttribute/list/{cid} | 按分类查询属性/参数列表 | cid, type(0属性/1参数), pageSize, pageNum |
| POST | /productAttribute/create | 添加属性 | productAttributeParam(body) |
| POST | /productAttribute/update/{id} | 修改属性 | id, productAttributeParam(body) |
| GET | /productAttribute/{id} | 查询单个属性 | id |
| POST | /productAttribute/delete | 批量删除属性 | ids |
| GET | /productAttribute/attrInfo/{productCategoryId} | 按分类获取属性及分类 | productCategoryId |

### PmsProductAttributeCategoryController — 属性分类管理
基础路径: `/productAttribute/category`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /productAttribute/category/create | 添加属性分类 | name |
| POST | /productAttribute/category/update/{id} | 修改属性分类 | id, name |
| GET | /productAttribute/category/delete/{id} | 删除属性分类 | id |
| GET | /productAttribute/category/{id} | 获取属性分类 | id |
| GET | /productAttribute/category/list | 分页获取属性分类 | pageSize, pageNum |
| GET | /productAttribute/category/list/withAttr | 获取属性分类及下属属性 | 无 |

### PmsSkuStockController — SKU 库存管理
基础路径: `/sku`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /sku/{pid} | 模糊搜索 SKU 库存 | pid, keyword |
| POST | /sku/update/{pid} | 批量更新 SKU 库存 | pid, skuStockList(body) |

## OMS 订单管理

### OmsOrderController — 订单管理
基础路径: `/order`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /order/list | 查询订单(仅 delete_status=0) | queryParam, pageSize, pageNum |
| POST | /order/update/delivery | 批量发货 | deliveryParamList(body) |
| POST | /order/update/close | 批量关闭订单 | ids, note |
| POST | /order/delete | 批量删除订单(软删除) | ids |
| GET | /order/{id} | 订单详情(信息+商品+操作记录) | id |
| POST | /order/update/receiverInfo | 修改收货人信息 | receiverInfoParam(body) |
| POST | /order/update/moneyInfo | 修改订单费用 | moneyInfoParam(body) |
| POST | /order/update/note | 备注订单 | id, note, status |

### OmsOrderReturnApplyController — 退货申请管理
基础路径: `/returnApply`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /returnApply/list | 分页查询退货申请 | queryParam, pageSize, pageNum |
| POST | /returnApply/delete | 批量删除退货申请 | ids |
| GET | /returnApply/{id} | 退货申请详情 | id |
| POST | /returnApply/update/status/{id} | 修改退货申请状态 | id, statusParam(body) |

### OmsOrderReturnReasonController — 退货原因管理
基础路径: `/returnReason`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /returnReason/create | 添加退货原因 | returnReason(body) |
| POST | /returnReason/update/{id} | 修改退货原因 | id, returnReason(body) |
| POST | /returnReason/delete | 批量删除 | ids |
| GET | /returnReason/list | 分页查询 | pageSize, pageNum |
| GET | /returnReason/{id} | 获取详情 | id |
| POST | /returnReason/update/status | 修改启用状态 | status, ids |

### OmsOrderSettingController — 订单设置管理
基础路径: `/orderSetting`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /orderSetting/{id} | 获取订单设置 | id |
| POST | /orderSetting/update/{id} | 修改订单设置 | id, orderSetting(body) |

### OmsCompanyAddressController — 公司收货地址管理
基础路径: `/companyAddress`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /companyAddress/list | 获取所有收货地址 | 无 |

## SMS 营销管理

### SmsCouponController — 优惠券管理
基础路径: `/coupon`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /coupon/create | 添加优惠券 | couponParam(body) |
| POST | /coupon/delete/{id} | 删除优惠券 | id |
| POST | /coupon/update/{id} | 修改优惠券 | id, couponParam(body) |
| GET | /coupon/list | 分页获取优惠券列表 | name, type, pageSize, pageNum |
| GET | /coupon/{id} | 获取优惠券详情 | id |

### SmsCouponHistoryController — 优惠券领取记录
基础路径: `/couponHistory`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /couponHistory/list | 分页获取领取记录 | couponId, useStatus, orderSn, pageSize, pageNum |

### SmsFlashPromotionController — 限时购活动管理
基础路径: `/flash`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /flash/create | 添加活动 | flashPromotion(body) |
| POST | /flash/update/{id} | 编辑活动 | id, flashPromotion(body) |
| POST | /flash/delete/{id} | 删除活动 | id |
| POST | /flash/update/status/{id} | 修改上下线状态 | id, status |
| GET | /flash/{id} | 活动详情 | id |
| GET | /flash/list | 按名称分页查询 | keyword, pageSize, pageNum |

### SmsFlashPromotionSessionController — 限时购场次管理
基础路径: `/flashSession`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /flashSession/create | 添加场次 | promotionSession(body) |
| POST | /flashSession/update/{id} | 修改场次 | id, promotionSession(body) |
| POST | /flashSession/update/status/{id} | 修改启用状态 | id, status |
| POST | /flashSession/delete/{id} | 删除场次 | id |
| GET | /flashSession/{id} | 场次详情 | id |
| GET | /flashSession/list | 获取全部场次 | 无 |
| GET | /flashSession/selectList | 获取可选场次及数量 | flashPromotionId |

### SmsFlashPromotionProductRelationController — 限时购商品关系管理
基础路径: `/flashProductRelation`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /flashProductRelation/create | 批量添加关联 | relationList(body) |
| POST | /flashProductRelation/update/{id} | 修改关联 | id, relation(body) |
| POST | /flashProductRelation/delete/{id} | 删除关联 | id |
| GET | /flashProductRelation/{id} | 获取关联商品促销信息 | id |
| GET | /flashProductRelation/list | 分页查询场次关联及商品 | flashPromotionId, flashPromotionSessionId, pageSize, pageNum |

### SmsHomeAdvertiseController — 首页轮播广告管理
基础路径: `/home/advertise`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /home/advertise/create | 添加广告 | advertise(body) |
| POST | /home/advertise/delete | 删除广告 | ids |
| POST | /home/advertise/update/status/{id} | 修改上下线状态 | id, status |
| GET | /home/advertise/{id} | 广告详情 | id |
| POST | /home/advertise/update/{id} | 修改广告 | id, advertise(body) |
| GET | /home/advertise/list | 分页查询广告 | name, type, endTime, pageSize, pageNum |

### SmsHomeBrandController — 首页品牌管理
基础路径: `/home/brand`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /home/brand/create | 添加首页推荐品牌 | homeBrandList(body) |
| POST | /home/brand/update/sort/{id} | 修改排序 | id, sort |
| POST | /home/brand/delete | 批量删除 | ids |
| POST | /home/brand/update/recommendStatus | 批量修改推荐状态 | ids, recommendStatus |
| GET | /home/brand/list | 分页查询推荐品牌 | brandName, recommendStatus, pageSize, pageNum |

### SmsHomeNewProductController — 首页新品管理
基础路径: `/home/newProduct`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /home/newProduct/create | 添加首页新品 | homeNewProductList(body) |
| POST | /home/newProduct/update/sort/{id} | 修改排序 | id, sort |
| POST | /home/newProduct/delete | 批量删除 | ids |
| POST | /home/newProduct/update/recommendStatus | 批量修改状态 | ids, recommendStatus |
| GET | /home/newProduct/list | 分页查询新品 | productName, recommendStatus, pageSize, pageNum |

### SmsHomeRecommendProductController — 首页人气推荐管理
基础路径: `/home/recommendProduct`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /home/recommendProduct/create | 添加推荐 | homeRecommendProductList(body) |
| POST | /home/recommendProduct/update/sort/{id} | 修改排序 | id, sort |
| POST | /home/recommendProduct/delete | 批量删除 | ids |
| POST | /home/recommendProduct/update/recommendStatus | 批量修改状态 | ids, recommendStatus |
| GET | /home/recommendProduct/list | 分页查询推荐 | productName, recommendStatus, pageSize, pageNum |

### SmsHomeRecommendSubjectController — 首页专题推荐管理
基础路径: `/home/recommendSubject`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /home/recommendSubject/create | 添加专题推荐 | homeRecommendSubjectList(body) |
| POST | /home/recommendSubject/update/sort/{id} | 修改排序 | id, sort |
| POST | /home/recommendSubject/delete | 批量删除 | ids |
| POST | /home/recommendSubject/update/recommendStatus | 批量修改状态 | ids, recommendStatus |
| GET | /home/recommendSubject/list | 分页查询专题推荐 | subjectName, recommendStatus, pageSize, pageNum |

## CMS 内容管理

### CmsSubjectController — 商品专题管理
基础路径: `/subject`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /subject/listAll | 获取全部专题 | 无 |
| GET | /subject/list | 按名称分页获取专题 | keyword, pageNum, pageSize |

### CmsPrefrenceAreaController — 商品优选管理
基础路径: `/prefrenceArea`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /prefrenceArea/listAll | 获取所有商品优选 | 无 |

## 对象存储

### MinioController — MinIO 对象存储
基础路径: `/minio`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /minio/upload | 文件上传 | file(@RequestPart) |
| POST | /minio/delete | 文件删除 | objectName |

### OssController — 阿里云 OSS 对象存储
基础路径: `/aliyun/oss`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /aliyun/oss/policy | 上传签名生成 | 无 |
| POST | /aliyun/oss/callback | 上传成功回调 | request |

---

# 二、mall-portal(C 端商城，8085）

### UmsMemberController — 会员登录注册
基础路径: `/sso`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /sso/register | 会员注册 | username, password, telephone, authCode |
| POST | /sso/login | 会员登录 | username, password |
| GET | /sso/info | 获取会员信息 | principal |
| GET | /sso/getAuthCode | 获取验证码 | telephone |
| POST | /sso/updatePassword | 修改密码 | telephone, password, authCode |
| GET | /sso/refreshToken | 刷新 token | header token |

### HomeController — 首页内容
基础路径: `/home`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /home/content | 首页内容信息 | 无 |
| GET | /home/recommendProductList | 分页获取推荐商品 | pageSize, pageNum |
| GET | /home/productCateList/{parentId} | 获取首页商品分类 | parentId |
| GET | /home/subjectList | 按分类分页获取专题 | cateId, pageSize, pageNum |
| GET | /home/hotProductList | 分页获取人气推荐商品 | pageNum, pageSize |
| GET | /home/newProductList | 分页获取新品推荐商品 | pageNum, pageSize |

### PmsPortalProductController — 前台商品
基础路径: `/product`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /product/search | 综合搜索、筛选、排序 | keyword, brandId, productCategoryId, pageNum, pageSize, sort |
| GET | /product/categoryTreeList | 树形获取所有商品分类 | 无 |
| GET | /product/detail/{id} | 获取商品详情 | id |

### PmsPortalBrandController — 前台品牌
基础路径: `/brand`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /brand/recommendList | 分页获取推荐品牌 | pageSize, pageNum |
| GET | /brand/detail/{brandId} | 品牌详情 | brandId |
| GET | /brand/productList | 分页获取品牌商品 | brandId, pageNum, pageSize |

### OmsCartItemController — 购物车管理
基础路径: `/cart`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /cart/add | 添加商品到购物车 | cartItem(body) |
| GET | /cart/list | 获取购物车列表 | 无 |
| GET | /cart/list/promotion | 购物车列表(含促销信息) | cartIds |
| GET | /cart/update/quantity | 修改商品数量 | id, quantity |
| GET | /cart/getProduct/{productId} | 获取商品规格(重选用) | productId |
| POST | /cart/update/attr | 修改商品规格 | cartItem(body) |
| POST | /cart/delete | 删除指定商品 | ids |
| POST | /cart/clear | 清空购物车 | 无 |

### OmsPortalOrderController — 订单管理
基础路径: `/order`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /order/generateConfirmOrder | 生成确认单 | cartIds(body) |
| POST | /order/generateOrder | 生成订单(下单) | orderParam(body) |
| POST | /order/paySuccess | 支付成功回调 | orderId, payType |
| POST | /order/cancelTimeOutOrder | 自动取消超时订单 | 无 |
| POST | /order/cancelOrder | 取消单个超时订单 | orderId |
| GET | /order/list | 按状态分页获取订单列表 | status, pageNum, pageSize |
| GET | /order/detail/{orderId} | 订单详情 | orderId |
| POST | /order/cancelUserOrder | 用户取消订单 | orderId |
| POST | /order/confirmReceiveOrder | 确认收货 | orderId |
| POST | /order/deleteOrder | 删除订单 | orderId |

### OmsPortalOrderReturnApplyController — 退货申请
基础路径: `/returnApply`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /returnApply/create | 申请退货 | returnApply(body) |

### AlipayController — 支付宝支付
基础路径: `/alipay`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /alipay/pay | 电脑网站支付 | aliPayParam |
| GET | /alipay/webPay | 手机网站支付 | aliPayParam |
| POST | /alipay/notify | 异步回调 | request |
| GET | /alipay/query | 交易查询 | outTradeNo, tradeNo |

> 注：学习环境已将 `webPay` 改为直接标记订单为已支付,不再调用真实支付宝(见 `AlipayServiceImpl`)。

### UmsMemberReceiveAddressController — 会员收货地址
基础路径: `/member/address`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /member/address/add | 添加收货地址 | address(body) |
| POST | /member/address/delete/{id} | 删除收货地址 | id |
| POST | /member/address/update/{id} | 修改收货地址 | id, address(body) |
| GET | /member/address/list | 获取所有收货地址 | 无 |
| GET | /member/address/{id} | 收货地址详情 | id |

### UmsMemberCouponController — 用户优惠券
基础路径: `/member/coupon`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /member/coupon/add/{couponId} | 领取优惠券 | couponId |
| GET | /member/coupon/listHistory | 优惠券历史列表 | useStatus |
| GET | /member/coupon/list | 优惠券列表 | useStatus |
| GET | /member/coupon/list/cart/{type} | 购物车相关优惠券 | type |
| GET | /member/coupon/listByProduct/{productId} | 当前商品相关优惠券 | productId |

### MemberProductCollectionController — 商品收藏
基础路径: `/member/productCollection`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /member/productCollection/add | 添加收藏 | productCollection(body) |
| POST | /member/productCollection/delete | 删除收藏 | productId |
| GET | /member/productCollection/list | 收藏列表 | pageNum, pageSize |
| GET | /member/productCollection/detail | 收藏详情 | productId |
| POST | /member/productCollection/clear | 清空收藏 | 无 |

### MemberAttentionController — 品牌关注
基础路径: `/member/attention`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /member/attention/add | 添加品牌关注 | memberBrandAttention(body) |
| POST | /member/attention/delete | 取消品牌关注 | brandId |
| GET | /member/attention/list | 品牌关注列表 | pageNum, pageSize |
| GET | /member/attention/detail | 品牌关注详情 | brandId |
| POST | /member/attention/clear | 清空品牌关注 | 无 |

### MemberReadHistoryController — 浏览记录
基础路径: `/member/readHistory`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /member/readHistory/create | 创建浏览记录 | memberReadHistory(body) |
| POST | /member/readHistory/delete | 删除浏览记录 | ids |
| POST | /member/readHistory/clear | 清空浏览记录 | 无 |
| GET | /member/readHistory/list | 分页获取浏览记录 | pageNum, pageSize |

---

# 三、mall-search(商品搜索，8081）

### EsProductController — 搜索商品管理
基础路径: `/esProduct`

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /esProduct/importAll | 全量导入数据库商品到 ES | 无 |
| GET | /esProduct/delete/{id} | 按 id 删除商品 | id |
| POST | /esProduct/delete/batch | 批量删除商品 | ids |
| POST | /esProduct/create/{id} | 按 id 创建/同步商品到 ES | id |
| GET | /esProduct/search/simple | 简单搜索 | keyword, pageNum, pageSize |
| GET | /esProduct/search | 综合搜索、筛选、排序 | keyword, brandId, productCategoryId, pageNum, pageSize, sort(0相关度/1新品/2销量/3价格升/4价格降) |
| GET | /esProduct/recommend/{id} | 按商品 id 推荐 | id, pageNum, pageSize |
| GET | /esProduct/search/relate | 搜索相关品牌、分类、筛选属性(聚合) | keyword |

> 使用前需启动 Elasticsearch 7.17.3(含 ik 中文分词插件),并先调用 `/esProduct/importAll` 灌入数据。

---

## 附:核心下单链路(portal）

```
POST /sso/login                 登录拿 token
POST /cart/add                  加购物车
POST /order/generateConfirmOrder 生成确认单(促销计算)
POST /order/generateOrder       下单(发 RabbitMQ 延迟取消消息)
POST /order/paySuccess          模拟支付成功 → 订单转"待发货"
GET  /order/list                查看订单
```

---

# 四、请求/响应 JSON 示例

## 统一约定

所有接口返回统一包装 `CommonResult`：

```json
{ "code": 200, "message": "操作成功", "data": {} }
```

- `code`：200 成功；401 未登录/token 失效；500 失败。
- 分页接口的 `data` 为 `CommonPage`：

```json
{
  "pageNum": 1, "pageSize": 5, "totalPage": 13, "total": 65,
  "list": [ ]
}
```

- 需登录的接口统一带请求头：`Authorization: Bearer <token>`。

---

## 核心链路示例（portal，8085）

### POST /sso/login — 会员登录
请求（`application/x-www-form-urlencoded`）：
```
username=windy&password=123456
```
响应：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "tokenHead": "Bearer ",
    "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ3aW5keS..."
  }
}
```

### POST /sso/register — 会员注册
请求（form）：
```
username=newuser&password=123456&telephone=13800138000&authCode=1234
```
响应：
```json
{ "code": 200, "message": "操作成功", "data": null }
```

### POST /cart/add — 添加商品到购物车
请求（`application/json`）：
```json
{
  "productId": 41,
  "productSkuId": 101,
  "quantity": 1,
  "price": 2099.00,
  "productAttr": "[{\"key\":\"颜色\",\"value\":\"红色\"}]"
}
```
响应：
```json
{ "code": 200, "message": "操作成功", "data": 1 }
```

### POST /order/generateConfirmOrder — 生成确认单
请求（json，购物车 id 数组）：
```json
[115]
```
响应（含地址、商品、金额、可用优惠券）：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "cartPromotionItemList": [
      { "id": 115, "productId": 41, "productName": "商品名", "price": 2099.00, "quantity": 1 }
    ],
    "memberReceiveAddressList": [
      { "id": 7, "name": "收货人", "phoneNumber": "138****0000", "detailAddress": "xxx" }
    ],
    "couponHistoryDetailList": [],
    "calcAmount": { "totalAmount": 2099.00, "freightAmount": 0, "promotionAmount": 0, "payAmount": 2099.00 }
  }
}
```

### POST /order/generateOrder — 下单
请求（json，`OrderParam`）：
```json
{
  "payType": 0,
  "cartIds": [115],
  "memberReceiveAddressId": 7,
  "couponId": null,
  "useIntegration": 0
}
```
> `payType`：0->未支付 1->支付宝 2->微信。下单成功后会发送 RabbitMQ 延迟消息用于超时自动取消。

响应：
```json
{
  "code": 200,
  "message": "下单成功",
  "data": {
    "order": { "id": 78, "orderSn": "202609170100000002", "status": 0, "totalAmount": 2099.00 },
    "orderItemList": [ { "productId": 41, "productQuantity": 1 } ]
  }
}
```

### POST /order/paySuccess — 支付成功回调
请求（form，注意 `orderId` 为主键 id 非订单号）：
```
orderId=78&payType=1
```
响应：
```json
{ "code": 200, "message": "支付成功", "data": 1 }
```

### GET /order/list — 订单列表
请求：`/order/list?status=-1&pageNum=1&pageSize=5`（status：-1全部/0待付款/1待发货/2已发货/3已完成/4已关闭）
响应：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "pageNum": 1, "pageSize": 5, "totalPage": 1, "total": 1,
    "list": [
      { "id": 78, "orderSn": "202609170100000002", "status": 1, "payType": 1,
        "totalAmount": 2099.00, "orderItemList": [] }
    ]
  }
}
```

### GET /order/detail/{orderId} — 订单详情
请求：`/order/detail/78`
响应：`data` 为订单信息 + `orderItemList`（商品明细）。

### 未登录 / token 失效响应（所有需鉴权接口）
```json
{ "code": 401, "message": "暂未登录或token已经过期", "data": null }
```

---

## 搜索示例（search，8081）

### POST /esProduct/importAll — 全量导入
响应（`data` 为导入条数）：
```json
{ "code": 200, "message": "操作成功", "data": 60 }
```

### GET /esProduct/search — 综合搜索
请求：`/esProduct/search?keyword=手机&brandId=6&pageNum=0&pageSize=5&sort=2`
（sort：0相关度/1新品/2销量/3价格升/4价格降）
响应：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "pageNum": 0, "pageSize": 5, "totalPage": 2, "total": 8,
    "list": [
      { "id": 41, "name": "手机商品名", "brandName": "小米", "price": 2099.00, "sale": 100 }
    ]
  }
}
```

### GET /esProduct/search/relate — 搜索聚合筛选项
请求：`/esProduct/search/relate?keyword=手机`
响应：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "brandNames": ["小米", "华为"],
    "productCategoryNames": ["手机"],
    "productAttrs": [ { "attrId": 1, "attrName": "内存", "attrValues": ["8G","12G"] } ]
  }
}
```

---

## 后台示例（admin，8082）

### POST /admin/login — 管理员登录
请求（json，`UmsAdminLoginParam`）：
```json
{ "username": "admin", "password": "123456" }
```
响应：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": { "tokenHead": "Bearer ", "token": "eyJhbGciOiJIUzUxMiJ9..." }
}
```

### GET /order/list — 后台订单查询（admin）
请求：`/order/list?pageNum=1&pageSize=10&status=1`
响应：分页结构，`list` 为 `OmsOrder` 数组（仅返回 `delete_status=0` 的订单）。

---

## CRUD 类接口通用模式

admin 里大量商品/营销/权限接口遵循统一模式，示例以品牌为例，其余类推（把 `brand` 换成 `coupon`/`product`/`role` 等）：

**新增** `POST /brand/create`（json body）：
```json
{ "name": "小米", "showStatus": 1, "factoryStatus": 1, "sort": 0 }
```
响应：`{ "code": 200, "message": "操作成功", "data": 1 }`（data 为影响行数）

**修改** `POST /brand/update/{id}`：body 同新增，路径带 id。

**分页查询** `GET /brand/list?keyword=&pageNum=1&pageSize=5`：
响应 `data` 为 `CommonPage`（结构见上文统一约定）。

**详情** `GET /brand/{id}`：`data` 为单个实体对象。

**删除** `GET /brand/delete/{id}` 或 `POST /xxx/delete`（body 为 `ids` 数组）：
响应 `{ "code": 200, "message": "操作成功", "data": null }`

**批量改状态** `POST /xxx/update/xxxStatus`（form：`ids=1,2,3&status=1`）：
响应 data 为影响行数。

> 说明：本节示例中的字段值为典型样例，实际字段以对应实体类（mall-mbg 的 model 包）为准。核心链路（登录/下单/支付/搜索）的示例取自项目真实调用结果。
