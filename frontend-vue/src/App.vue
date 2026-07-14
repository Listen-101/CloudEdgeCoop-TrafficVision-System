<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import store, { initSystem, stopSystem, refreshAllData } from './store/index.js'

const currentView = ref('overview')

const navItems = [
  { id: 'overview', label: '总览' },
  { id: 'monitor', label: '监控' },
  { id: 'alerts', label: '告警' },
  { id: 'data', label: '数据' },
  { id: 'devices', label: '设备' },
]

// 使用 computed 从 store 获取数据
const metrics = computed(() => [
  { title: '在线设备', value: store.statistics.onlineDevices.toString(), unit: '台' },
  { title: '活动告警', value: store.statistics.activeAlerts.toString(), unit: '条' },
  { title: '今日识别', value: store.statistics.todayRecognitions.toString(), unit: '辆' },
  { title: '平均延迟', value: store.statistics.avgLatency.toString(), unit: 'ms' },
])

const devices = computed(() => store.devices)
const alerts = computed(() => store.alerts)
const recognitionResults = computed(() => store.recognitionResults.slice(0, 10))

// 系统状态
const systemStatus = computed(() => store.systemStatus)
const isOnline = computed(() => store.systemStatus === 'ONLINE')
const isMockMode = computed(() => store.systemStatus === 'MOCK_MODE')
const isOffline = computed(() => store.systemStatus === 'OFFLINE')

// 生命周期
onMounted(async () => {
  console.log('App mounted, initializing system...')
  await initSystem()
})

onUnmounted(() => {
  console.log('App unmounted, stopping system...')
  stopSystem()
})

// 手动刷新
const handleRefresh = () => {
  if (isMockMode.value) {
    console.log('Mock Mode: No refresh needed')
  } else {
    refreshAllData()
  }
}
</script>

<template>
  <div class="honeycomb-bg"></div>

  <div class="app-shell">
    <!-- Logo 区域 -->
    <div class="logo-section">
      <div class="logo-hexagon">
        <svg class="logo-icon" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
          <path d="M12 12v10"/>
          <path d="M2 7l10 5"/>
          <path d="M22 7l-10 5"/>
        </svg>
      </div>
    </div>

    <!-- 顶部控制栏 -->
    <header class="header-control">
      <div>
        <div class="system-title">Traffic Vision System</div>
        <div class="system-subtitle">云边端协同智慧交通视觉感知控制台</div>
      </div>

      <div class="status-panel">
        <div class="status-chip" :class="{ safe: isOnline, active: isMockMode, warn: isOffline }">
          <div class="status-dot"></div>
          <span v-if="isOnline">系统运行</span>
          <span v-else-if="isMockMode">MOCK MODE</span>
          <span v-else>系统离线</span>
        </div>
        <div class="status-chip active" v-if="!isMockMode">
          <div class="status-dot"></div>
          <span>实时模式</span>
        </div>
        <div class="status-chip" v-if="!isMockMode" @click="handleRefresh" style="cursor: pointer;">
          <div class="status-dot"></div>
          <span>刷新数据</span>
        </div>
      </div>
    </header>

    <!-- 侧边导航 -->
    <nav class="nav-sidebar">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-btn"
        :class="{ active: currentView === item.id }"
        @click="currentView = item.id"
        :title="item.label"
      >
        <svg class="nav-icon" viewBox="0 0 24 24">
          <g v-if="item.id === 'overview'">
            <circle cx="12" cy="12" r="8"/>
            <path d="M12 8v4l3 2"/>
          </g>
          <g v-else-if="item.id === 'monitor'">
            <rect x="3" y="4" width="18" height="14" rx="2"/>
            <path d="M8 21h8"/>
            <path d="M12 17v4"/>
          </g>
          <g v-else-if="item.id === 'alerts'">
            <path d="M12 3l8 14H4L12 3z"/>
            <path d="M12 9v4"/>
            <path d="M12 15h.01"/>
          </g>
          <g v-else-if="item.id === 'data'">
            <path d="M4 20h16"/>
            <path d="M6 16v4"/>
            <path d="M10 12v8"/>
            <path d="M14 8v12"/>
            <path d="M18 4v16"/>
          </g>
          <g v-else>
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <rect x="8" y="8" width="8" height="8" rx="1"/>
          </g>
        </svg>
      </button>
    </nav>

    <!-- 主内容区 -->
    <main class="main-stage">
      <!-- 总览页 -->
      <div v-if="currentView === 'overview'" class="content-grid">
        <!-- 指标卡片 -->
        <div class="metric-deck">
          <div v-for="metric in metrics" :key="metric.title" class="metric-card">
            <div class="metric-title">{{ metric.title }}</div>
            <div class="metric-value">
              {{ metric.value }}
              <span class="metric-unit">{{ metric.unit }}</span>
            </div>
          </div>
        </div>

        <!-- 监控墙 -->
        <div class="monitor-wall">
          <div class="monitor-screen" data-hud="CAM-01 / AI VISION / 24FPS / CONF 98.6%">
            <div class="monitor-label">闸机监控 - 实时画面</div>
            <svg viewBox="0 0 800 450" style="width: 100%; height: 100%;">
              <rect fill="#000" width="800" height="450"/>
              <line x1="200" y1="0" x2="200" y2="450" stroke="#A9BDD8" stroke-width="2" opacity="0.2" stroke-dasharray="20 10"/>
              <line x1="400" y1="0" x2="400" y2="450" stroke="#A9BDD8" stroke-width="3" opacity="0.3"/>
              <line x1="600" y1="0" x2="600" y2="450" stroke="#A9BDD8" stroke-width="2" opacity="0.2" stroke-dasharray="20 10"/>
              <rect x="180" y="150" width="80" height="50" rx="8" fill="#1E40AF" opacity="0.8" stroke="#2F80FF" stroke-width="2"/>
              <text x="220" y="180" text-anchor="middle" fill="#2F80FF" font-size="11" font-family="monospace" font-weight="bold">CAR-A</text>
              <rect x="380" y="280" width="80" height="50" rx="8" fill="#1E40AF" opacity="0.8" stroke="#22D3EE" stroke-width="2"/>
              <text x="420" y="310" text-anchor="middle" fill="#22D3EE" font-size="11" font-family="monospace" font-weight="bold">CAR-B</text>
            </svg>
          </div>

          <div class="monitor-screen" data-hud="CAM-02 / FLOW GRID / 23FPS / LOAD 61%">
            <div class="monitor-label">拥堵监测 - 实时画面</div>
            <svg viewBox="0 0 800 450" style="width: 100%; height: 100%;">
              <rect fill="#000" width="800" height="450"/>
              <rect x="50" y="50" width="200" height="350" rx="12" fill="none" stroke="#22C55E" stroke-width="2" opacity="0.6"/>
              <text x="150" y="240" text-anchor="middle" fill="#22C55E" font-size="14" font-family="monospace">畅通</text>
              <rect x="300" y="50" width="200" height="350" rx="12" fill="none" stroke="#F59E0B" stroke-width="2" opacity="0.6"/>
              <text x="400" y="240" text-anchor="middle" fill="#F59E0B" font-size="14" font-family="monospace">缓行</text>
              <rect x="550" y="50" width="200" height="350" rx="12" fill="none" stroke="#EF4444" stroke-width="2" opacity="0.6"/>
              <text x="650" y="240" text-anchor="middle" fill="#EF4444" font-size="14" font-family="monospace">拥堵</text>
            </svg>
          </div>

          <div class="monitor-screen" data-hud="CAM-03 / NO-PARK ZONE / 24FPS / ALERT">
            <div class="monitor-label">禁停监控 - 实时画面</div>
            <svg viewBox="0 0 800 450" style="width: 100%; height: 100%;">
              <rect fill="#000" width="800" height="450"/>
              <rect x="100" y="100" width="600" height="250" rx="16" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="15 10" opacity="0.7"/>
              <text x="400" y="230" text-anchor="middle" fill="#F59E0B" font-size="18" font-family="monospace" font-weight="bold">禁停区域</text>
              <rect x="250" y="180" width="80" height="50" rx="8" fill="#DC2626" opacity="0.7" stroke="#EF4444" stroke-width="2"/>
              <text x="290" y="210" text-anchor="middle" fill="#EF4444" font-size="11" font-family="monospace" font-weight="bold">ALERT</text>
            </svg>
          </div>
        </div>

        <!-- 识别结果表格 -->
        <div class="data-matrix">
          <table class="data-table">
            <thead>
              <tr>
                <th>设备编号</th>
                <th>车牌号码</th>
                <th>车辆类型</th>
                <th>告警类型</th>
                <th>识别时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recognitionResults.length === 0">
                <td colspan="5" style="text-align: center; color: #6F86A8;">暂无识别记录</td>
              </tr>
              <tr v-for="(result, index) in recognitionResults" :key="index">
                <td>{{ result.deviceId || '-' }}</td>
                <td>{{ result.plateNumber || '未识别' }}</td>
                <td>{{ result.vehicleType || '-' }}</td>
                <td>
                  <span v-if="result.alertType" class="badge alert">{{ result.alertType }}</span>
                  <span v-else class="badge online">正常</span>
                </td>
                <td>{{ result.createTime || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 监控中心 -->
      <div v-else-if="currentView === 'monitor'" class="content-grid">
        <div class="monitor-wall">
          <div v-for="i in 6" :key="i" class="monitor-screen monitor-placeholder" :data-hud="`CAM-0${i} / AI VISION / STANDBY`">
            <div class="monitor-label">实时监控 - {{ i }}</div>
          </div>
        </div>
      </div>

      <!-- 告警中心 -->
      <div v-else-if="currentView === 'alerts'" class="content-grid">
        <div class="metric-deck">
          <div class="metric-card">
            <div class="metric-title">今日告警</div>
            <div class="metric-value">{{ store.statistics.activeAlerts + 18 }}<span class="metric-unit">条</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">活动告警</div>
            <div class="metric-value">{{ store.statistics.activeAlerts }}<span class="metric-unit">条</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">已处理</div>
            <div class="metric-value">18<span class="metric-unit">条</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">严重告警</div>
            <div class="metric-value">{{ Math.floor(store.statistics.activeAlerts / 2) }}<span class="metric-unit">条</span></div>
          </div>
        </div>

        <div class="data-matrix">
          <table class="data-table">
            <thead>
              <tr>
                <th>告警类型</th>
                <th>告警场景</th>
                <th>车牌号</th>
                <th>告警级别</th>
                <th>发生时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="alerts.length === 0">
                <td colspan="5" style="text-align: center; color: #6F86A8;">暂无告警记录</td>
              </tr>
              <tr v-for="alert in alerts" :key="alert.time">
                <td>{{ alert.type }}</td>
                <td>{{ alert.scene }}</td>
                <td>{{ alert.plateNumber || '-' }}</td>
                <td><span class="badge" :class="alert.level">{{ alert.level.toUpperCase() }}</span></td>
                <td>{{ alert.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 数据看板 -->
      <div v-else-if="currentView === 'data'" class="content-grid">
        <div class="metric-deck">
          <div class="metric-card">
            <div class="metric-title">今日识别</div>
            <div class="metric-value">{{ store.statistics.todayRecognitions }}<span class="metric-unit">辆</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">识别次数</div>
            <div class="metric-value">{{ store.statistics.todayRecognitions + 36 }}<span class="metric-unit">次</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">禁停告警</div>
            <div class="metric-value">{{ Math.floor(store.statistics.activeAlerts * 0.4) }}<span class="metric-unit">条</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">道路异常</div>
            <div class="metric-value">{{ Math.floor(store.statistics.activeAlerts * 0.3) }}<span class="metric-unit">起</span></div>
          </div>
        </div>

        <div class="monitor-screen chart-panel" style="width: 100%; max-width: 100%;" data-hud="TREND / STATIC MOCK / 10 SAMPLES">
          <div class="monitor-label">全天识别趋势</div>
          <svg class="trend-svg" viewBox="0 0 1000 420" style="width: 100%; height: 100%;">
            <defs>
              <linearGradient id="trendLineFinal" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stop-color="#2F80FF"/>
                <stop offset="52%" stop-color="#22D3EE"/>
                <stop offset="100%" stop-color="#7DD3FC"/>
              </linearGradient>
              <linearGradient id="trendAreaFinal" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.20"/>
                <stop offset="100%" stop-color="#2F80FF" stop-opacity="0.015"/>
              </linearGradient>
              <linearGradient id="trendBarFinal" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#7DD3FC" stop-opacity="0.68"/>
                <stop offset="100%" stop-color="#2F80FF" stop-opacity="0.12"/>
              </linearGradient>
            </defs>
            <rect fill="#02070d" width="1000" height="420"/>
            <g class="chart-grid">
              <line x1="100" y1="82" x2="920" y2="82"/>
              <line x1="100" y1="142" x2="920" y2="142"/>
              <line x1="100" y1="202" x2="920" y2="202"/>
              <line x1="100" y1="262" x2="920" y2="262"/>
              <line x1="100" y1="322" x2="920" y2="322"/>
              <line x1="100" y1="82" x2="100" y2="322"/>
              <line x1="300" y1="82" x2="300" y2="322"/>
              <line x1="500" y1="82" x2="500" y2="322"/>
              <line x1="700" y1="82" x2="700" y2="322"/>
              <line x1="900" y1="82" x2="900" y2="322"/>
            </g>
            <g class="trend-bars">
              <rect x="124" y="278" width="24" height="44" rx="5"/>
              <rect x="224" y="260" width="24" height="62" rx="5"/>
              <rect x="324" y="244" width="24" height="78" rx="5"/>
              <rect x="424" y="216" width="24" height="106" rx="5"/>
              <rect x="524" y="194" width="24" height="128" rx="5"/>
              <rect x="624" y="208" width="24" height="114" rx="5"/>
              <rect x="724" y="168" width="24" height="154" rx="5"/>
              <rect x="824" y="184" width="24" height="138" rx="5"/>
            </g>
            <polygon
              points="100,292 200,274 300,252 400,222 500,236 600,186 700,202 800,158 900,174 920,132 920,322 100,322"
              fill="url(#trendAreaFinal)"
            />
            <polyline
              points="100,292 200,274 300,252 400,222 500,236 600,186 700,202 800,158 900,174 920,132"
              fill="none"
              stroke="url(#trendLineFinal)"
              stroke-width="3"
            />
            <g class="trend-points">
              <circle cx="100" cy="292" r="4.5"/>
              <circle cx="200" cy="274" r="4.5"/>
              <circle cx="300" cy="252" r="4.5"/>
              <circle cx="400" cy="222" r="4.5"/>
              <circle cx="500" cy="236" r="4.5"/>
              <circle cx="600" cy="186" r="4.5"/>
              <circle cx="700" cy="202" r="4.5"/>
              <circle cx="800" cy="158" r="4.5"/>
              <circle cx="900" cy="174" r="4.5"/>
              <circle cx="920" cy="132" r="4.5"/>
            </g>
            <g class="chart-axis-labels">
              <text x="82" y="86" text-anchor="end">240</text>
              <text x="82" y="146" text-anchor="end">180</text>
              <text x="82" y="206" text-anchor="end">120</text>
              <text x="82" y="266" text-anchor="end">60</text>
              <text x="100" y="358" text-anchor="middle">08:00</text>
              <text x="400" y="358" text-anchor="middle">12:00</text>
              <text x="700" y="358" text-anchor="middle">16:00</text>
              <text x="920" y="358" text-anchor="middle">20:00</text>
            </g>
            <text class="chart-caption" x="100" y="56">RECOGNITION VOLUME / MOCK STATIC</text>
          </svg>
        </div>
      </div>

      <!-- 设备管理 -->
      <div v-else class="content-grid">
        <div class="metric-deck">
          <div class="metric-card">
            <div class="metric-title">在线设备</div>
            <div class="metric-value">{{ store.statistics.onlineDevices }}<span class="metric-unit">台</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">采集中</div>
            <div class="metric-value">{{ Math.floor(store.statistics.onlineDevices * 0.8) }}<span class="metric-unit">台</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">平均帧率</div>
            <div class="metric-value">{{ store.statistics.onlineDevices > 0 ? 24 : 0 }}<span class="metric-unit">FPS</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">平均延迟</div>
            <div class="metric-value">{{ store.statistics.avgLatency }}<span class="metric-unit">ms</span></div>
          </div>
        </div>

        <div class="data-matrix">
          <table class="data-table">
            <thead>
              <tr>
                <th>设备编号</th>
                <th>在线状态</th>
                <th>设备名称</th>
                <th>最后心跳</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="devices.length === 0">
                <td colspan="4" style="text-align: center; color: #6F86A8;">暂无设备数据</td>
              </tr>
              <tr v-for="device in devices" :key="device.id">
                <td>{{ device.deviceId }}</td>
                <td><span class="badge" :class="device.status === 'ONLINE' ? 'online' : 'offline'">{{ device.status }}</span></td>
                <td>{{ device.name || '-' }}</td>
                <td>{{ device.lastHeartbeat || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>
