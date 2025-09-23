<template>
  <Card class="w-[400px] h-[400px] p-4 m-2 border border-gray-200 rounded-lg shadow-lg">
    <CardHeader class="flex flex-row p-2 rounded-t-lg">
      <!-- Left Column (Title + Description) -->
      <div class="w-2/3 h-full p-2 flex flex-col justify-center">
        <CardTitle class="text-lg font-bold">Translate Extension 1.2</CardTitle>
        <CardDescription class="text-sm mt-1">
          Use this extension to convert native to any Language
        </CardDescription>
      </div>

      <!-- Right Column (Switch) -->
      <div class="w-1/3 h-full flex justify-center items-center">
        <div class="flex items-center space-x-2">
          <label for="enableSwitch" class="text-sm font-medium text-gray-700">Enable</label>
          <!-- Switch controlled by :model-value and update event -->
          <Switch
            id="enableSwitch"
            :model-value="enable"
            @update:modelValue="val => { enable = val; toggleFeature(val) }"
            class="peer"
          />
        </div>
      </div>
    </CardHeader>

    <CardContent class="p-2">
      <dropdown :items="supportedLanguages" />
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import Switch from "../components/ui/switch/Switch.vue";
import dropdown from "./dropdown.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const enable = ref(false);

const supportedLanguages = reactive([
  { code: "ta", name: "Tamil" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "ne", name: "Nepali" },
  { code: "ur", name: "Urdu" },
  { code: "si", name: "Sinhalese" },
]);

onMounted(() => {
    console.log("onmount working")
  // ask background for saved state
  chrome.runtime.sendMessage({ type: "GET_FEATURE_STATE" }, (resp) => {
    console.log("[popup] Current stored state:", resp);
    if (resp && typeof resp.enable === "boolean") {
      enable.value = resp.enable;
    }
  });
});

const toggleFeature = (value) => {
  console.log("[popup] Toggle clicked:", value);

  // Send to background (not content script)
  chrome.runtime.sendMessage(
    { type: "TOGGLE_FEATURE", enable: value },
    (resp) => {
      if (chrome.runtime.lastError) {
        console.log("⚠️ Error:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ Background updated:", resp);
      }
    }
  );
};


// const toggleFeature = (value) => {
//   console.log("[popup] Toggle clicked:", value);

//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     if (!tabs[0]) return;

//     chrome.tabs.sendMessage(
//       tabs[0].id,
//       { type: "TOGGLE_FEATURE", enable: value },
//       (resp) => {
//         if (chrome.runtime.lastError) {
//           console.log(
//             "⚠️ No response from content script:",
//             chrome.runtime.lastError.message
//           );
//         } else {
//           console.log("✅ Message sent, got response:", resp);
//         }
//       }
//     );
//   });
// };
</script>
