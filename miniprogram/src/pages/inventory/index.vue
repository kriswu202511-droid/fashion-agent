<template>
  <view class="container">
    <view class="header">
      <text class="title">库存管理</text>
      <view class="actions">
        <button class="btn-primary" @click="showAddModal = true">添加商品</button>
      </view>
    </view>

    <view class="search-bar">
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索商品名称/SKU"
        @confirm="loadProducts"
      />
    </view>

    <view class="product-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="products.length === 0" class="empty">
        <text>暂无商品</text>
      </view>

      <view v-else class="product-card" v-for="product in products" :key="product.id">
        <view class="product-main">
          <image v-if="product.image_url" class="product-thumb" :src="product.image_url" mode="aspectFill" />
          <view v-else class="product-thumb placeholder">
            <text>暂无图</text>
          </view>
          <view class="product-detail">
            <view class="product-header">
              <text class="product-name">{{ product.name }}</text>
              <text class="product-sku">SKU: {{ product.sku }}</text>
            </view>
            <view class="product-info">
              <text class="info-item">分类: {{ product.category || '未分类' }}</text>
              <text class="info-item">价格: ¥{{ product.price.toFixed(2) }}</text>
              <text class="info-item">成本: ¥{{ product.cost.toFixed(2) }}</text>
              <text class="info-item" v-if="product.supplier">供应商: {{ product.supplier }}</text>
            </view>
          </view>
        </view>
        <view class="product-actions">
          <button class="btn-small" @click="editProduct(product)">编辑</button>
          <button class="btn-small btn-danger" @click="deleteProduct(product.id)">删除</button>
        </view>
      </view>
    </view>

    <view v-if="showAddModal" class="modal">
      <view class="modal-content">
        <text class="modal-title">{{ editingProduct ? '编辑商品' : '添加商品' }}</text>

        <view class="form-group">
          <text class="label">SKU *</text>
          <input class="input" v-model="form.sku" placeholder="商品SKU" />
        </view>

        <view class="form-group">
          <text class="label">名称 *</text>
          <input class="input" v-model="form.name" placeholder="商品名称" />
        </view>

        <view class="form-group">
          <text class="label">商品图片</text>
          <view class="image-upload" @click="chooseImage">
            <image v-if="form.image_url" class="preview-image" :src="form.image_url" mode="aspectFill" />
            <view v-else class="upload-placeholder">
              <text>+</text>
              <text class="upload-hint">点击上传</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="label">分类</text>
          <input class="input" v-model="form.category" placeholder="如：连衣裙、T恤" />
        </view>

        <view class="form-group">
          <text class="label">价格</text>
          <input class="input" v-model="form.price" type="digit" placeholder="0.00" />
        </view>

        <view class="form-group">
          <text class="label">成本</text>
          <input class="input" v-model="form.cost" type="digit" placeholder="0.00" />
        </view>

        <view class="form-group">
          <text class="label">供应商</text>
          <input class="input" v-model="form.supplier" placeholder="供应商名称" />
        </view>

        <view class="form-group">
          <text class="label">描述</text>
          <textarea class="textarea" v-model="form.description" placeholder="商品描述" />
        </view>

        <view class="modal-actions">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-primary" @click="saveProduct">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, post, put, del } from '@/services/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  sub_category: string;
  price: number;
  cost: number;
  supplier: string;
  image_url: string;
  description: string;
  tags: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const products = ref<Product[]>([]);
const loading = ref(false);
const keyword = ref('');
const showAddModal = ref(false);
const editingProduct = ref<Product | null>(null);

const form = ref({
  sku: '',
  name: '',
  category: '',
  price: '0',
  cost: '0',
  supplier: '',
  description: '',
  image_url: '',
});

async function loadProducts() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { page: 1, page_size: 50 };
    if (keyword.value) {
      params.keyword = keyword.value;
    }
    const data = await get<{ items: Product[] }>('/inventory/products', params);
    products.value = data.items;
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function editProduct(product: Product) {
  editingProduct.value = product;
  form.value = {
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price.toString(),
    cost: product.cost.toString(),
    supplier: product.supplier,
    description: product.description,
    image_url: product.image_url || '',
  };
  showAddModal.value = true;
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0];
      const token = uni.getStorageSync('token') || '';
      uni.uploadFile({
        url: 'http://47.102.219.206/api/upload/image',
        filePath: tempPath,
        name: 'file',
        header: { Authorization: `Bearer ${token}` },
        success: (uploadRes) => {
          try {
            const data = JSON.parse(uploadRes.data);
            form.value.image_url = data.url;
          } catch {
            uni.showToast({ title: '上传失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '上传失败', icon: 'none' });
        },
      });
    },
  });
}

async function saveProduct() {
  if (!form.value.sku || !form.value.name) {
    uni.showToast({ title: '请填写SKU和名称', icon: 'none' });
    return;
  }

  try {
    const data = {
      sku: form.value.sku,
      name: form.value.name,
      category: form.value.category,
      price: parseFloat(form.value.price) || 0,
      cost: parseFloat(form.value.cost) || 0,
      supplier: form.value.supplier,
      description: form.value.description,
      image_url: form.value.image_url,
    };

    if (editingProduct.value) {
      await put(`/inventory/products/${editingProduct.value.id}`, data);
      uni.showToast({ title: '更新成功', icon: 'success' });
    } else {
      await post('/inventory/products', data);
      uni.showToast({ title: '添加成功', icon: 'success' });
    }

    closeModal();
    loadProducts();
  } catch (err) {
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
}

async function deleteProduct(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个商品吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await del(`/inventory/products/${id}`);
          uni.showToast({ title: '删除成功', icon: 'success' });
          loadProducts();
        } catch (err) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    },
  });
}

function closeModal() {
  showAddModal.value = false;
  editingProduct.value = null;
  form.value = {
    sku: '',
    name: '',
    category: '',
    price: '0',
    cost: '0',
    supplier: '',
    description: '',
    image_url: '',
  };
}

onMounted(() => {
  loadProducts();
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

.search-bar {
  margin-bottom: 24rpx;
}

.search-input {
  background: #fff;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.loading,
.empty {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.product-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.product-main {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.product-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.product-thumb.placeholder {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 24rpx;
}

.product-detail {
  flex: 1;
  min-width: 0;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.product-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.product-sku {
  font-size: 24rpx;
  color: #999;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.info-item {
  font-size: 26rpx;
  color: #666;
}

.product-actions {
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

.image-upload {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 12rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 48rpx;
}

.upload-hint {
  font-size: 24rpx;
  margin-top: 8rpx;
}
</style>
