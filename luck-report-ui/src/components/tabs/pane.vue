<template>
  <div class="pane" v-show="visible">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'UTabPane',
  props: {
    label: { type: String, required: true },
    index: { type: String }
  },
  data () {
    return {
      visible: false
    }
  }
}
</script>
<style scoped>

</style>
