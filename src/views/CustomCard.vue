<template>
    <Card class="w-[500px]">
        <CardHeader>
            <CardTitle>Transulate Extention 1.2</CardTitle>
            <CardDescription>Use this Extention to convert Thanglish to Tamil</CardDescription>
        </CardHeader>
        <CardContent class="break-words">
       <!-- <content/> -->
          <Textarea v-model="data"></Textarea>
        </CardContent>
       
    </Card>
</template>
<script setup>
import { ref, watch, nextTick, reactive, onMounted } from 'vue'
import content from './content.vue';
// import Textarea from '@/components/ui/textarea/Textarea.vue';
import {
    Card, CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

// import googleTransliterate from 'google-input-tool'
// // import { watch } from 'fs';
// const data = ref("")
// let dropdown = reactive([])
// watch(data, (val) => {
//     console.log("value from watcher :", val)
//     Transcript(val)
// })
// const Transcript = (val) => {
//   // get last word efficiently
//   let sourceText = "";
//   for (let i = val?.length - 1; i >= 0; i--) {
//     if (val[i] === " ") break;
//     sourceText = val[i] + sourceText;
//   }
//   console.log("lastword:", sourceText);

//   let inputLanguage = "ta-t-i0-und";
//   let maxResult = 20;
//   let request = new XMLHttpRequest();

// googleTransliterate(request, sourceText, inputLanguage, maxResult).then(
//   function (response) {
//     console.log("Raw Response:", response);

//     // flatten into clean array
//     dropdown.value = parseSuggestions(response);

//     console.log("Suggestions:", dropdown.value);
//   }
// );
// };

// const parseSuggestions = (response) => {
//   if (!Array.isArray(response)) return [];
//   return response.map(item => item[0]);
// };

</script>