import api from './api';

export interface Product {
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

export interface InventoryItem {
  id: string;
  product_id: string;
  sku: string;
  quantity: number;
  warehouse: string;
  location: string;
  min_stock: number;
  updated_at: string;
}

export const inventoryApi = {
  listProducts: (params?: { page?: number; page_size?: number; category?: string; keyword?: string }) =>
    api.get<{ items: Product[]; total: number; page: number; page_size: number }>('/inventory/products', { params }),

  createProduct: (data: Partial<Product>) =>
    api.post<Product>('/inventory/products', data),

  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/inventory/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete(`/inventory/products/${id}`),

  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ message: string }>('/inventory/products/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  exportExcel: () =>
    api.get('/inventory/products/export-excel', { responseType: 'blob' }),

  listInventory: () =>
    api.get<InventoryItem[]>('/inventory/inventory'),

  createInventoryItem: (data: Partial<InventoryItem>) =>
    api.post<InventoryItem>('/inventory/inventory', data),
};
