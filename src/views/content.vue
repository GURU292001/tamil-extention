<template>
  <div class="">
    <!-- Textarea -->
    <textarea ref="textareaRef" v-model="data" class="w-full border rounded-lg p-2" rows="6" @input="Transcript"
      @keydown="handleKeydown" placeholder="Type in English..."></textarea>

    <!-- Suggestion Menu -->
    <div v-if="dropdown.length" class="absolute bg-white border rounded-md shadow-lg z-50 w-48 max-h-35 overflow-y-auto  transliterate-suggestion font-sans"
      :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"  style="font-family: 'Noto Sans Tamil', sans-serif;">
      <ul>
        <li v-for="(item, i) in dropdown" :key="i" class="px-3 py-1 cursor-pointer" :class="{
          'bg-gray-200': i === highlightedIndex, // highlight row
          'hover:bg-gray-100': i !== highlightedIndex
        }" @click="applySuggestion(item, true)">
          {{ i + 1 }}. {{ item }}
        </li>

      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue"
import googleTransliterate from "google-input-tool"

const data = ref("")
const dropdown = ref([])
const textareaRef = ref(null)
const menuPos = ref({ top: 0, left: 0 })
const manualSelection = ref(false) // to track user selection


// --- Get word at caret (supports middle of text) ---
const getWordAtCaret = (text, caretPos) => {
  let start = caretPos
  let end = caretPos

  while (start > 0 && text[start - 1] !== " " && text[start - 1] !== "\n") start--
  while (end < text.length && text[end] !== " " && text[end] !== "\n") end++

  return {
    word: text.substring(start, end),
    start,
    end,
  }
}

// --- Caret coordinates ---
const getCaretCoordinates = (el, pos) => {
  const div = document.createElement("div")
  const style = window.getComputedStyle(el)

  const props = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "whiteSpace",
    "wordWrap",
    "lineHeight",
    "padding",
  ]
  props.forEach((prop) => {
    div.style[prop] = style[prop]
  })

  div.style.position = "absolute"
  div.style.visibility = "hidden"
  div.style.whiteSpace = "pre-wrap"
  div.style.wordWrap = "break-word"
  div.style.width = el.offsetWidth + "px"

  div.textContent = el.value.substring(0, pos)

  const span = document.createElement("span")
  span.textContent = el.value.substring(pos) || "."
  div.appendChild(span)

  document.body.appendChild(div)
  const { offsetLeft, offsetTop } = span
  document.body.removeChild(div)

  const rect = el.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY + offsetTop + 20,
    left: rect.left + window.scrollX + offsetLeft,
  }
}

// --- Transliterate ---
const Transcript = async (e) => {
  const caretPos = e.target.selectionStart
  const { word } = getWordAtCaret(data.value, caretPos)

  if (!word) {
    dropdown.value = []
    return
  }

  let inputLanguage = "ta-t-i0-und"
  let maxResult = 6
  let request = new XMLHttpRequest()

  googleTransliterate(request, word, inputLanguage, maxResult).then(
    async (response) => {
      dropdown.value = response.map((item) => item[0])
      // 🔹 reset highlighted index here
      highlightedIndex.value = dropdown.value.length > 0 ? 0 : -1

      await nextTick()
      menuPos.value = getCaretCoordinates(textareaRef.value, caretPos)
    }
  )
}

const applySuggestion = (suggestion, fromClick = false) => {
  const el = textareaRef.value
  const caretPos = el.selectionStart
  const { start, end } = getWordAtCaret(data.value, caretPos)

  // replace current word with suggestion
  data.value =
    data.value.substring(0, start) + " " +
    suggestion +
    data.value.substring(end)

  dropdown.value = []
  manualSelection.value = fromClick

  // restore focus & set caret position after inserted word
  nextTick(() => {
    el.focus()
    // el.setSelectionRange(start + suggestion.length, start + suggestion.length)
  })
}

const highlightedIndex = ref(-1)
const handleKeydown = (e) => {
  // 🔹 Handle Enter key
  // if (e.key === "Enter") {
  //   if (dropdown.value && dropdown.value.length > 0) {
  //     e.preventDefault()
  //     const chosen =
  //       highlightedIndex.value >= 0
  //         ? dropdown.value[highlightedIndex.value]
  //         : dropdown.value[0]

  //     applySuggestion(chosen)
  //   }
  //   return
  // }

  if (e.key === "Enter") {
  if (dropdown.value.length > 0) {
    e.preventDefault()
    const chosen = highlightedIndex.value >= 0
      ? dropdown.value[highlightedIndex.value]
      : dropdown.value[0]
    applySuggestion(chosen)
  } else {
    // allow normal newline
  }
  return
}


  // 🔹 Handle Space key
  if (e.key === " " && dropdown.value.length > 0) {
    if (!manualSelection.value) {
      e.preventDefault()
      applySuggestion(dropdown.value[0])
      data.value += " "
    }
    manualSelection.value = false
  }


if (e.ctrlKey && e.code === "Space") {
  e.preventDefault()
  Transcript({ target: textareaRef.value }) // force show suggestions
}

  // 🔹 Arrow keys navigation
  if (dropdown.value.length > 0) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      highlightedIndex.value =
        (highlightedIndex.value + 1) % dropdown.value.length
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      highlightedIndex.value =
        (highlightedIndex.value - 1 + dropdown.value.length) %
        dropdown.value.length
    }
  }
}



</script>
