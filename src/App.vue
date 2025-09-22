

<template>
    <CustomCard/>
<!-- <content></content> -->
</template>
<script setup>
// import content from './views/content.vue';
import { onMounted } from 'vue';
import CustomCard from './views/CustomCard.vue';
// import axios from 'axios';
// onMounted(()=>{
//   console.log("mounted working")
//   axios.get("http://localhost:20299/ready")
//   .then((resp) => {
//     console.log("response:", resp.data); // prints: hello from ready
//   })
//   .catch((error) => {
//     console.error("error:", error.message);
//   });
// })

</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
