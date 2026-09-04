<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useAuthStore } from './stores/auth';

onLaunch(() => {
  const auth = useAuthStore();
  auth.checkLogin();
});
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
