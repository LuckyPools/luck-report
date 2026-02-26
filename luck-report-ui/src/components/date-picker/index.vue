<template>
  <div class="u-date-picker">
    <date-picker
      ref="datePicker"
      v-model="innerValue"
      v-bind="$attrs"
      v-on="listeners"
      :type="type"
      :range="range"
      :format="format"
      :value-type="valueType"
      :default-value="defaultValue"
      :lang="lang"
      :placeholder="placeholder"
      :editable="editable"
      :clearable="clearable"
      :confirm="confirm"
      :confirm-text="confirmText"
      :multiple="multiple"
      :disabled="disabled"
      :disabled-date="disabledDate"
      :disabled-time="disabledTime"
      :append-to-body="appendToBody"
      :inline="inline"
      :input-class="inputClass"
      :input-attr="inputAttr"
      :open="open"
      :default-panel="defaultPanel"
      :popup-style="popupStyle"
      :popup-class="popupClass"
      :shortcuts="shortcuts"
      :title-format="titleFormat"
      :partial-update="partialUpdate"
      :range-separator="rangeSeparator"
      :show-week-number="showWeekNumber"
      :hour-step="hourStep"
      :minute-step="minuteStep"
      :second-step="secondStep"
      :hour-options="hourOptions"
      :minute-options="minuteOptions"
      :second-options="secondOptions"
      :show-hour="showHour"
      :show-minute="showMinute"
      :show-second="showSecond"
      :use12h="use12h"
      :show-time-header="showTimeHeader"
      :time-title-format="timeTitleFormat"
      :time-picker-options="timePickerOptions"
      :prefix-class="prefixClass"
      :scroll-duration="scrollDuration"
    >
      <template v-if="$slots['icon-calendar']" #icon-calendar>
        <slot name="icon-calendar"></slot>
      </template>
      <template v-if="$slots['icon-clear']" #icon-clear>
        <slot name="icon-clear"></slot>
      </template>
      <template v-if="$slots.input" #input>
        <slot name="input"></slot>
      </template>
      <template v-if="$slots.header" #header>
        <slot name="header"></slot>
      </template>
      <template v-if="$slots.footer" #footer>
        <slot name="footer"></slot>
      </template>
      <template v-if="$slots.sidebar" #sidebar>
        <slot name="sidebar"></slot>
      </template>
    </date-picker>
  </div>
</template>

<script>
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';
import 'vue2-datepicker/locale/zh-cn';
import 'vue2-datepicker/locale/en';
import Emitter from "@/components/mixins/emitter";

export default {
  name: 'UDatePicker',
  components: { DatePicker },
  mixins: [Emitter],
  props: {
    value: {
      type: [Date, String, Number, Array],
      default: null
    },
    type: {
      type: String,
      default: 'date',
      validator: (value) => ['date', 'datetime', 'year', 'month', 'time', 'week'].includes(value)
    },
    range: {
      type: Boolean,
      default: false
    },
    format: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    valueType: {
      type: String,
      default: 'format'
    },
    defaultValue: {
      type: [Date, String, Number],
      default: () => new Date()
    },
    lang: {
      type: Object,
      default: null
    },
    placeholder: {
      type: String,
      default: ''
    },
    editable: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: true
    },
    confirm: {
      type: Boolean,
      default: false
    },
    confirmText: {
      type: String,
      default: 'OK'
    },
    multiple: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    disabledDate: {
      type: Function,
      default: undefined
    },
    disabledTime: {
      type: Function,
      default: undefined
    },
    appendToBody: {
      type: Boolean,
      default: true
    },
    inline: {
      type: Boolean,
      default: false
    },
    inputClass: {
      type: String,
      default: 'mx-input'
    },
    inputAttr: {
      type: Object,
      default: () => ({})
    },
    open: {
      type: Boolean,
      default: null
    },
    defaultPanel: {
      type: String,
      default: null
    },
    popupStyle: {
      type: Object,
      default: () => ({})
    },
    popupClass: {
      type: String,
      default: ''
    },
    shortcuts: {
      type: Array,
      default: () => []
    },
    titleFormat: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    partialUpdate: {
      type: Boolean,
      default: false
    },
    rangeSeparator: {
      type: String,
      default: ' ~ '
    },
    showWeekNumber: {
      type: Boolean,
      default: false
    },
    hourStep: {
      type: Number,
      default: 1,
      validator: (value) => value >= 1 && value <= 60
    },
    minuteStep: {
      type: Number,
      default: 1,
      validator: (value) => value >= 1 && value <= 60
    },
    secondStep: {
      type: Number,
      default: 1,
      validator: (value) => value >= 1 && value <= 60
    },
    hourOptions: {
      type: Array,
      default: null
    },
    minuteOptions: {
      type: Array,
      default: null
    },
    secondOptions: {
      type: Array,
      default: null
    },
    showHour: {
      type: Boolean,
      default: null
    },
    showMinute: {
      type: Boolean,
      default: null
    },
    showSecond: {
      type: Boolean,
      default: null
    },
    use12h: {
      type: Boolean,
      default: null
    },
    showTimeHeader: {
      type: Boolean,
      default: false
    },
    timeTitleFormat: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    timePickerOptions: {
      type: Object,
      default: null
    },
    prefixClass: {
      type: String,
      default: 'mx'
    },
    scrollDuration: {
      type: Number,
      default: 100
    }
  },
  data() {
    return {
      innerValue: this.value
    };
  },
  computed: {
    listeners() {
      return {
        ...this.$listeners,
        input: this.handleInput,
        change: this.handleChange,
        open: this.handleOpen,
        close: this.handleClose,
        confirm: this.handleConfirm,
        clear: this.handleClear,
        'input-error': this.handleInputError,
        focus: this.handleFocus,
        blur: this.handleBlur,
        pick: this.handlePick,
        'calendar-change': this.handleCalendarChange,
        'panel-change': this.handlePanelChange
      };
    }
  },
  watch: {
    value(newVal) {
      this.innerValue = newVal;
    }
  },
  methods: {
    handleInput(date) {
      this.innerValue = date;
      this.$emit('input', date);
      this.dispatch('UFormItem', 'form.change', date);
    },
    handleChange(date, type) {
      this.$emit('change', date, type);
      this.dispatch('UFormItem', 'form-change', date)
    },
    handleOpen(event) {
      this.$emit('open', event);
    },
    handleClose() {
      this.$emit('close');
    },
    handleConfirm(date) {
      this.$emit('confirm', date);
    },
    handleClear() {
      this.$emit('clear');
    },
    handleInputError(value) {
      this.$emit('input-error', value);
    },
    handleFocus() {
      this.$emit('focus');
    },
    handleBlur() {
      this.$emit('blur');
    },
    handlePick(date) {
      this.$emit('pick', date);
    },
    handleCalendarChange(date, oldDate, type) {
      this.$emit('calendar-change', date, oldDate, type);
    },
    handlePanelChange(type, oldType) {
      this.$emit('panel-change', type, oldType);
    },
    openPopup() {
      if (this.$refs.datePicker) {
        this.$refs.datePicker.openPopup();
      }
    },
    closePopup() {
      if (this.$refs.datePicker) {
        this.$refs.datePicker.closePopup();
      }
    },
    clearDate() {
      if (this.$refs.datePicker) {
        this.$refs.datePicker.clearDate();
      }
    }
  }
};
</script>

<style scoped>
.u-date-picker {
  display: inline-block;
}
</style>
