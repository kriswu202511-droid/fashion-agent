<template>
  <view class="container">
    <view class="header">
      <text class="title">穿搭顾问</text>
    </view>

    <view class="upload-section">
      <text class="section-title">上传照片</text>
      <view class="upload-area" @click="chooseImage">
        <image v-if="imageBase64" :src="imageBase64" class="preview-image" mode="aspectFit" />
        <view v-else class="upload-placeholder">
          <text class="upload-icon">+</text>
          <text class="upload-text">点击上传全身照</text>
        </view>
      </view>
    </view>

    <view class="form-section">
      <text class="section-title">穿搭需求</text>

      <view class="form-group">
        <text class="label">体型</text>
        <picker :range="bodyTypes" @change="onBodyTypeChange">
          <view class="picker">
            {{ form.body_type || '选择体型' }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="label">场景</text>
        <picker :range="scenes" @change="onSceneChange">
          <view class="picker">
            {{ form.scene || '选择场景' }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="label">季节</text>
        <picker :range="seasons" @change="onSeasonChange">
          <view class="picker">
            {{ form.season || '选择季节' }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="label">风格偏好</text>
        <picker :range="styles" @change="onStyleChange">
          <view class="picker">
            {{ form.style_preference || '选择风格' }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="label">特殊要求</text>
        <textarea
          class="textarea"
          v-model="form.special_requirements"
          placeholder="如：显瘦、遮肉、正式场合等"
        />
      </view>
    </view>

    <button class="btn-primary btn-generate" @click="generateOutfit" :disabled="loading">
      {{ loading ? '生成中...' : '生成穿搭方案' }}
    </button>

    <view v-if="result" class="result-section">
      <text class="section-title">推荐方案</text>

      <view v-if="photoAnalysis" class="analysis-card">
        <text class="analysis-title">照片分析</text>
        <text class="analysis-content">{{ photoAnalysis }}</text>
      </view>

      <view class="outfit-card">
        <text class="outfit-title">搭配建议</text>
        <text class="outfit-content">{{ result.outfit_recommendation }}</text>
      </view>

      <view v-if="result.tips && result.tips.length > 0" class="tips-card">
        <text class="tips-title">穿搭技巧</text>
        <view class="tips-list">
          <text v-for="(tip, index) in result.tips" :key="index" class="tip-item">• {{ tip }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { post } from '@/services/api';

interface OutfitResult {
  outfit_recommendation: string;
  tips?: string[];
  photo_analysis?: string;
}

const imageBase64 = ref('');
const photoAnalysis = ref('');
const result = ref<OutfitResult | null>(null);
const loading = ref(false);

const bodyTypes = ['偏瘦', '标准', '微胖', '丰满'];
const scenes = ['日常休闲', '通勤办公', '约会聚会', '正式场合', '运动户外'];
const seasons = ['春季', '夏季', '秋季', '冬季'];
const styles = ['简约', '甜美', '休闲', '商务', '复古', '街头'];

const form = ref({
  body_type: '',
  scene: '',
  season: '',
  style_preference: '',
  special_requirements: '',
});

function onBodyTypeChange(e: { detail: { value: number } }) {
  form.value.body_type = bodyTypes[e.detail.value];
}

function onSceneChange(e: { detail: { value: number } }) {
  form.value.scene = scenes[e.detail.value];
}

function onSeasonChange(e: { detail: { value: number } }) {
  form.value.season = seasons[e.detail.value];
}

function onStyleChange(e: { detail: { value: number } }) {
  form.value.style_preference = styles[e.detail.value];
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      convertToBase64(tempFilePath);
    },
  });
}

function convertToBase64(filePath: string) {
  // #ifdef MP-WEIXIN
  const fs = uni.getFileSystemManager();
  fs.readFile({
    filePath,
    encoding: 'base64',
    success: (data) => {
      imageBase64.value = `data:image/jpeg;base64,${data.data}`;
    },
    fail: () => {
      uni.showToast({ title: '图片读取失败', icon: 'none' });
    },
  });
  // #endif

  // #ifdef H5
  uni.getFileSystemManager?.()?.readFile?.({
    filePath,
    encoding: 'base64',
    success: (data) => {
      imageBase64.value = `data:image/jpeg;base64,${data.data}`;
    },
  });
  // #endif
}

async function generateOutfit() {
  if (!imageBase64.value) {
    uni.showToast({ title: '请先上传照片', icon: 'none' });
    return;
  }

  loading.value = true;
  result.value = null;
  photoAnalysis.value = '';

  try {
    const base64Data = imageBase64.value.split(',')[1];
    const res = await post<{ task_id: string; status: string; output_data: OutfitResult | null }>(
      '/agents/run',
      {
        agent_name: 'styling',
        input_data: {
          image_base64: base64Data,
          body_type: form.value.body_type,
          scene: form.value.scene,
          season: form.value.season,
          style_preference: form.value.style_preference,
          special_requirements: form.value.special_requirements,
        },
      }
    );

    if (res.output_data) {
      result.value = res.output_data;
      if (res.output_data.photo_analysis) {
        photoAnalysis.value = res.output_data.photo_analysis;
      }
    }
  } catch (err) {
    uni.showToast({ title: '生成失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.container {
  padding: 24rpx;
}

.header {
  margin-bottom: 24rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.upload-section,
.form-section,
.result-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.upload-area {
  width: 100%;
  height: 400rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.upload-icon {
  font-size: 80rpx;
  color: #999;
}

.upload-text {
  font-size: 28rpx;
  color: #999;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.form-group {
  margin-bottom: 24rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}

.picker {
  background: #f5f5f5;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
}

.textarea {
  background: #f5f5f5;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  width: 100%;
  min-height: 120rpx;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
  width: 100%;
}

.btn-generate {
  margin-bottom: 24rpx;
}

.btn-primary:disabled {
  opacity: 0.5;
}

.analysis-card,
.outfit-card,
.tips-card {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.analysis-title,
.outfit-title,
.tips-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.analysis-content,
.outfit-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tip-item {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}
</style>
