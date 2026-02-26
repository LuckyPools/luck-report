<template>
  <label class="u-switch" :class="{ [`u-switch-disabled`]: disabled }">
    <input
      type="checkbox"
      class="u-switch-input"
      :disabled="disabled"
      @click="handleClick"
    />
    <span
      class="u-switch-label"
      :class="{
        [`u-switch-label-selected`]: value === inactiveValue
      }"
      :style="{ color: _inactiveColor }"
      >{{ inactiveText }}</span
    >
    <span
      class="u-switch-dot"
      :class="{
        [`u-switch-dot-selected`]: value === activeValue,
        [`u-switch-dot-disabled`]: disabled
      }"
      :style="{
        [`background-color`]:
          value === activeValue ? _activeColor : _inactiveColor,
        [`border-color`]: value === activeValue ? _activeColor : _inactiveColor
      }"
    ></span>
    <span
      class="u-switch-label"
      :class="{
        [`u-switch-label-selected`]: value == activeValue
      }"
      :style="{ color: _activeColor }"
      >{{ activeText }}</span
    >
  </label>
</template>

<script>
import Emitter from "@/components/mixins/emitter";

export default {
  name: "USwitch",
  mixins: [Emitter],
  data() {
    return {};
  },
  props: {
    value: {
      type: [Boolean, String, Number],
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    activeValue: {
      type: [Boolean, String, Number],
      default: true
    },
    inactiveValue: {
      type: [Boolean, String, Number],
      default: false
    },
    activeText: {
      type: [Boolean, String, Number],
      default: null
    },
    inactiveText: {
      type: [Boolean, String, Number],
      default: null
    },
    activeColor: {
      type: String,
      default: ""
    },
    inactiveColor: {
      type: String,
      default: ""
    }
  },
  computed: {
    _activeColor() {
      return this.value === this.activeValue && this.activeColor
        ? this.activeColor
        : "";
    },
    _inactiveColor() {
      return this.value === this.inactiveValue && this.inactiveColor
        ? this.inactiveColor
        : "";
    }
  },
  methods: {
    handleClick() {
      let newVal =
        this.value === this.activeValue ? this.inactiveValue : this.activeValue;
      this.$emit("input", newVal);
      this.dispatch('UFormItem', 'form-change', newVal)
    }
  }
};
</script>
<style scoped>

.u-switch {
  display: inline-block;
  line-height: 22px
}

.u-switch-input {
  display: none
}

.u-switch-dot {
  display: inline-block;
  vertical-align: top;
  width: 40px;
  height: 22px;
  background-color: #d8d8d8;
  border-radius: 11px;
  box-sizing: border-box;
  border: 1px solid #d8d8d8;
  position: relative;
  cursor: pointer;
  transition: all .3s
}

.u-switch-dot:after {
  content: "";
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 100%;
  transition: all .3s;
  width: 18px;
  height: 18px;
  background-color: #fff
}

.u-switch-dot-selected {
  background-color: #00554a;
  border-color: #00554a
}

.u-switch-dot-selected:after {
  top: 1px;
  left: 18px
}

.u-switch-label {
  vertical-align: top;
  display: inline-block;
  line-height: 22px;
  transition: color .3s
}

.u-switch-label-selected {
  color: #00554a
}

.u-switch-disabled {
  cursor: not-allowed;
  filter: grayscale(70%)
}

.u-switch-dot-disabled {
  cursor: not-allowed
}

</style>
