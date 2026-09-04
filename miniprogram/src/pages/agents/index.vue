<template>
  <view class="agents-page">
    <view class="agent-grid">
      <view
        v-for="agent in agents"
        :key="agent.name"
        class="agent-card"
        @click="goDetail(agent.name)"
      >
        <view :class="['status-badge', `status-${agent.status}`]">
          {{ statusText(agent.status) }}
        </view>
        <text class="agent-name">{{ labelMap[agent.name] || agent.name }}</text>
        <text class="agent-desc">{{ agent.description }}</text>
        <text class="agent-version">v{{ agent.version }}</text>
      </view>
    </view>

    <view v-if="agentStore.loading" class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAgentStore } from '@/stores/agent';

const agentStore = useAgentStore();
const agents = computed(() => agentStore.agents);

const labelMap: Record<string, string> = {
  trend: '趋势洞察',
  product: '智能选品',
  content: '内容创作',
  data: '数据分析',
  livestream: '直播助手',
  customer_service: '客服助手',
};

function statusText(status: string) {
  const map: Record<string, string> = { idle: '空闲', running: '运行中', error: '异常' };
  return map[status] || status;
}

function goDetail(name: string) {
  uni.navigateTo({ url: `/pages/agent-detail/index?agent=${name}` });
}

onMounted(() => {
  agentStore.fetchAgents();
});
</script>

<style scoped>
.agents-page {
  padding: 24rpx;
}

.agent-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.agent-card {
  width: calc(50% - 8rpx);
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  position: relative;
}

.status-badge {
  display: inline-block;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.status-idle {
  background: #f0f0f0;
  color: #999;
}

.status-running {
  background: #e6f7ff;
  color: #1890ff;
}

.status-error {
  background: #fff2f0;
  color: #ff4d4f;
}

.agent-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.agent-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.agent-version {
  display: block;
  font-size: 22rpx;
  color: #bbb;
  margin-top: 12rpx;
}

.loading {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
</style>
