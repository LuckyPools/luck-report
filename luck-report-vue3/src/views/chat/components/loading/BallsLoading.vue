<template>
  <div class="balls">
    <div></div>
    <div></div>
    <div></div>
  </div>
</template>

<style scoped>
.balls {
  width: 24px;
  height: 24px;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
}

.balls div {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #333;
  transform: translateY(-100%);
  animation: balls-wave 0.8s ease-in-out alternate infinite;
}

.balls div:nth-of-type(1) {
  animation-delay: -0.4s;
}

.balls div:nth-of-type(2) {
  animation-delay: -0.2s;
}

@keyframes balls-wave {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(100%);
  }
}
</style>
