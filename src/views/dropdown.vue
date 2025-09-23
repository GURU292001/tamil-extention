<template>
  <div class="w-[300px] mx-auto p-4">
    <!-- Autocomplete Input -->
    <input
      v-model="searchQuery"
      id="search"
      type="text"
      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
      placeholder="Type language..."
      @input="filterItems"
    />

    <!-- Autocomplete Suggestions -->
    <ul
      v-if="filteredItems.length > 0 && searchQuery"
      class="mt-2 bg-white shadow-lg border border-gray-300 rounded-md max-h-40 overflow-y-auto"
    >
      <li
        v-for="(item, index) in filteredItems"
        :key="index"
        class="px-4 py-2 hover:bg-blue-100 cursor-pointer"
        @click="selectItem(item)"
      >
        {{ item.name }}
      </li>
    </ul>

    <!-- Selected Item -->
    <div v-if="selectedItem" class="mt-4 text-sm text-gray-700">
      <strong>Selected:</strong> {{ selectedItem.name }} ({{ selectedItem.code }})
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps({
  items: Array,
});

const searchQuery = ref('');
const filteredItems = ref(props.items);
const selectedItem = ref(null);

// Filter items based on search query
const filterItems = () => {
  if (searchQuery.value.trim() === '') {
    filteredItems.value = []; // Clear the list if the search query is empty
  } else {
    filteredItems.value = props.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
};

// Select an item from the list
const selectItem = (item) => {
  selectedItem.value = item; // Store the full item (including code)
  searchQuery.value = item.name; // Populate the input with the selected name
  filteredItems.value = []; // Close the autocomplete list after selection
};
</script>

<style scoped>
/* Tailwind classes for scrollable list when there are more than 4 items */
ul {
  max-height: 160px; /* Limit the height */
  overflow-y: auto;  /* Make it scrollable */
}
</style>
