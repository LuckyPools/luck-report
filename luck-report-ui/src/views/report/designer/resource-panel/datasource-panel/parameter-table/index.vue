<template>
  <div>
    <div class="header-row">
      <div class="text-section">
        {{ $t('dialog.sql.searchParam') }}
        <span class="text-info">{{ $t('dialog.sql.paramDesc') }}</span>
      </div>
      <u-button
          icon="icon-plus-circle"
          @click="addParameter"
      >
        {{ $t('dialog.paramTable.addParam') }}
      </u-button>
    </div>
    <div class="table-wrapper" style="margin-top: 5px">
      <table class="table-container">
        <thead>
        <tr>
          <th><span>{{ $t('dialog.paramTable.paramName') }}</span></th>
          <th><span>{{ $t('dialog.paramTable.paramDatatype') }}</span></th>
          <th><span>{{ $t('dialog.paramTable.defaultValue') }}</span></th>
          <th style="width: 80px;"><span>{{ $t('dialog.paramTable.operator') }}</span></th>
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
    </div>
    <ParameterDialog
      :visible="parameterDialogVisible"
      :edit-data="currentEditData"
      @update:visible="parameterDialogVisible = $event"
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
      currentIndex: -1,
      parameterDialogVisible: false
    };
  },
  methods: {

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
        this.parameterDialogVisible = true;
      },
      editParameter(param, index) {
          this.currentIndex = index;
          this.currentEditData = param;
          this.parameterDialogVisible = true;
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

.table-wrapper{
  height: 116px;
}
</style>
