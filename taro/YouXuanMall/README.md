# 优选商城 · Taro 版

基于 Taro 4、React、TypeScript 的商城应用，参考 `../../rn/YouXuanMall`，支持构建 H5 和微信小程序。

## 本地运行

需要 Node.js 18+。在本目录执行：

```sh
npm install
npm run dev:h5          # H5 开发与热更新，查看终端提示的地址
npm run dev:weapp       # 微信开发者工具导入本目录，编译输出在 dist/
npm run typecheck
npm run build:h5
npm run build:weapp
```

微信开发者工具中用自己的 AppID 替换 `project.config.json` 的 `touristappid`；调试和发布需要真实 AppID 与相应权限。两个平台共用 `dist/`，切换构建目标时请重新构建。

## 功能

- 首页推荐、分类、关键词搜索、销量及价格排序、分页加载；商品详情、规格/库存选择。
- 会员注册/登录、登录态本机存储、购物车、地址管理、订单确认与创建、订单列表/详情、取消订单与确认收货。加入购物车有结果提示。创建订单不会自动支付，当前未接入支付渠道。
- 个人中心的游戏中心：投骰子（1–20 颗）、幸运大转盘（自定义 2–10 个选项及各项概率，默认 5 个平均分的家务示例）、翻牌配对（4–20 张）、反应力挑战、真心话大冒险（随机无重复抽题与自定义题目）、猜拳淘汰赛（2–16 人、轮空/平局处理）、猜数字（自定义范围与历史记录）。
- 日历待办在当前设备存储。快捷添加提醒在微信小程序使用系统日历接口，在 H5 下载含提醒的 `.ics` 文件，需在系统日历中导入；两者都不能直接创建时钟 App 的闹钟。

## 线上接口配置

默认连接 RN 使用的 `http://m.starchase.xyz/api`，商品图片相对路径通过同一站点的 `/mall-files/` 访问。可以在构建前设置 `TARO_APP_API_ORIGIN`（**只填站点根地址，不加 `/api`**），例如：

```sh
TARO_APP_API_ORIGIN=https://your-mall.example.com npm run build:weapp
```

**微信小程序发布前必须先配置可用的 HTTPS API/图片代理域名**：现有 `m.starchase.xyz` 的 HTTPS 服务目前无法连接，仅 HTTP 站点不能作为正式小程序 request 合法域名。将 API 和 `/mall-files/` 暴露在可用 HTTPS 站点后，设置上面的环境变量，在微信小程序后台配置该站点为 `request` 合法域名，并把页面使用的商品图片域名配置为图片下载/合法访问域名（如果商品图片还包含第三方 CDN，也需配置相应域名）。本地 H5 访问 HTTP 服务时还要满足服务端跨域策略；部署在 HTTPS 页面时，API 也必须使用 HTTPS，避免浏览器拦截混合内容。客户端代码无法代替域名和服务器配置。

小程序真机网络、图片以及系统日历权限仍需在接好 HTTPS 域名并配置真实 AppID 后验证。
