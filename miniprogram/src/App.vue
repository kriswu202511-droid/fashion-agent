<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useAuthStore } from './stores/auth';
import { useWebSocketStore } from './stores/websocket';

onLaunch(() => {
  const auth = useAuthStore();
  auth.checkLogin();
  if (auth.loggedIn) {
    useWebSocketStore().connect();
  }
});

onShow(() => {
  const auth = useAuthStore();
  if (auth.loggedIn) {
    useWebSocketStore().connect();
  }
});

onHide(() => {
  useWebSocketStore().disconnect();
});
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
