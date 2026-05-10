<template>
  <div class="search-box">
    <div ref="searchForm"></div>
  </div>
</template>

<script>
import {renderTemplateToComponent} from "@/views/report/preview/utils/render";
import {beautifierConf, deepClone} from "@/views/report/designer/search-form/utils";
import {cssStyle, makeUpHtml, vueScript, vueTemplate} from "@/views/report/designer/search-form/utils/html";
import {makeUpJs} from "@/views/report/designer/search-form/utils/js";
import {makeUpCss} from "@/views/report/designer/search-form/utils/css";
import beautifier from "js-beautify";

export default {
  name: 'SearchBox',
  props: {
    searchFormConfig: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      formInstance: null
    }
  },
  watch: {
    searchFormConfig: {
      handler(newVal) {
        if (newVal) {
          this.$nextTick(() => {
            this.init(newVal);
          });
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    init(searchFormConfig) {
      if (!searchFormConfig || !searchFormConfig.fields || searchFormConfig.fields.length === 0) {
        return;
      }

      if (this.formInstance) {
        this.formInstance.$destroy();
        this.formInstance = null;
      }

      const generateType = 'file';
      const script = vueScript(makeUpJs(searchFormConfig, generateType));
      const html = vueTemplate(makeUpHtml(searchFormConfig, generateType));
      const css = cssStyle(makeUpCss(searchFormConfig));
      const formJs = beautifier.html(html + script + css, beautifierConf.html);

      this.formInstance = renderTemplateToComponent(formJs, this.$refs.searchForm);

      this.formInstance.$on('on-submit', (formData) => {
        const clonedData = deepClone(formData);
        this.$emit('submit', clonedData);
      });
    }
  },
  beforeDestroy() {
    if (this.formInstance) {
      this.formInstance.$destroy();
      this.formInstance = null;
    }
  }
}
</script>

<style scoped>
.search-box {
  width: 600px;
  margin: 0 auto;
}
</style>
