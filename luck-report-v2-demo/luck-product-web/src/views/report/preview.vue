<template>
  <div class="report-preview-page">
    <report-iframe type="preview" :report-id="reportId" />
  </div>
</template>

<script>
import ReportIframe from '@/components/report-iframe/index.vue';

/**
 * 报表预览页面
 * 通过 iframe 嵌入后端报表预览，携带 token 鉴权
 */
export default {
  name: 'ReportPreview',
  components: { ReportIframe },
  computed: {
    /** 从路由获取报表ID */
    reportId() {
      return this.$route.query.id || this.$route.params.id || '';
    }
  }
};
</script>

<style lang="less" scoped>
.report-preview-page {
  width: 100%;
  height: calc(100vh - 64px - 32px);
}
</style>
