<template>
  <transition
    @enter="enter"
    @after-enter="afterEnter"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <slot></slot>
  </transition>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    enter(el) {
      el.style.height = "auto";
      let endWidth = window.getComputedStyle(el).height;
      el.style.height = "0px";
      el.offsetHeight;

      el.style.height = endWidth;
    },
    afterEnter(el) {
      el.style.height = null;
    },
    leave(el) {
      el.style.height = window.getComputedStyle(el).height;
      el.offsetHeight; // force repaint
      el.style.height = "0px";
    },
    afterLeave(el) {
      el.style.height = null;
    }
  }
};
</script>
