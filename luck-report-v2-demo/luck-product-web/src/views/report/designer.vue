<template>
  <div class="report-designer-page">
    <report-iframe type="designer" :report-id="reportId" />
  </div>
</template>

<script>
import ReportIframe from '@/components/report-iframe/index.vue';

/**
 * 报表设计器页面
 * 通过 iframe 嵌入后端报表设计器，携带 token 鉴权
 */
export default {
  name: 'ReportDesigner',
  components: { ReportIframe },
  computed: {
    /** 从路由获取报表ID，新增时为空 */
    reportId() {
      return this.$route.query.id || this.$route.params.id || '';
    }
  }
};
</script>

<style lang="less" scoped>
.report-designer-page {
  width: 100%;
  height: calc(100vh - 64px - 32px);
}
</style>
