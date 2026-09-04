<template>
  <view class="trend-page">
    <view class="form-section">
      <text class="section-title">趋势分析</text>
      <view class="input-group">
        <text class="label">品类</text>
        <input class="input" v-model="category" placeholder="如：女装" />
      </view>
      <view class="input-group">
        <text class="label">平台</text>
        <picker :range="platforms" @change="onPlatformChange">
          <view class="picker">{{ platform || '选择平台' }}</view>
        </picker>
      </view>
      <button class="btn-run" :loading="loading" @click="fetchTrend">
        获取趋势报告
      </button>
    </view>

    <view v-if="trendData" class="result-section">
      <text class="section-title">趋势报告</text>

      <view v-if="trendData.hot_items" class="card">
        <text class="card-title">热门单品</text>
        <view v-for="(item, i) in trendData.hot_items" :key="i" class="list-item">
          <text class="item-text">{{ item }}</text>
        </view>
      </view>

      <view v-if="trendData.trends" class="card">
        <text class="card-title">趋势洞察</text>
        <view v-for="(trend, i) in trendData.trends" :key="i" class="list-item">
          <text class="item-text">{{ trend }}</text>
        </view>
      </view>

      <view v-if="trendData.suggestions" class="card">
        <text class="card-title">运营建议</text>
        <view v-for="(sug, i) in trendData.suggestions" :key="i" class="list-item">
          <text class="item-text">{{ sug }}</text>
        </view>
      </view>

      <view class="card">
        <text class="card-title">原始数据</text>
        <text class="raw-text">{{ JSON.stringify(trendData, null, 2) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { post } from '@/services/api';

const category = ref('女装');
const platform = ref('抖音');
const loading = ref(false);
const trendData = ref<Record<string, unknown> | null>(null);

const platforms = ['抖音', '小红书', '快手', '淘宝'];

function onPlatformChange(e: { detail: { value: number } }) {
  platform.value = platforms[e.detail.value];
}

async function fetchTrend() {
  loading.value = true;
  try {
    const res = await post<{ output_data: Record<string, unknown> }>('/agents/run', {
      agent_name: 'trend',
      input_data: { category: category.value, platform: platform.value },
    });
    trendData.value = res.output_data;
  } catch {
    uni.showToast({ title: '获取失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.trend-page {
  padding: 24rpx;
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

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 16rpx;
}

.list-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.list-item:last-child {
  border-bottom: none;
}

.item-text {
  font-size: 26rpx;
  color: #333;
}

.raw-text {
  font-size: 24rpx;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
