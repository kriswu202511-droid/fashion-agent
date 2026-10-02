<template>
  <view class="container">
    <view class="header">
      <text class="title">设置</text>
    </view>

    <view class="section">
      <text class="section-title">个人信息</text>

      <view class="form-group">
        <text class="label">用户名</text>
        <text class="value">{{ profile?.user?.username || '-' }}</text>
      </view>

      <view class="form-group">
        <text class="label">显示名称</text>
        <input class="input" v-model="profileForm.display_name" placeholder="输入显示名称" />
      </view>

      <view class="form-group">
        <text class="label">邮箱</text>
        <input class="input" v-model="profileForm.email" placeholder="输入邮箱" />
      </view>

      <button class="btn-primary" @click="saveProfile">保存</button>
    </view>

    <view class="section">
      <text class="section-title">店铺设置</text>

      <view class="form-group">
        <text class="label">店铺名称</text>
        <input class="input" v-model="settingsForm.store_name" placeholder="输入店铺名称" />
      </view>

      <view class="form-group">
        <text class="label">主营平台</text>
        <picker :range="platforms" @change="onPlatformChange">
          <view class="picker">
            {{ settingsForm.store_platform || '选择平台' }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="label">主营类目</text>
        <input class="input" v-model="settingsForm.store_category" placeholder="如：女装、男装" />
      </view>

      <view class="form-group">
        <text class="label">品牌风格</text>
        <input class="input" v-model="settingsForm.brand_style" placeholder="如：简约、甜美" />
      </view>

      <view class="form-group">
        <text class="label">目标受众</text>
        <input class="input" v-model="settingsForm.target_audience" placeholder="如：18-25岁女性" />
      </view>

      <view class="form-group">
        <text class="label">价格区间</text>
        <input class="input" v-model="settingsForm.price_range" placeholder="如：100-300元" />
      </view>
    </view>

    <view class="section">
      <text class="section-title">联系方式</text>

      <view class="form-group">
        <text class="label">联系电话</text>
        <input class="input" v-model="settingsForm.contact_phone" placeholder="输入联系电话" />
      </view>

      <view class="form-group">
        <text class="label">微信号</text>
        <input class="input" v-model="settingsForm.contact_wechat" placeholder="输入微信号" />
      </view>
    </view>

    <view class="section">
      <text class="section-title">售后政策</text>

      <view class="form-group">
        <text class="label">退换货政策</text>
        <textarea
          class="textarea"
          v-model="settingsForm.return_policy"
          placeholder="输入退换货政策"
        />
      </view>

      <view class="form-group">
        <text class="label">发货政策</text>
        <textarea
          class="textarea"
          v-model="settingsForm.shipping_policy"
          placeholder="输入发货政策"
        />
      </view>
    </view>

    <button class="btn-primary" @click="saveSettings">保存设置</button>

    <view class="section">
      <text class="section-title">账号</text>
      <button class="btn-danger" @click="handleLogout">退出登录</button>
    </view>

    <view class="footer">
      <text class="version">版本 0.1.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, put } from '@/services/api';
import { logout } from '@/services/auth';

interface UserProfile {
  user: {
    id: string;
    username: string;
    email: string;
    display_name: string;
    role: string;
  };
  settings: {
    store_name: string;
    store_platform: string;
    store_category: string;
    brand_style: string;
    target_audience: string;
    price_range: string;
    contact_phone: string;
    contact_wechat: string;
    return_policy: string;
    shipping_policy: string;
  };
}

const profile = ref<UserProfile | null>(null);
const platforms = ['抖音', '小红书', '快手', '淘宝', '拼多多'];

const profileForm = ref({
  display_name: '',
  email: '',
});

const settingsForm = ref({
  store_name: '',
  store_platform: '',
  store_category: '',
  brand_style: '',
  target_audience: '',
  price_range: '',
  contact_phone: '',
  contact_wechat: '',
  return_policy: '',
  shipping_policy: '',
});

function onPlatformChange(e: { detail: { value: number } }) {
  settingsForm.value.store_platform = platforms[e.detail.value];
}

async function loadProfile() {
  try {
    profile.value = await get<UserProfile>('/settings/profile');
    profileForm.value.display_name = profile.value.user.display_name || '';
    profileForm.value.email = profile.value.user.email || '';

    const s = profile.value.settings;
    settingsForm.value = {
      store_name: s.store_name || '',
      store_platform: s.store_platform || '',
      store_category: s.store_category || '',
      brand_style: s.brand_style || '',
      target_audience: s.target_audience || '',
      price_range: s.price_range || '',
      contact_phone: s.contact_phone || '',
      contact_wechat: s.contact_wechat || '',
      return_policy: s.return_policy || '',
      shipping_policy: s.shipping_policy || '',
    };
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
}

async function saveProfile() {
  try {
    await put('/settings/profile', {
      display_name: profileForm.value.display_name,
      email: profileForm.value.email,
    });
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
}

async function saveSettings() {
  try {
    await put('/settings/settings', settingsForm.value);
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        logout();
      }
    },
  });
}

onMounted(() => {
  loadProfile();
});
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

.section {
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

.form-group {
  margin-bottom: 24rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}

.value {
  font-size: 28rpx;
  color: #333;
}

.input {
  background: #f5f5f5;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  width: 100%;
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
  margin-top: 16rpx;
}

.btn-danger {
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
  width: 100%;
}

.footer {
  text-align: center;
  padding: 40rpx 0;
}

.version {
  font-size: 24rpx;
  color: #999;
}
</style>
