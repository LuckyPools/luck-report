<template>
  <div class="dots">
    <div></div>
    <div></div>
    <div></div>
  </div>
</template>

<style scoped>
.dots {
  width: 1.5em;
  height: 1.5em;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
}

.dots div {
  width: 0.4em;
  height: 0.4em;
  border-radius: 50%;
  background-color: #333;
  animation: dots-fade 0.8s ease-in-out alternate infinite;
}

.dots div:nth-of-type(1) {
  animation-delay: -0.4s;
}

.dots div:nth-of-type(2) {
  animation-delay: -0.2s;
}

@keyframes dots-fade {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
