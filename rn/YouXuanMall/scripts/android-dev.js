#!/usr/bin/env node

const {spawn, execFileSync} = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
// The CLI is a package binary, not an exported JS module in React Native 0.88.
const rnPackagePath = require.resolve('react-native/package.json');
const cli = path.join(
  path.dirname(rnPackagePath),
  require(rnPackagePath).bin['react-native'],
);
const adb = process.env.ANDROID_HOME
  ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb')
  : 'adb';
let metro;
let android;

function metroStatus(port) {
  return new Promise(resolve => {
    const request = http.get(
      {hostname: '127.0.0.1', port, path: '/status', timeout: 1000},
      response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => (body += chunk));
        response.on('end', () => {
          const projectRoot = response.headers['x-react-native-project-root'];
          const sameProject =
            body.trim() === 'packager-status:running' &&
            typeof projectRoot === 'string' &&
            path.resolve(projectRoot) === root;
          resolve(sameProject ? 'ready' : 'occupied');
        });
      },
    );
    request.on('timeout', () => request.destroy());
    request.on('error', error =>
      resolve(error.code === 'ECONNREFUSED' ? 'free' : 'occupied'),
    );
  });
}

async function choosePort() {
  for (let port = 8081; port <= 8090; port += 1) {
    const status = await metroStatus(port);
    if (status !== 'occupied') {
      return {port, status};
    }
  }
  throw new Error('8081–8090 端口都已占用，无法启动本项目的 Metro。');
}

async function waitForMetro(port) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (await metroStatus(port) === 'ready') {
      return;
    }
    if (metro.exitCode !== null || metro.signalCode !== null) {
      throw new Error('Metro 启动失败，请查看上方日志。');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('等待 Metro 启动超时，请查看上方日志。');
}

function runAndroid(port) {
  return new Promise((resolve, reject) => {
    android = spawn(
      process.execPath,
      [cli, 'run-android', '--no-packager', '--port', String(port), ...process.argv.slice(2)],
      {cwd: root, stdio: 'inherit', env: {...process.env, RCT_METRO_PORT: String(port)}},
    );
    android.once('error', reject);
    android.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Android 安装失败（${signal || `退出码 ${code}`}）。`));
      }
    });
  });
}

function ensureReverse(port) {
  const devices = execFileSync(adb, ['devices'], {encoding: 'utf8'})
    .split(/\r?\n/)
    .slice(1)
    .filter(line => /\sdevice$/.test(line))
    .map(line => line.split(/\s+/)[0]);

  for (const device of devices) {
    const mappings = execFileSync(adb, ['-s', device, 'reverse', '--list'], {
      encoding: 'utf8',
    });
    if (!mappings.split(/\r?\n/).some(line =>
      line.includes(`tcp:${port} tcp:${port}`),
    )) {
      execFileSync(adb, ['-s', device, 'reverse', `tcp:${port}`, `tcp:${port}`], {
        stdio: 'inherit',
      });
      // CLI may have opened the app before the port forwarding was repaired.
      execFileSync(adb, ['-s', device, 'shell', 'am', 'force-stop', 'com.youxuanmall']);
      execFileSync(adb, [
        '-s', device, 'shell', 'am', 'start', '-n',
        'com.youxuanmall/com.youxuanmall.MainActivity',
      ]);
    }
  }
  if (devices.length === 0) {
    throw new Error('没有检测到在线的 Android 设备或模拟器。');
  }
}

async function main() {
  const {port, status} = await choosePort();
  if (status === 'free') {
    console.log(`在当前终端启动 Metro（端口 ${port}）…`);
    metro = spawn(process.execPath, [cli, 'start', '--port', String(port)], {
      cwd: root,
      stdio: 'inherit',
      env: {...process.env, RCT_METRO_PORT: String(port)},
    });
    metro.on('error', error => console.error('Metro 启动失败：', error.message));
    await waitForMetro(port);
  } else {
    console.log(`复用当前项目已运行的 Metro（端口 ${port}）。`);
  }
  console.log(`Metro 已就绪，安装并启动 Android 应用（端口 ${port}）…`);
  await runAndroid(port);
  if (await metroStatus(port) !== 'ready') {
    throw new Error('Metro 在安装过程中退出或失去连接，请查看上方日志。');
  }
  ensureReverse(port);
  console.log('Android 已启动。保存源码后 Metro 会自动刷新。');
  if (!metro) {
    return;
  }
  console.log('保持此终端运行；按 Ctrl+C 停止 Metro。');
  if (metro.exitCode !== null || metro.signalCode !== null) {
    throw new Error('Metro 已退出，请查看上方日志。');
  }
  await new Promise(resolve => metro.once('exit', resolve));
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    android?.kill(signal);
    metro?.kill(signal);
    process.exit(0);
  });
}

main().catch(error => {
  metro?.kill();
  console.error(error.message);
  process.exitCode = 1;
});
