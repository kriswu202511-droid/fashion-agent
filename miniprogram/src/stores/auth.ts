import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isLoggedIn, logout as doLogout } from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
  const loggedIn = ref(false);

  function checkLogin() {
    loggedIn.value = isLoggedIn();
  }

  function logout() {
    loggedIn.value = false;
    doLogout();
  }

  return { loggedIn, checkLogin, logout };
});
