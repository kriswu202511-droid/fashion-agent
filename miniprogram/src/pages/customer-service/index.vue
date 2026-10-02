<template>
  <view class="container">
    <view class="header">
      <text class="title">智能客服</text>
    </view>

    <view class="chat-area">
      <view v-if="messages.length === 0" class="empty-chat">
        <text>输入问题开始对话</text>
      </view>

      <view
        v-for="(msg, index) in messages"
        :key="index"
        class="message"
        :class="{ 'message-user': msg.role === 'user', 'message-bot': msg.role === 'assistant' }"
      >
        <view class="message-bubble">
          <text class="message-text">{{ msg.content }}</text>
          <view v-if="msg.confidence !== undefined" class="message-meta">
            <text class="confidence">置信度: {{ (msg.confidence * 100).toFixed(0) }}%</text>
            <text v-if="msg.need_human" class="need-human">需人工介入</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="message message-bot">
        <view class="message-bubble">
          <text class="message-text typing">思考中...</text>
        </view>
      </view>
    </view>

    <view class="input-area">
      <input
        class="chat-input"
        v-model="question"
        placeholder="输入买家咨询问题..."
        @confirm="sendMessage"
      />
      <button class="send-btn" @click="sendMessage" :disabled="loading">发送</button>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">知识库</text>
        <button class="btn-small" @click="showAddKnowledge = true">添加</button>
      </view>

      <view v-if="knowledgeList.length === 0" class="empty">
        <text>暂无知识库条目</text>
      </view>

      <view v-else class="knowledge-list">
        <view class="knowledge-item" v-for="item in knowledgeList" :key="item.id">
          <view class="knowledge-header">
            <text class="knowledge-title">{{ item.title }}</text>
            <text class="knowledge-category">{{ item.category }}</text>
          </view>
          <text class="knowledge-content">{{ item.content.substring(0, 100) }}...</text>
        </view>
      </view>
    </view>

    <view v-if="showAddKnowledge" class="modal">
      <view class="modal-content">
        <text class="modal-title">添加知识</text>

        <view class="form-group">
          <text class="label">标题 *</text>
          <input class="input" v-model="knowledgeForm.title" placeholder="问题标题" />
        </view>

        <view class="form-group">
          <text class="label">分类</text>
          <input class="input" v-model="knowledgeForm.category" placeholder="如：尺码、面料、物流" />
        </view>

        <view class="form-group">
          <text class="label">内容 *</text>
          <textarea class="textarea" v-model="knowledgeForm.content" placeholder="详细回答内容" />
        </view>

        <view class="modal-actions">
          <button class="btn-cancel" @click="showAddKnowledge = false">取消</button>
          <button class="btn-primary" @click="addKnowledge">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, post } from '@/services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  need_human?: boolean;
}

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
  created_at: string;
}

const messages = ref<Message[]>([]);
const question = ref('');
const loading = ref(false);
const sessionId = ref('');
const knowledgeList = ref<KnowledgeItem[]>([]);
const showAddKnowledge = ref(false);

const knowledgeForm = ref({
  title: '',
  category: 'general',
  content: '',
});

async function sendMessage() {
  if (!question.value.trim() || loading.value) return;

  const userMsg = question.value.trim();
  messages.value.push({ role: 'user', content: userMsg });
  question.value = '';
  loading.value = true;

  try {
    const result = await post<{
      session_id: string;
      reply: string;
      confidence: number;
      need_human: boolean;
      context_docs: unknown[];
    }>('/cs/chat', {
      question: userMsg,
      session_id: sessionId.value || undefined,
    });

    sessionId.value = result.session_id;
    messages.value.push({
      role: 'assistant',
      content: result.reply,
      confidence: result.confidence,
      need_human: result.need_human,
    });
  } catch (err) {
    uni.showToast({ title: '回复失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function loadKnowledge() {
  try {
    knowledgeList.value = await get<KnowledgeItem[]>('/cs/knowledge');
  } catch (err) {
    console.error('加载知识库失败', err);
  }
}

async function addKnowledge() {
  if (!knowledgeForm.value.title || !knowledgeForm.value.content) {
    uni.showToast({ title: '请填写标题和内容', icon: 'none' });
    return;
  }

  try {
    await post('/cs/knowledge', {
      title: knowledgeForm.value.title,
      category: knowledgeForm.value.category,
      content: knowledgeForm.value.content,
    });

    uni.showToast({ title: '添加成功', icon: 'success' });
    showAddKnowledge.value = false;
    knowledgeForm.value = { title: '', category: 'general', content: '' };
    loadKnowledge();
  } catch (err) {
    uni.showToast({ title: '添加失败', icon: 'none' });
  }
}

onMounted(() => {
  loadKnowledge();
});
</script>

<style scoped>
.container {
  padding: 24rpx;
  padding-bottom: 140rpx;
}

.header {
  margin-bottom: 24rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.chat-area {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  min-height: 400rpx;
  margin-bottom: 24rpx;
}

.empty-chat {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.message {
  margin-bottom: 20rpx;
  display: flex;
}

.message-user {
  justify-content: flex-end;
}

.message-bot {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}

.message-user .message-bubble {
  background: #1890ff;
  color: #fff;
  border-bottom-right-radius: 4rpx;
}

.message-bot .message-bubble {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4rpx;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.6;
}

.typing {
  color: #999;
  font-style: italic;
}

.message-meta {
  margin-top: 12rpx;
  display: flex;
  gap: 16rpx;
}

.confidence {
  font-size: 22rpx;
  color: #999;
}

.need-human {
  font-size: 22rpx;
  color: #ff4d4f;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 24rpx;
  display: flex;
  gap: 16rpx;
  border-top: 1rpx solid #e8e8e8;
}

.chat-input {
  flex: 1;
  background: #f5f5f5;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
}

.send-btn {
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}

.send-btn:disabled {
  opacity: 0.5;
}

.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.btn-small {
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
}

.empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.knowledge-item {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.knowledge-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.knowledge-category {
  font-size: 22rpx;
  color: #1890ff;
  background: #e6f7ff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.knowledge-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
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
  width: 80%;
  max-height: 80vh;
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

.textarea {
  background: #f5f5f5;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  width: 100%;
  min-height: 160rpx;
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
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx 0;
  font-size: 28rpx;
}
</style>
