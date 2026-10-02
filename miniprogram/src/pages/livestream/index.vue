<template>
  <view class="container">
    <view class="header">
      <text class="title">直播助手</text>
      <button class="btn-primary" @click="showCreateModal = true">新建直播</button>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="sessions.length === 0" class="empty">
      <text>暂无直播会话</text>
    </view>

    <view v-else class="session-list">
      <view class="session-card" v-for="session in sessions" :key="session.id">
        <view class="session-header">
          <text class="session-title">{{ session.title }}</text>
          <view class="status-badge" :class="'status-' + session.status">
            <text>{{ statusText(session.status) }}</text>
          </view>
        </view>
        <view class="session-info">
          <text class="info-text">创建时间: {{ formatDateTime(session.created_at) }}</text>
          <text class="info-text" v-if="session.started_at">开始时间: {{ formatDateTime(session.started_at) }}</text>
        </view>
        <view class="session-actions">
          <button class="btn-small" @click="viewSession(session)">查看详情</button>
          <button
            v-if="session.status === 'pending'"
            class="btn-small btn-success"
            @click="startSession(session.id)"
          >
            开始直播
          </button>
          <button
            v-if="session.status === 'live'"
            class="btn-small btn-danger"
            @click="endSession(session.id)"
          >
            结束直播
          </button>
        </view>
      </view>
    </view>

    <view v-if="showCreateModal" class="modal">
      <view class="modal-content">
        <text class="modal-title">新建直播</text>

        <view class="form-group">
          <text class="label">直播标题</text>
          <input class="input" v-model="createForm.title" placeholder="如：夏季新款上新" />
        </view>

        <view class="form-group">
          <text class="label">主题</text>
          <input class="input" v-model="createForm.theme" placeholder="如：夏季新款上新" />
        </view>

        <view class="form-group">
          <text class="label">平台</text>
          <picker :range="platforms" @change="onPlatformChange">
            <view class="picker">
              {{ createForm.platform || '选择平台' }}
            </view>
          </picker>
        </view>

        <view class="form-group">
          <text class="label">主推商品</text>
          <textarea class="textarea" v-model="createForm.products" placeholder="商品列表，逗号分隔" />
        </view>

        <view class="form-group">
          <text class="label">预计时长</text>
          <input class="input" v-model="createForm.duration" placeholder="如：2小时" />
        </view>

        <view class="form-group">
          <text class="label">促销活动</text>
          <textarea class="textarea" v-model="createForm.promotion" placeholder="满减、折扣等信息" />
        </view>

        <view class="form-group">
          <text class="label">主播风格</text>
          <input class="input" v-model="createForm.host_style" placeholder="如：活泼亲切" />
        </view>

        <view class="form-group">
          <text class="label">直播目标</text>
          <input class="input" v-model="createForm.goal" placeholder="如：提升转化率" />
        </view>

        <view class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">取消</button>
          <button class="btn-primary" @click="createSession">创建</button>
        </view>
      </view>
    </view>

    <view v-if="showDetailModal" class="modal">
      <view class="modal-content">
        <text class="modal-title">{{ detailSession?.title }}</text>

        <view class="detail-section">
          <text class="detail-label">直播话术脚本</text>
          <text class="detail-content">{{ detailSession?.script || '暂无脚本' }}</text>
        </view>

        <view class="detail-section" v-if="detailMessages.length > 0">
          <text class="detail-label">弹幕互动记录</text>
          <view class="message-list">
            <view class="message-item" v-for="msg in detailMessages" :key="msg.id">
              <text class="message-content">{{ msg.content }}</text>
              <text class="message-response">{{ msg.response }}</text>
            </view>
          </view>
        </view>

        <view class="modal-actions">
          <button class="btn-cancel" @click="showDetailModal = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, post } from '@/services/api';

interface LivestreamSession {
  id: string;
  title: string;
  status: string;
  script?: string;
  created_at: string;
  started_at?: string;
}

interface DanmakuMessage {
  id: string;
  content: string;
  response: string;
  category: string;
}

const sessions = ref<LivestreamSession[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const showDetailModal = ref(false);
const detailSession = ref<LivestreamSession | null>(null);
const detailMessages = ref<DanmakuMessage[]>([]);

const platforms = ['抖音', '小红书', '快手', '淘宝'];

const createForm = ref({
  title: '直播',
  theme: '夏季新款上新',
  platform: '抖音',
  products: '',
  duration: '2小时',
  promotion: '',
  host_style: '活泼亲切',
  goal: '提升转化率',
});

function statusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待开始',
    live: '直播中',
    ended: '已结束',
  };
  return map[status] || status;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function onPlatformChange(e: { detail: { value: number } }) {
  createForm.value.platform = platforms[e.detail.value];
}

async function loadSessions() {
  loading.value = true;
  try {
    sessions.value = await get<LivestreamSession[]>('/livestream/sessions');
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function createSession() {
  try {
    await post('/livestream/session', {
      title: createForm.value.title,
      theme: createForm.value.theme,
      platform: createForm.value.platform,
      products: createForm.value.products,
      duration: createForm.value.duration,
      promotion: createForm.value.promotion,
      host_style: createForm.value.host_style,
      goal: createForm.value.goal,
    });

    uni.showToast({ title: '创建成功', icon: 'success' });
    showCreateModal.value = false;
    loadSessions();
  } catch (err) {
    uni.showToast({ title: '创建失败', icon: 'none' });
  }
}

async function startSession(id: string) {
  try {
    await post(`/livestream/session/${id}/start`);
    uni.showToast({ title: '直播已开始', icon: 'success' });
    loadSessions();
  } catch (err) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
}

async function endSession(id: string) {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束这场直播吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await post(`/livestream/session/${id}/end`);
          uni.showToast({ title: '直播已结束', icon: 'success' });
          loadSessions();
        } catch (err) {
          uni.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    },
  });
}

async function viewSession(session: LivestreamSession) {
  detailSession.value = session;
  try {
    const data = await get<{ messages: DanmakuMessage[] }>(`/livestream/session/${session.id}`);
    detailMessages.value = data.messages || [];
  } catch (err) {
    detailMessages.value = [];
  }
  showDetailModal.value = true;
}

onMounted(() => {
  loadSessions();
});
</script>

<style scoped>
.container {
  padding: 24rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}

.loading,
.empty {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.session-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.session-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.status-pending {
  background: #f0f0f0;
  color: #666;
}

.status-live {
  background: #ff4d4f;
  color: #fff;
}

.status-ended {
  background: #d9d9d9;
  color: #666;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.info-text {
  font-size: 26rpx;
  color: #666;
}

.session-actions {
  display: flex;
  gap: 16rpx;
}

.btn-small {
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
}

.btn-success {
  background: #52c41a;
  color: #fff;
}

.btn-danger {
  background: #ff4d4f;
  color: #fff;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  width: 85%;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
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

.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.btn-cancel {
  flex: 1;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 0;
  font-size: 28rpx;
}

.modal-actions .btn-primary {
  flex: 1;
  padding: 20rpx 0;
}

.detail-section {
  margin-bottom: 24rpx;
}

.detail-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
  display: block;
}

.detail-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.message-item {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx;
}

.message-content {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.message-response {
  font-size: 24rpx;
  color: #1890ff;
}
</style>
