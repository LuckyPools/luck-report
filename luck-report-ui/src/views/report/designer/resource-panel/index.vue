<template>
  <div ref="sidePanel" class="ud-panel">
      <u-tabs v-model="activeTab" type="card" class="resource-tabs" @tab-change="handleTabChange">
          <u-tab-pane :label="$t('panel.property')" index="property" />
          <u-tab-pane :label="$t('panel.datasource')" index="datasource" />
      </u-tabs>
      <div class="tab-content" ref="tabContent">
          <PropertyPanel v-show="activeTab === 'property'" ref="propertyPanel" :row-index="rowIndex" :col-index="colIndex" :row2-index="row2Index" :col2-index="col2Index" :refresh-trigger="refreshTrigger" @refresh="handlePropertyPanelRefresh" />
          <DatasourcePanel v-show="activeTab === 'datasource'" />
      </div>
  </div>
</template>

<script>
import DatasourcePanel from './datasource-panel/index.vue';
import PropertyPanel from '@/views/report/designer/resource-panel/property-panel/index.vue';
import UTabs from '@/components/tabs/index.vue';
import UTabPane from '@/components/tabs/pane.vue';
import {mapGetters} from "vuex";

export default {
  name: 'SidePanel',
  components: {DatasourcePanel, PropertyPanel, UTabs, UTabPane},
  props: {
    selectedCells: {
      type: Object,
      default: () => ({
        rowIndex: null,
        colIndex: null,
        row2Index: null,
        col2Index: null
      })
    }
  },
  data() {
    return {
      activeTab: 'property',
      rowIndex: 0,
      colIndex: 0,
      row2Index: 0,
      col2Index: 0,
      refreshTrigger: 0
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext || {};
    },
  },
  watch: {
    selectedCells: {
      deep: true,
      handler(newVal) {
        if (newVal.rowIndex !== null && newVal.colIndex !== null) {
          this.refreshPropertyPanel(newVal.rowIndex, newVal.colIndex, newVal.row2Index, newVal.col2Index);
        }
      }
    }
  },
  beforeUnmount() {

  },
  methods: {

    /**
     * 刷新属性面板
     */
    refreshPropertyPanel(rowIndex, colIndex, row2Index, col2Index) {
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.row2Index = row2Index;
      this.col2Index = col2Index;
      this.activeTab = this.activeTab ? this.activeTab : 'property';
      this.refreshTrigger++;
    },

    handleTabChange(){
      if(this.activeTab === 'property'){
        this.refreshTrigger++;
      }
    },

    handlePropertyPanelRefresh(){
      this.refreshTrigger++;
    }
  }
}
</script>

<style scoped>
.ud-panel{
  position: relative;
  width: 400px;
  background: #ffffff;
  box-shadow: -5px 0 5px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-content{
  border-left: 1px #e0e0e0 solid;
  flex-grow: 1;
  overflow-y: auto;
}

.resource-tabs {
  height: 50px;
  border: none !important;
}

.resource-tabs /deep/ .nav{
  height: 50px;
  background: #00554a !important;
}

.resource-tabs /deep/ .nav li{
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none !important;
}

.resource-tabs /deep/ .nav li:hover {
  color: grey !important;
}

.resource-tabs /deep/ .nav li:active {
  color: #00554a !important;
}

</style>
