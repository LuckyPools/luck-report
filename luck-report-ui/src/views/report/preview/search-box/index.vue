<template>
  <div class="search-box">
    <div class="tools-content">
      <i class="iconfont icon-search"></i>
      <span class="title">
        {{ $t('preview.searchBox.title') }}
      </span>
    </div>
    <div class="main">
      <div ref="searchForm"></div>
    </div>
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
  position: relative;
  width: 380px;
  overflow-y: auto;
  overflow-x: hidden;
}

.tools-content {
  border: solid 1px #ddd;
  border-radius: 5px;
  height: 42px;
  width: 100%;
  background: #f8f8f8;
  box-sizing: border-box;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  gap: 6px;
}

.title {
  font-size: 14px;
}

.main {
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}
</style>
