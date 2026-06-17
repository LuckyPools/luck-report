<template>
  <report-iframe
      v-if="tokenReady"
      type="manage"
      :subject="subject"
  />
</template>

<script>
import ReportIframe from '@/components/report-iframe/index.vue';
import { getReportToken } from '@/api/report/token';
import { mapState } from 'vuex';

/**
 * 报表管理页面（工作台）
 * 通过 iframe 嵌入后端报表管理工作台，携带 token 鉴权
 */
export default {
  name: 'ReportManage',
  components: { ReportIframe },
  data() {
    return {
      // 是否已就绪 token
      tokenReady: false,
      // 申请 token 过程的 loading
      loading: true,
      // 用户标识
      subject: ''
    };
  },
  computed: {
    ...mapState({
      userName: state => state.user.info?.name || ''
    })
  },
  async created() {
    await this.ensureReportToken();
  },
  methods: {
    /**
     * 申请 luck-report token
     * @returns {Promise<void>}
     */
    async ensureReportToken() {
      try {
        // 从 store 获取用户名，如果没有则使用默认值
        this.subject = this.userName || 'admin';
        // 预先调用一次确保 token 可用
        const res = await getReportToken({
          scope: 'manage',
          subject: this.subject
        });
        // 该项目的响应码约定：code: 0 表示成功
        if (res.data && res.data.code === 0 && res.data.data && res.data.data.token) {
          this.tokenReady = true;
        } else {
          throw new Error(res.data?.message || '获取报表token失败');
        }
      } catch (e) {
        this.$message.error('获取报表凭证失败，请重试');
        console.error('[ReportManage] 获取报表token失败:', e);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="less" scoped>
</style>
