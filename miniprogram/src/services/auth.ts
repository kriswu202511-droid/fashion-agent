import { post } from './api';

interface LoginResult {
  access_token: string;
  token_type: string;
}

export async function loginWithWechat(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        try {
          const result = await post<LoginResult>('/auth/wechat', {
            code: loginRes.code,
          });
          const token = result.access_token;
          uni.setStorageSync('token', token);
          resolve(token);
        } catch (err) {
          reject(err);
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg));
      },
    });
  });
}

export async function loginWithPassword(username: string, password: string): Promise<string> {
  const result = await post<LoginResult>('/auth/login', { username, password });
  const token = result.access_token;
  uni.setStorageSync('token', token);
  return token;
}

export function logout() {
  uni.removeStorageSync('token');
  uni.reLaunch({ url: '/pages/login/index' });
}

export function isLoggedIn(): boolean {
  return !!uni.getStorageSync('token');
}
