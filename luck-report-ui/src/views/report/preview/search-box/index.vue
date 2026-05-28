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
  width: 100%;
  box-sizing: border-box;
}

.tools-content {
  border-bottom: solid 1px #ddd;
  height: 48px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  padding: 0 7.5px;
  gap: 6px;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,.2);
}

.tools-content .iconfont {
  margin-left: 15px;
}

.title {
  font-size: 14px;
}

.main {
  width: 100%;
  box-sizing: border-box;
  padding: 0 10px 20px 10px;
}
</style>
