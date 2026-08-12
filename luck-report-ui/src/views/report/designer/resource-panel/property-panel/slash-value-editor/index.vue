<template>
  <div class="slash-value-editor">

    <div class="property-quote">
      <span>{{ $t('property.condition.config') }}</span>
    </div>
    <u-form :label-width="100" labelPosition="right">
      <u-form-item class="property-label" :label="$t('property.base.conditionProp')">
        <u-button
            type="info"
            icon="icon-filter"
            @click="handleConditionPropertyConfig"
        >
          {{ $t('property.base.configCondition') }}
        </u-button>
      </u-form-item>
    </u-form>

    <div class="property-quote">
      <span>{{ $t('property.slash.config') }}</span>
    </div>

    <u-form :label-width="100" labelPosition="right">

      <u-form-item class="property-label">
        <u-button
            @click="handleRefresh"
            icon="icon-refresh"
            style="float: right"
        >
          {{ $t('property.slash.refresh') }}
        </u-button>
      </u-form-item>

      <div v-for="(slash, index) in slashes" :key="index" class="slash-item">

        <u-form-item class="property-label" :label="$t('property.slash.name')" style="margin-bottom: 10px">
          <u-input
              v-model="slash.text"
              style="width: 250px"
              @change="handleSlashChange(index)"
          />
        </u-form-item>

        <u-form-item class="property-label" label="Y" style="margin-bottom: 10px">
          <u-input-number
              v-model="slash.y"
              @change="handleSlashChange(index)"
          />
        </u-form-item>

        <u-form-item class="property-label" label="X" style="margin-bottom: 10px">
          <u-input-number
              v-model="slash.x"
              @change="handleSlashChange(index)"
          />
        </u-form-item>

        <u-form-item class="property-label" :label="$t('property.slash.angle')" style="margin-bottom: 10px">
          <u-input-number
              v-model="slash.degree"
              @change="handleSlashChange(index)"
          />
        </u-form-item>

      </div>
    </u-form>

    <!-- 条件属性对话框 -->
    <PropertyConditionDialog
        :visible.sync="propertyConditionDialogVisible"
        :cell-type="currentCellType"
        :fields="getConditionFields()"
        :conditionGroups="conditionGroups"
        @saveAfter="handlePropertyConditionSave"
    />
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import { deepCopy } from '@/components/utils/index.js';
import { setCell, getCell, getContext } from '@/utils/contextActions.js';
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class.js';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import UButton from "@/components/button/index.vue";
import UForm from "@/components/form/index.vue";
import UFormItem from "@/components/form-item/index.vue";
import conditionPropertyMixin from '../property-condition-dialog/condition-property-minx';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'SlashValueEditor',
  mixins: [conditionPropertyMixin],
  components: {
    UForm,
    UFormItem,
    UButton,
    UInputNumber,
    UInput
  },
  props: {
    rowIndex: {
      type: Number,
      default: 0
    },
    colIndex: {
      type: Number,
      default: 0
    },
    row2Index: {
      type: Number,
      default: 0
    },
    col2Index: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      slashes: []
    };
  },
  computed: {
    ...mapGetters('report', ['getIsCellUpdate']),
    isCellUpdate() {
      return this.getIsCellUpdate;
    },
    cellPosition() {
      return `${this.rowIndex},${this.colIndex}`;
    }
  },
  watch: {
    cellPosition: {
      immediate: true,
      handler() {
        this.loadSlashes();
      }
    },
    isCellUpdate: {
      handler(newVal) {
        if (newVal) {
          this.loadSlashes();
          this.setCellUpdate(false);
        }
      }
    }
  },
  methods: {
    ...mapActions('report', ['setCellUpdate']),
    loadSlashes() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.value && cellDef.value.slashes) {
        this.slashes = deepCopy(cellDef.value.slashes);
      } else {
        this.slashes = [];
      }
    },

    handleSlashChange(index) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef || !cellDef.value || !cellDef.value.slashes) return;

      const newCellDef = deepCopy(cellDef);
      newCellDef.value.slashes[index] = deepCopy(this.slashes[index]);

      setCell(this.rowIndex, this.colIndex, newCellDef);

      const context = getContext();
      if (context) {
        const crossTabWidget = new CrossTabWidget(context, this.rowIndex, this.colIndex, '');
      }

      setDirty();
    },

    handleRefresh() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) return;

      const context = getContext();
      if (context) {
        const crossTabWidget = new CrossTabWidget(context, this.rowIndex, this.colIndex, '');
        crossTabWidget.refreshCell();
        crossTabWidget.doDraw();

        this.loadSlashes();
      }
    }
  }
};
</script>

<style scoped>
.slash-item{
  margin-top: 22px;
}
</style>
