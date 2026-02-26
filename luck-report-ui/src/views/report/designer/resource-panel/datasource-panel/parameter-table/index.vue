<template>
  <div class="parameter-table-container">
    <div class="header-row">
      <div class="text-section">
        {{ $t('dialog.sql.fiterParam') }}
        <span class="text-info">{{ $t('dialog.sql.paramDesc') }}</span>
      </div>
      <u-button
          icon="icon-plus-circle"
          @click="addParameter"
      >
        {{ $t('dialog.paramTable.addParam') }}
      </u-button>
    </div>
    <table class="data-table" style="margin-top: 5px">
      <thead>
        <tr style="background: #f4f4f4;height: 30px;">
          <td><span>{{ $t('dialog.paramTable.paramName') }}</span></td>
          <td><span>{{ $t('dialog.paramTable.paramDatatype') }}</span></td>
          <td><span>{{ $t('dialog.paramTable.defaultValue') }}</span></td>
          <td style="width: 80px;"><span>{{ $t('dialog.paramTable.operator') }}</span></td>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(param, index) in data"
          :key="index"
          style="height: 35px;"
        >
          <td><span>{{ param.name }}</span></td>
          <td><span>{{ param.type }}</span></td>
          <td><span>{{ param.defaultValue }}</span></td>
          <td>
            <u-button
                type="info"
                icon="icon-edit"
                :title="$t('dialog.paramTable.editParam')"
                @click.prevent="editParameter(param, index)"
                style="border: none">
            </u-button>
            <u-button
                type="info"
                icon="icon-delete"
                :title="$t('dialog.paramTable.delParam')"
                @click.prevent="removeParameter(param, index)"
                style="border: none;color: red">
            </u-button>
          </td>
        </tr>
      </tbody>
    </table>
    <ParameterDialog
      ref="parameterDialog"
      :edit-data="currentEditData"
      @save="handleDialogSave"
    />
  </div>
</template>

<script>
import ParameterDialog from '../parameter-dialog/index.vue';
import UButton from "@/components/button/index.vue";
import {showAlert} from "@/utils/comnon";

export default {
  name: 'ParameterTable',
  components: {UButton, ParameterDialog},
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentEditData: null,
      currentIndex: -1
    };
  },
  watch: {
    data: {
      handler(newData) {
        // 数据变化时自动响应
      },
      deep: true
    }
  },
  methods: {
      refreshData() {
        // 触发数据更新事件
        this.$emit('update');
      },
      handleDialogSave(name, type, defaultValue) {
        if ((this.currentIndex === -1 || this.data[this.currentIndex].name !== name) &&
            this.data.some(param => param.name === name)) {
          showAlert(`参数[${name}]已存在`);
          return;
        }

        if (this.currentIndex === -1) {
          const newParam = { name, type, defaultValue };
          this.$emit('add-parameter', newParam);
        } else {
          this.$emit('edit-parameter', this.currentIndex, { name, type, defaultValue });
        }
        this.$emit('update');
      },
      addParameter() {
        this.currentIndex = -1;
        this.currentEditData = null;
        this.$refs.parameterDialog.show();
      },
      editParameter(param, index) {
          this.currentIndex = index;
          this.currentEditData = param;
          this.$refs.parameterDialog.show();
      },
      removeParameter(param, index) {
        this.$emit('remove-parameter', index);
        this.$emit('update');
      }
  }
};
</script>

<style scoped>

.header-row{
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-section{
  flex: 1;
}
</style>
