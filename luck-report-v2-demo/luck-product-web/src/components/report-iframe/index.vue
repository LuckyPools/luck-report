<template>
  <div class="report-iframe-wrapper">
    <a-spin v-if="loading" class="iframe-loading" tip="报表加载中..." />
    <iframe
      v-show="!loading"
      ref="reportIframe"
      :src="iframeSrc"
      class="report-iframe"
      frameborder="0"
      allowfullscreen
      @load="onIframeLoad"
    />
  </div>
</template>

<script>
import { getReportToken } from '@/api/report/token';
import { getApiUrl } from '@/config/api';

/**
 * 报表 iframe 通用组件
 * 根据传入的 type 自动拼接报表后端 URL，并携带 token 参数
 * @prop type - 报表页面类型：designer / preview / manage
 * @prop reportId - 报表ID（设计器和预览需要）
 * @prop subject - 用户标识（用于申请 token）
 */
export default {
  name: 'ReportIframe',
  props: {
    type: {
      type: String,
      required: true,
      validator: v => ['designer', 'preview', 'manage'].includes(v)
    },
    reportId: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: true,
      reportToken: '',
      renewTimer: null
    };
  },
  computed: {
    /** 拼接 iframe src，带 token 参数，直接指向报表后端 */
    iframeSrc() {
      if (!this.reportToken) return '';
      const viewPath = this.type;
      const reportBaseUrl = getApiUrl();
      const iframeUrl = `${reportBaseUrl}/report/${viewPath}`;
      const params = [`token=${this.reportToken}`];
      if (this.reportId) {
        params.push(`id=${this.reportId}`);
      }
      return `${iframeUrl}?${params.join('&')}`;
    }
  },
  watch: {
    type: 'fetchToken',
    reportId: 'fetchToken'
  },
  mounted() {
    this.fetchToken();
  },
  methods: {
    /** 向后端申请报表 token */
    async fetchToken() {
      try {
        const res = await getReportToken();
        // 响应格式：{ data: { code: 0, data: { token, expiresIn, scope }, message, ok } }
        this.reportToken = res.data?.data?.token || '';
      } catch (e) {
        console.error('[ReportIframe] 获取报表token失败:', e);
      }
    },
    /** iframe 加载完成 */
    onIframeLoad() {
      this.loading = false;
    }
  }
};
</script>

<style lang="less" scoped>
.report-iframe-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.iframe-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.report-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
