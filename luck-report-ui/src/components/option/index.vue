<template>
  <div
      v-show="visible"
      class="u-option"
      :class="{
      'u-option-selected': selected,
      'u-option-disabled': disabled,
      'u-option-choose': choose,
      'u-option-multi': multi
    }"
      @click="onClick"
  >
    <slot>
      {{ label }}
      <i class="iconfont icon-checked u-option-icon" v-if="choose" />
    </slot>
  </div>
</template>

<script>
import Emitter from "../mixins/emitter";
export default {
  name: 'UOption',
  data() {
    return {
      visible: true,
      multi: false,
      selected: false,
      choose: false
    };
  },
  props: {
    value: {},
    label: {},
    disabled: {
      type: Boolean,
      default: false
    }
  },
  mixins: [Emitter],
  mounted() {
    this.dispatch("USelect", "on-option-add", this);
  },
  methods: {
    onClick() {
      if (this.disabled) return;
      this.dispatch("USelect", "on-option-select", this);
    }
  },
  beforeDestroy() {
    this.dispatch("USelect", "on-option-remove", this);
  }
};
</script>

<style scoped>

.u-option {
  line-height: 32px;
  padding: 0 15px 0 15px;
  font-size: 13px;
  cursor: pointer;
  position: relative
}

.u-option:hover {
  background-color: #f5f7fa
}

.u-option-selected {
  font-weight: 700;
  color: #00554a;
  background-color: #f5f7fa
}

.u-option-disabled {
  cursor: not-allowed;
  color: #c0c4cc
}

.u-option-choose {
  color: #00554a
}

.u-option-multi {
  padding-right: 40px
}

.u-option-icon {
  width: 32px;
  height: 32px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px
}

</style>
