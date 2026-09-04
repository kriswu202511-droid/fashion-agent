<template>
  <view class="detail-page">
    <view class="agent-header">
      <text class="agent-name">{{ labelMap[agentName] || agentName }}</text>
      <text class="agent-desc">{{ agentInfo?.description || '' }}</text>
    </view>

    <view class="form-section">
      <text class="section-title">运行参数</text>

      <view v-if="agentName === 'trend'" class="form">
        <view class="input-group">
          <text class="label">品类</text>
          <input class="input" v-model="form.category" placeholder="如：女装" />
        </view>
        <view class="input-group">
          <text class="label">平台</text>
          <picker :range="platforms" @change="onPlatformChange">
            <view class="picker">{{ form.platform || '选择平台' }}</view>
          </picker>
        </view>
      </view>

      <view v-else-if="agentName === 'content'" class="form">
        <view class="input-group">
          <text class="label">商品名称</text>
          <input class="input" v-model="form.product_name" placeholder="如：碎花连衣裙" />
        </view>
        <view class="input-group">
          <text class="label">核心卖点</text>
          <textarea class="textarea" v-model="form.selling_points" placeholder="如：显瘦、透气" />
        </view>
        <view class="input-group">
          <text class="label">内容类型</text>
          <picker :range="contentTypes" @change="onContentTypeChange">
            <view class="picker">{{ form.content_type || '选择类型' }}</view>
          </picker>
        </view>
      </view>

      <view v-else class="form">
        <view class="input-group">
          <text class="label">输入参数</text>
          <textarea class="textarea" v-model="form.raw_input" placeholder="JSON 格式输入" />
        </view>
      </view>

      <button class="btn-run" :loading="running" @click="handleRun">
        运行 Agent
      </button>
    </view>

    <view v-if="result" class="result-section">
      <text class="section-title">运行结果</text>
      <view class="result-card">
        <text class="result-text">{{ formatResult(result) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAgentStore } from '@/stores/agent';

const agentStore = useAgentStore();
const agentName = ref('');
const running = ref(false);
const form = ref<Record<string, string>>({});
const result = ref<Record<string, unknown> | null>(null);

const labelMap: Record<string, string> = {
  trend: '趋势洞察',
  product: '智能选品',
  content: '内容创作',
  data: '数据分析',
  livestream: '直播助手',
  customer_service: '客服助手',
};

const platforms = ['抖音', '小红书', '快手', '淘宝'];
const contentTypes = ['short_video', 'livestream', 'copywriting'];

const agentInfo = computed(() => agentStore.agents.find((a) => a.name === agentName.value));

onMounted(() => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  agentName.value = (page.options as Record<string, string>).agent || '';
  agentStore.fetchAgents();
});

function onPlatformChange(e: { detail: { value: number } }) {
  form.value.platform = platforms[e.detail.value];
}

function onContentTypeChange(e: { detail: { value: number } }) {
  form.value.content_type = contentTypes[e.detail.value];
}

async function handleRun() {
  running.value = true;
  try {
    let input: Record<string, unknown> = {};
    if (agentName.value === 'content' || agentName.value === 'trend') {
      input = { ...form.value };
    } else if (form.value.raw_input) {
      input = JSON.parse(form.value.raw_input);
    }
    const res = await agentStore.runAgent(agentName.value, input);
    result.value = res.output_data;
    uni.showToast({ title: '运行完成', icon: 'success' });
  } catch {
    uni.showToast({ title: '运行失败', icon: 'none' });
  } finally {
    running.value = false;
  }
}

function formatResult(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, null, 2);
}
</script>

<style scoped>
.detail-page {
  padding: 24rpx;
}

.agent-header {
  margin-bottom: 32rpx;
}

.agent-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.agent-desc {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-top: 8rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.form-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.form {
  margin-bottom: 24rpx;
}

.input-group {
  margin-bottom: 24rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.input {
  height: 80rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.textarea {
  width: 100%;
  height: 160rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker {
  height: 80rpx;
  line-height: 80rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #666;
}

.btn-run {
  width: 100%;
  height: 88rpx;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
}

.result-section {
  margin-top: 24rpx;
}

.result-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.result-text {
  font-size: 26rpx;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
