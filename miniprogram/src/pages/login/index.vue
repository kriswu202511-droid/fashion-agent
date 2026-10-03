<template>
  <view class="login-page">
    <view class="logo-section">
      <text class="logo-text">服装AI运营助手</text>
      <text class="subtitle">智能数字运营平台</text>
    </view>

    <view class="form-section">
      <view class="input-group">
        <text class="label">用户名</text>
        <input
          class="input"
          v-model="username"
          placeholder="请输入用户名"
          type="text"
        />
      </view>
      <view class="input-group">
        <text class="label">密码</text>
        <input
          class="input"
          v-model="password"
          placeholder="请输入密码"
          type="password"
        />
      </view>

      <button class="btn-login" :loading="loading" @click="handleLogin">
        登录
      </button>

      <!-- #ifdef MP-WEIXIN -->
      <button class="btn-wechat" :loading="loading" @click="handleWechatLogin">
        微信一键登录
      </button>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { loginWithPassword, loginWithWechat } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

const username = ref('');
const password = ref('');
const loading = ref(false);
const auth = useAuthStore();

async function handleLogin() {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await loginWithPassword(username.value, password.value);
    auth.login();
    uni.switchTab({ url: '/pages/index/index' });
  } catch {
    uni.showToast({ title: '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function handleWechatLogin() {
  loading.value = true;
  try {
    await loginWithWechat();
    auth.login();
    uni.switchTab({ url: '/pages/index/index' });
  } catch {
    uni.showToast({ title: '微信登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #fff;
  padding: 0 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-section {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo-text {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #1890ff;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}

.input-group {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.input {
  height: 88rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.btn-login {
  width: 100%;
  height: 88rpx;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  margin-top: 40rpx;
}

.btn-wechat {
  width: 100%;
  height: 88rpx;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  margin-top: 24rpx;
}
</style>
