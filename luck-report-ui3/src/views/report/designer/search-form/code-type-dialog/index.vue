<template>
  <div>
    <u-dialog
      :visible.sync="dialogVisible"
      width="500px"
      @open="onOpen"
      @close="onClose"
    >
      <u-row :gutter="15">
        <u-form
          ref="uForm"
          :model="formData"
          :rules="rules"
          size="medium"
          :label-width="100"
        >
          <u-col :span="24">
            <u-form-item :label="$t('searchForm.generateType')" prop="type">
              <u-radio-group v-model="formData.type" :button="true">
                <u-radio
                  v-for="(item, index) in typeOptions"
                  :key="index"
                  :label="item.value"
                  :disabled="item.disabled"
                >
                  {{ item.label }}
                </u-radio>
              </u-radio-group>
            </u-form-item>
            <u-form-item v-if="showFileName" :label="$t('searchForm.fileName')" prop="fileName">
              <u-input v-model="formData.fileName" :placeholder="$t('searchForm.enterFileName')" clearable />
            </u-form-item>
          </u-col>
        </u-form>
      </u-row>

      <div slot="footer" style="text-align: right">
        <u-button @click="close" type="info" style="margin-right: 10px;">
          {{ $t('searchForm.cancel') }}
        </u-button>
        <u-button type="primary" @click="handleConfirm">
          {{ $t('searchForm.confirm') }}
        </u-button>
      </div>
    </u-dialog>
  </div>
</template>
<script>
import URow from '@/components/row/index.vue'
import UCol from '@/components/col/index.vue'
import UDialog from '@/components/dialog/index.vue'
import UForm from '@/components/form/index.vue'
import UFormItem from '@/components/form-item/index.vue'
import URadioGroup from '@/components/radio-group/index.vue'
import URadio from '@/components/radio/index.vue'
import UInput from '@/components/input/index.vue'
import UButton from '@/components/button/index.vue'

export default {
  components: {
    URow,
    UCol,
    UDialog,
    UForm,
    UFormItem,
    URadioGroup,
    URadio,
    UInput,
    UButton
  },
  inheritAttrs: false,
  props: ['showFileName', 'visible'],
  data() {
    return {
      dialogVisible: false,
      formData: {
        fileName: undefined,
        type: 'file'
      },
      rules: {
        fileName: [{
          required: true,
          message: this.$t('searchForm.enterFileName'),
          trigger: 'blur'
        }],
        type: [{
          required: true,
          message: this.$t('searchForm.generateType') + '不能为空',
          trigger: 'blur'
        }]
      }
    }
  },
  computed: {
    typeOptions() {
      return [{
        label: this.$t('searchForm.page'),
        value: 'file'
      }, {
        label: this.$t('searchForm.dialog'),
        value: 'dialog'
      }]
    }
  },
  watch: {
    visible: {
      handler(newVal) {
        this.dialogVisible = newVal
      },
      immediate: true
    },
    dialogVisible: {
      handler(newVal) {
        this.$emit('update:visible', newVal)
      }
    }
  },
  mounted() {},
  methods: {
    onOpen() {
      if (this.showFileName) {
        this.formData.fileName = `${+new Date()}.vue`
      }
    },
    onClose() {
    },
    close(e) {
      this.dialogVisible = false
    },
    handleConfirm() {
      this.$refs.uForm.validate(valid => {
        if (!valid) return
        this.$emit('confirm', { ...this.formData })
        this.close()
      })
    }
  }
}
</script>
