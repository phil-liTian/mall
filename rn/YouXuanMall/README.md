# YouXuanMall

优选商城 React Native 客户端（React Native 0.88 + React 19 + TypeScript），参考 `../../h5` 实现商城核心流程。

首页推荐、分类、搜索与排序、商品详情与规格、会员登录注册、购物车、收货地址、确认订单、订单列表与详情、取消订单及确认收货均通过 `mall-portal` 的真实接口获取数据。商品价格和订单金额以服务端核算为准。当前尚未接入支付渠道；创建的订单保持待付款状态，不会模拟支付成功。

接口地址在 `src/config.ts`：Android、iOS 模拟器和真机统一请求线上 H5 站点 `http://m.starchase.xyz/api`，由站点代理到商城后端，无需启动本机 `mall-portal`。线上服务需可访问；此地址依据仓库根目录 README 和 H5 的生产 Nginx 配置，当前环境未能联网验证服务状态。Android/iOS 已为站点及仓库现有商品图片域名配置 HTTP 访问权限。会员登录状态保存在应用内存中，完全关闭应用后需要重新登录。

服务端 MinIO 图片使用管理站点的 `mall.starchase.xyz/mall-files` 地址，客户端显示时改走 H5 的 `m.starchase.xyz/mall-files` 文件代理；已知 OSS / 京东图片地址优先使用 HTTPS。修改图片处理代码后，需要重新构建并安装 APK，已安装的 Release 包不会自动更新。

## 环境要求

- Node.js >= 22.11.0
- JDK 17
- Android SDK（本机已通过 Homebrew 安装，详见下文「本机 Android SDK 环境」）
- iOS（仅 macOS）：Xcode、CocoaPods

官方环境配置参考：https://reactnative.dev/docs/set-up-your-environment

## 安装依赖

```bash
npm install
```

## 启动步骤

Android 模拟器已经启动时，可以在本目录直接运行 `npm run android`：脚本会在当前终端启动 Metro、等待就绪，再安装 Debug 应用和配置端口转发。如果 8081 被其他项目占用，会自动使用 8082–8090 中的空闲端口。安装完成后保持此终端运行，修改 JS/TS/样式后会自动刷新；原生代码变更需要重新执行 `npm run android`。

如果此前安装过内置旧 JS 的 Debug 包，修改了 Android 构建配置后，先在本目录执行一次 `cd android && ./gradlew clean`，再返回本目录运行 `npm run android`。此后编辑源码只需保存文件，不需要重新打包。

### 1. 启动 Metro 打包服务（可选）

`npm run android` 会自动启动 Metro。如果希望单独启动，可在项目根目录新开一个终端，保持运行：

```bash
npm start
```

### 2. 启动 Android 模拟器（或连接真机）

本机已创建名为 `Pixel_API37` 的虚拟设备。新开终端后直接执行：

```bash
emulator -avd Pixel_API37
```

如果终端提示 `command not found: emulator`，先执行 `source ~/.zshrc` 让 PATH 生效，或使用完整路径启动：

```bash
/opt/homebrew/share/android-commandlinetools/emulator/emulator -avd Pixel_API37
```

其他常用模拟器命令：

```bash
emulator -list-avds          # 查看本机已创建的所有虚拟设备
adb devices                  # 查看当前已连接的模拟器 / 真机（出现 device 状态才算就绪）
```

可选启动参数：

```bash
# 每次冷启动，不加载快照，可规避部分快照异常
emulator -avd Pixel_API37 -no-snapshot
# 使用软件渲染，画面更稳定、更省 GPU（性能略低）
emulator -avd Pixel_API37 -gpu swiftshader_indirect
```

> 模拟器窗口需保持打开，关闭窗口即等于关闭设备，`npm run android` 会报 `No connected devices!`。
> 也可以跳过手动启动，直接执行 `npm run android`，React Native CLI 会自动拉起可用模拟器。
> 使用真机则需开启「USB 调试」并用数据线连接，通过 `adb devices` 确认设备已连接。

### 3. 运行到设备 / 模拟器

#### Android

```bash
npm run android
```

#### iOS（仅 macOS）

首次运行需要先安装 iOS 原生依赖（CocoaPods）：

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

然后执行：

```bash
npm run ios
```

也可以用 Xcode 打开 `ios/YouXuanMall.xcodeproj`，点击 Run 按钮运行。

应用启动后进入商城首页。底部可切换首页、分类、购物车和我的；点击商品可以选规格加入购物车，再登录、选择收货地址并提交订单。首页与搜索的数据由线上商城接口提供，如果看到连接失败，请检查设备网络和线上站点状态。

## 打包 Android APK

### Debug 包（调试用，体积大、带调试信息）

Debug 包从 Metro 加载 JS 脚本，需保持 `npm run android` 或单独启动的 `npm start` 运行。修改 JS/TS/样式会通过 Fast Refresh 更新页面。如果需要脱离 Metro 独立运行，请构建下方的 Release APK。

```bash
# 方式一：npm 脚本
npm run build:apk:debug
# 方式二：直接调用 Gradle
cd android && ./gradlew :app:assembleDebug
```

产物路径：`android/app/build/outputs/apk/debug/app-debug.apk`

### Release 包（独立运行，已内嵌 JS Bundle，不依赖 Metro）

方式一，用 npm 脚本（推荐，在项目根目录执行）：

```bash
npm run build:apk
```

方式二，直接调用 Gradle：

```bash
cd android
./gradlew :app:assembleRelease
```

产物路径：`android/app/build/outputs/apk/release/app-release.apk`

> Release 构建会用 Hermes 把 JS 编译成字节码并打进 APK，因此安装后无需启动 `npm start` 即可独立运行。首次构建较慢。

### 重要：当前签名说明

RN 模板默认让 `release` 复用 `android/app/debug.keystore`（见 `android/app/build.gradle` 的 `signingConfigs`），所以打出来的 Release 包：

- 可以直接安装到手机做测试、内部分发；
- 证书主体是 `CN=Android Debug`，**不能上架应用市场**（Google Play / 各安卓商店都要求正式签名）。

要发布到应用市场，需生成自己的正式 keystore 并配置签名：

```bash
# 1. 生成正式签名（妥善保管，不要提交到 git）
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/release.keystore \
  -alias my-release-alias -keyalg RSA -keysize 2048 -validity 10000
```

然后在 `android/gradle.properties` 中配置（不要把密码硬编码进仓库，建议用环境变量或本地不提交的文件）：

```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=my-release-alias
MYAPP_RELEASE_STORE_PASSWORD=******
MYAPP_RELEASE_KEY_PASSWORD=******
```

并把 `android/app/build.gradle` 的 `release` 签名改为读取这些配置（参考官方文档 https://reactnative.dev/docs/signed-apk-android ）。

### 安装到设备 / 查看产物

```bash
# 查看已连接设备
adb devices
# 安装指定 APK
adb install android/app/build/outputs/apk/release/app-release.apk
# 验证签名
/opt/homebrew/share/android-commandlinetools/build-tools/37.0.0/apksigner verify --verbose android/app/build/outputs/apk/release/app-release.apk
```

> 如需上架 Google Play 的 AAB 格式，用 `./gradlew :app:bundleRelease`，产物在 `android/app/build/outputs/bundle/release/`。

## 本机 Android SDK 环境

Android SDK 通过 Homebrew 的 `android-commandlinetools` 安装，根目录为：

```
/opt/homebrew/share/android-commandlinetools
```

已安装的组件：

| 组件 | 版本 |
| --- | --- |
| Platform-Tools（adb） | 37.0.1 |
| Android Platform | android-37.0 |
| Build-Tools | 37.0.0 |
| NDK | 27.1.12297006 |
| Emulator | 最新版 |
| 系统镜像 | android-37.0 google_apis arm64-v8a |

相关配置：

- 环境变量 `ANDROID_HOME` / `ANDROID_SDK_ROOT` 已写入 `~/.zshrc`，并把 `platform-tools`、`emulator` 加入 `PATH`。修改后需执行 `source ~/.zshrc` 或新开终端生效。
- `android/local.properties` 中通过 `sdk.dir` 指定了 SDK 路径（该文件已在 `.gitignore` 中，不会提交）。
- 已创建虚拟设备 `Pixel_API37`。
- 已在 `/opt/homebrew/bin`（默认 PATH 内）建立 `adb`、`emulator`、`sdkmanager`、`avdmanager` 的软链，指向上述 SDK 目录。因此无论终端是何时打开的、是否加载过 `.zshrc`，都能直接调用这些命令，不依赖会话的 PATH 时机。

如果在新机器上重新搭建，可用以下命令安装：

```bash
# 1. 安装命令行工具
brew install --cask android-commandlinetools

# 2. 安装 SDK 组件（把 $ANDROID_HOME 替换为实际 SDK 根目录）
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
yes | sdkmanager --sdk_root=$ANDROID_HOME --licenses
sdkmanager --sdk_root=$ANDROID_HOME \
  "platform-tools" "platforms;android-37.0" \
  "build-tools;37.0.0" "ndk;27.1.12297006" \
  "emulator" "system-images;android-37.0;google_apis;arm64-v8a"

# 3. 创建虚拟设备
echo no | avdmanager create avd -n Pixel_API37 \
  -k "system-images;android-37.0;google_apis;arm64-v8a" -d pixel
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm start` | 启动 Metro 打包服务 |
| `npm run android` | 构建并运行 Android 版本 |
| `npm run ios` | 构建并运行 iOS 版本 |
| `npm test` | 运行 Jest 单元测试 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `adb devices` | 查看已连接的 Android 设备/模拟器 |
| `emulator -avd Pixel_API37` | 启动 Android 模拟器 |
| `npm run build:apk` | 打包 Release APK（输出到 android/app/build/outputs/apk/release/） |
| `npm run build:apk:debug` | 打包 Debug APK（输出到 android/app/build/outputs/apk/debug/） |

## 目录结构

```
YouXuanMall/
├── App.tsx            # 页面导航、登录状态与底部导航
├── src/
│   ├── api.ts         # mall-portal 接口与请求封装
│   ├── config.ts      # 线上接口和图片代理地址
│   ├── media.ts       # 图片 URL 适配
│   ├── catalog.tsx    # 首页、分类、搜索与商品详情
│   ├── commerce.tsx   # 购物车、地址、结算与订单
│   ├── account.tsx    # 会员登录、注册与个人中心
│   ├── session.ts     # 登录及导航上下文
│   ├── types.ts       # 商品与订单等数据类型
│   └── ui.tsx         # 通用页面组件
├── index.js           # 注册根组件
├── android/           # Android 原生工程
├── ios/               # iOS 原生工程
├── __tests__/         # Jest 测试
└── package.json       # 依赖与脚本
```

## 常见问题

- 模拟器出现红屏 `Unable to load script`：从 `rn/YouXuanMall` 目录重新运行 `npm run android` 并保持终端开启；脚本会等待 Metro 就绪、使用正确的端口并检查设备的端口转发。手动运行 Metro 时，使用 `adb reverse tcp:8081 tcp:8081` 配置端口转发。
- 新终端提示找不到 `adb` / `emulator`：执行 `source ~/.zshrc`，或确认 `ANDROID_HOME` 环境变量已配置。
- Gradle 报 `SDK location not found`：确认 `android/local.properties` 中 `sdk.dir` 指向正确的 SDK 目录。
- Metro 报错或修改后不生效：确认模拟器打开的是 Debug 应用、Metro 运行在本项目目录并已开启开发菜单中的 Fast Refresh；按 `r` 重新加载，必要时执行 `npx react-native start --reset-cache` 清缓存重启。
- Android 构建失败：确认使用 JDK 17（`java -version`），且 `ANDROID_HOME` 配置正确。
- iOS 首次 `pod install` 较慢，建议保持网络畅通并耐心等待。
- 构建成功但启动报 `spawnSync adb ENOENT` / `Failed to start the app`：当前终端的 PATH 里没有 `adb`，常见于在配置 `.zshrc` 之前就已打开的旧终端。本机已用软链把 `adb` 放进 `/opt/homebrew/bin`，直接重跑即可；若仍提示找不到，执行 `hash -r` 刷新 shell 命令缓存或新开一个终端。
- `npm run android` 报 `No connected devices!`：说明没有可用设备，先用 `emulator -avd Pixel_API37` 启动模拟器，或连接真机，再用 `adb devices` 确认出现 `device` 状态后重新运行。注意构建（assembleDebug）成功但安装（installDebug）失败时，问题同样出在设备未连接，而非代码。
- Radon IDE 面板显示 `No devices found`：从 Dock / 访达启动的 VS Code 读不到 `ANDROID_HOME`（`.zshrc` 只对终端生效）。本机已通过 `launchctl setenv` 注入 GUI 环境并用 LaunchAgent 持久化，彻底退出（`Cmd + Q`）再重开 VS Code 即可识别模拟器。
