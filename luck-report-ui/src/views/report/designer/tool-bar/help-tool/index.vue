<template>
  <u-button
    :title="$t('tools.help.title')"
    class="tool-button"
    icon="icon-question"
    @click="handleClick"
  >
    <UDialog
      :title="$t('tools.help.title')"
      width="460px"
      top="0"
      :visible.sync="visible"
      class="help-dialog"
    >
      <div class="help-content">
        <a
          class="help-card"
          :href="docUrl"
          target="_blank"
          rel="noopener"
        >
          <div class="help-card__icon help-card__icon--doc">
            <i class="iconfont icon-doc"></i>
          </div>
          <div class="help-card__body">
            <div class="help-card__title">{{ $t('tools.help.doc') }}</div>
            <div class="help-card__desc">{{ $t('tools.help.docDesc') }}</div>
          </div>
          <i class="iconfont icon-right help-card__arrow"></i>
        </a>

        <a
          class="help-card"
          :href="issueUrl"
          target="_blank"
          rel="noopener"
        >
          <div class="help-card__icon help-card__icon--issue">
            <i class="iconfont icon-edit"></i>
          </div>
          <div class="help-card__body">
            <div class="help-card__title">{{ $t('tools.help.issue') }}</div>
            <div class="help-card__desc">{{ $t('tools.help.issueDesc') }}</div>
          </div>
          <i class="iconfont icon-right help-card__arrow"></i>
        </a>
      </div>
    </UDialog>
  </u-button>
</template>

<script>
import UButton from '@/components/button/index.vue';
import UDialog from '@/components/dialog/index.vue';

export default {
  name: 'HelpTool',
  components: { UButton, UDialog },
  data() {
    return {
      visible: false,
      /** 官网文档地址 */
      docUrl: 'https://www.quzhe.top/luck-report-blog/report/Luck-Report%E4%BB%8B%E7%BB%8D.html',
      /** 提问地址 */
      issueUrl: 'https://gitee.com/LuckyPools/luck-report/issues/new'
    };
  },
  methods: {
    /** 打开帮助弹窗 */
    handleClick() {
      this.visible = true;
    }
  }
};
</script>

<style scoped>
.help-content {
  padding: 4px 4px 8px;
}

/* 卡片式链接：整张卡片可点击 */
.help-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 12px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #fafafa;
  text-decoration: none;
}

.help-card:last-child {
  margin-bottom: 0;
}

.help-card:hover {
  border-color: #00554a;
}

/* 左侧图标容器：用不同背景色区分两类入口 */
.help-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  margin-right: 14px;
}

/* 文档图标：主题色 */
.help-card__icon--doc {
  background-color: #00554a;
}

/* 提问图标：暖橙色，与文档区分 */
.help-card__icon--issue {
  background-color: #fa8c16;
}

/* 中部内容区：标题 + 描述 */
.help-card__body {
  flex: 1;
  min-width: 0;
}

.help-card__title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  line-height: 22px;
}

.help-card__desc {
  margin-top: 2px;
  font-size: 12px;
  color: #999;
  line-height: 18px;
}

/* 右侧箭头 */
.help-card__arrow {
  flex-shrink: 0;
  margin-left: 12px;
  color: #c0c0c0;
  font-size: 14px;
}

.help-card:hover .help-card__arrow {
  color: #00554a;
}
</style>

<style>
.help-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
