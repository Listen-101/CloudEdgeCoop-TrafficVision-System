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
const currentFrameHeatmap = computed(() => store.currentFrameHeatmap)
const heatmapVehicles = computed(() => store.currentFrameHeatmap?.vehicles || [])
const heatmapStatusClass = computed(() => {
  const level = store.currentFrameHeatmap?.densityLevel
  if (level === '拥堵') return 'danger'
  if (level === '缓行') return 'warn'
  return 'safe'
})

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
        <div class="monitor-wall heatmap-only">
          <div
            class="monitor-screen heatmap-screen"
            :data-hud="`CAM-02 / FRAME ${currentFrameHeatmap.frameId || '--'} / VEH ${heatmapVehicles.length} / SCORE ${currentFrameHeatmap.densityScore || 0}`"
          >
            <div class="monitor-label">拥堵监测 - 当前帧热力图</div>
            <div class="heatmap-readout" :class="heatmapStatusClass">
              <span>{{ currentFrameHeatmap.densityLevel || '无数据' }}</span>
              <strong>{{ currentFrameHeatmap.densityScore || 0 }}</strong>
            </div>
            <svg viewBox="0 0 800 450" class="heatmap-svg">
              <defs>
                <radialGradient id="heatLow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#22C55E" stop-opacity="0.72"/>
                  <stop offset="45%" stop-color="#22C55E" stop-opacity="0.28"/>
                  <stop offset="100%" stop-color="#22C55E" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="heatMid" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.82"/>
                  <stop offset="48%" stop-color="#F59E0B" stop-opacity="0.34"/>
                  <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="heatHot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#EF4444" stop-opacity="0.90"/>
                  <stop offset="42%" stop-color="#F97316" stop-opacity="0.46"/>
                  <stop offset="100%" stop-color="#EF4444" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="heatRoad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stop-color="#06111f"/>
                  <stop offset="100%" stop-color="#010409"/>
                </linearGradient>
              </defs>
              <rect fill="url(#heatRoad)" width="800" height="450"/>
              <g class="heatmap-road-grid">
                <path d="M120 450 L330 0"/>
                <path d="M680 450 L470 0"/>
                <path d="M285 450 L385 0"/>
                <path d="M515 450 L415 0"/>
                <line x1="400" y1="0" x2="400" y2="450"/>
                <line x1="0" y1="340" x2="800" y2="340"/>
                <line x1="0" y1="240" x2="800" y2="240"/>
                <line x1="0" y1="140" x2="800" y2="140"/>
              </g>
              <g class="heat-zones">
                <circle
                  v-for="vehicle in heatmapVehicles"
                  :key="`heat-${vehicle.id}`"
                  :cx="vehicle.cx"
                  :cy="vehicle.cy"
                  :r="vehicle.radius"
                  :fill="vehicle.intensity > 0.68 ? 'url(#heatHot)' : vehicle.intensity > 0.52 ? 'url(#heatMid)' : 'url(#heatLow)'"
                  :opacity="vehicle.intensity"
                />
              </g>
              <g class="vehicle-boxes">
                <g v-for="vehicle in heatmapVehicles" :key="`box-${vehicle.id}`">
                  <rect
                    :x="vehicle.x"
                    :y="vehicle.y"
                    :width="vehicle.w"
                    :height="vehicle.h"
                    rx="7"
                  />
                  <text :x="vehicle.cx" :y="Math.max(vehicle.y - 8, 24)" text-anchor="middle">
                    {{ vehicle.plateNumber || vehicle.vehicleType }}
                  </text>
                </g>
              </g>
              <text v-if="heatmapVehicles.length === 0" x="400" y="232" text-anchor="middle" class="heatmap-empty">
                当前帧暂无车辆坐标
              </text>
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
      <div v-else-if="currentView === 'monitor'" class="content-grid monitor-stack">
        <div
          class="monitor-screen frame-screen"
          :data-hud="`CAM-02 / FRAME ${currentFrameHeatmap.frameId || '--'} / RAW VIEW / VEH ${heatmapVehicles.length}`"
        >
          <div class="monitor-label">实时监控 - 当前帧正常画面</div>
          <svg viewBox="0 0 800 450" class="heatmap-svg">
            <defs>
              <linearGradient id="rawRoad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#07111f"/>
                <stop offset="100%" stop-color="#02070d"/>
              </linearGradient>
            </defs>
            <rect fill="url(#rawRoad)" width="800" height="450"/>
            <g class="heatmap-road-grid raw-grid">
              <path d="M120 450 L330 0"/>
              <path d="M680 450 L470 0"/>
              <path d="M285 450 L385 0"/>
              <path d="M515 450 L415 0"/>
              <line x1="400" y1="0" x2="400" y2="450"/>
              <line x1="0" y1="340" x2="800" y2="340"/>
              <line x1="0" y1="240" x2="800" y2="240"/>
              <line x1="0" y1="140" x2="800" y2="140"/>
            </g>
            <g class="raw-vehicles">
              <g v-for="vehicle in heatmapVehicles" :key="`raw-${vehicle.id}`">
                <rect
                  :x="vehicle.x"
                  :y="vehicle.y"
                  :width="vehicle.w"
                  :height="vehicle.h"
                  rx="7"
                />
                <text :x="vehicle.cx" :y="Math.max(vehicle.y - 8, 24)" text-anchor="middle">
                  {{ vehicle.plateNumber || vehicle.vehicleType }}
                </text>
              </g>
            </g>
            <text v-if="heatmapVehicles.length === 0" x="400" y="232" text-anchor="middle" class="heatmap-empty">
              当前帧暂无车辆坐标
            </text>
          </svg>
        </div>

        <div
          class="monitor-screen heatmap-screen"
          :data-hud="`CAM-02 / FRAME ${currentFrameHeatmap.frameId || '--'} / HEATMAP / SCORE ${currentFrameHeatmap.densityScore || 0}`"
        >
          <div class="monitor-label">实时监控 - 当前帧拥堵热力图</div>
          <div class="heatmap-readout" :class="heatmapStatusClass">
            <span>{{ currentFrameHeatmap.densityLevel || '无数据' }}</span>
            <strong>{{ currentFrameHeatmap.densityScore || 0 }}</strong>
          </div>
          <svg viewBox="0 0 800 450" class="heatmap-svg">
            <defs>
              <radialGradient id="monitorHeatLow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#22C55E" stop-opacity="0.72"/>
                <stop offset="45%" stop-color="#22C55E" stop-opacity="0.28"/>
                <stop offset="100%" stop-color="#22C55E" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="monitorHeatMid" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.82"/>
                <stop offset="48%" stop-color="#F59E0B" stop-opacity="0.34"/>
                <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="monitorHeatHot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#EF4444" stop-opacity="0.90"/>
                <stop offset="42%" stop-color="#F97316" stop-opacity="0.46"/>
                <stop offset="100%" stop-color="#EF4444" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="monitorHeatRoad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#06111f"/>
                <stop offset="100%" stop-color="#010409"/>
              </linearGradient>
            </defs>
            <rect fill="url(#monitorHeatRoad)" width="800" height="450"/>
            <g class="heatmap-road-grid">
              <path d="M120 450 L330 0"/>
              <path d="M680 450 L470 0"/>
              <path d="M285 450 L385 0"/>
              <path d="M515 450 L415 0"/>
              <line x1="400" y1="0" x2="400" y2="450"/>
              <line x1="0" y1="340" x2="800" y2="340"/>
              <line x1="0" y1="240" x2="800" y2="240"/>
              <line x1="0" y1="140" x2="800" y2="140"/>
            </g>
            <g class="heat-zones">
              <circle
                v-for="vehicle in heatmapVehicles"
                :key="`monitor-heat-${vehicle.id}`"
                :cx="vehicle.cx"
                :cy="vehicle.cy"
                :r="vehicle.radius"
                :fill="vehicle.intensity > 0.68 ? 'url(#monitorHeatHot)' : vehicle.intensity > 0.52 ? 'url(#monitorHeatMid)' : 'url(#monitorHeatLow)'"
                :opacity="vehicle.intensity"
              />
            </g>
            <g class="vehicle-boxes">
              <g v-for="vehicle in heatmapVehicles" :key="`monitor-box-${vehicle.id}`">
                <rect
                  :x="vehicle.x"
                  :y="vehicle.y"
                  :width="vehicle.w"
                  :height="vehicle.h"
                  rx="7"
                />
                <text :x="vehicle.cx" :y="Math.max(vehicle.y - 8, 24)" text-anchor="middle">
                  {{ vehicle.plateNumber || vehicle.vehicleType }}
                </text>
              </g>
            </g>
            <text v-if="heatmapVehicles.length === 0" x="400" y="232" text-anchor="middle" class="heatmap-empty">
              当前帧暂无车辆坐标
            </text>
          </svg>
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
