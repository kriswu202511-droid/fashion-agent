import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isLoggedIn, logout as doLogout } from '@/services/auth';
import { useWebSocketStore } from './websocket';

export const useAuthStore = defineStore('auth', () => {
  const loggedIn = ref(false);

  function checkLogin() {
    loggedIn.value = isLoggedIn();
  }

  function logout() {
    loggedIn.value = false;
    useWebSocketStore().disconnect();
    doLogout();
  }

  function login() {
    loggedIn.value = true;
    useWebSocketStore().connect();
  }

  return { loggedIn, checkLogin, logout, login };
});
