<template>
  <view class="dashboard">
    <view class="header">
      <text class="title">工作台</text>
      <text class="subtitle">AI 数字运营团队概览</text>
    </view>

    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-num">{{ agents.length }}</text>
        <text class="stat-label">Agent 总数</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ runningCount }}</text>
        <text class="stat-label">运行中</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ idleCount }}</text>
        <text class="stat-label">空闲</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">Agent 状态</text>
      <view class="agent-list">
        <view
          v-for="agent in agents"
          :key="agent.name"
          class="agent-card"
          @click="goDetail(agent.name)"
        >
          <view class="agent-info">
            <text class="agent-name">{{ labelMap[agent.name] || agent.name }}</text>
            <text class="agent-desc">{{ agent.description }}</text>
          </view>
          <view :class="['status-dot', `status-${agent.status}`]" />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">快捷操作</text>
      <view class="quick-actions">
        <view class="action-btn" @click="goTrend">
          <text class="action-text">趋势洞察</text>
        </view>
        <view class="action-btn" @click="goInventory">
          <text class="action-text">库存管理</text>
        </view>
        <view class="action-btn" @click="goData">
          <text class="action-text">数据分析</text>
        </view>
      </view>
      <view class="quick-actions" style="margin-top: 16rpx;">
        <view class="action-btn" @click="goLivestream">
          <text class="action-text">直播助手</text>
        </view>
        <view class="action-btn" @click="goCustomerService">
          <text class="action-text">智能客服</text>
        </view>
        <view class="action-btn" @click="goStyling">
          <text class="action-text">穿搭顾问</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAgentStore } from '@/stores/agent';

const agentStore = useAgentStore();
const agents = computed(() => agentStore.agents);
const runningCount = computed(() => agents.value.filter((a) => a.status === 'running').length);
const idleCount = computed(() => agents.value.filter((a) => a.status === 'idle').length);

const labelMap: Record<string, string> = {
  trend: '趋势洞察',
  product: '智能选品',
  content: '内容创作',
  data: '数据分析',
  livestream: '直播助手',
  customer_service: '客服助手',
  styling: '穿搭顾问',
};

onMounted(() => {
  agentStore.fetchAgents();
});

function goDetail(name: string) {
  uni.navigateTo({ url: `/pages/agent-detail/index?agent=${name}` });
}

function goTrend() {
  uni.navigateTo({ url: '/pages/trend/index' });
}

function goInventory() {
  uni.navigateTo({ url: '/pages/inventory/index' });
}

function goData() {
  uni.navigateTo({ url: '/pages/data/index' });
}

function goLivestream() {
  uni.navigateTo({ url: '/pages/livestream/index' });
}

function goCustomerService() {
  uni.navigateTo({ url: '/pages/customer-service/index' });
}

function goStyling() {
  uni.navigateTo({ url: '/pages/styling/index' });
}
</script>

<style scoped>
.dashboard {
  padding: 24rpx;
}

.header {
  margin-bottom: 32rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}

.stats-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #1890ff;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.section {
  margin-bottom: 32rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.agent-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.agent-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.agent-card:last-child {
  border-bottom: none;
}

.agent-info {
  flex: 1;
}

.agent-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.agent-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.status-idle {
  background: #d9d9d9;
}

.status-running {
  background: #1890ff;
}

.status-error {
  background: #ff4d4f;
}

.quick-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.action-text {
  font-size: 28rpx;
  color: #1890ff;
}
</style>
