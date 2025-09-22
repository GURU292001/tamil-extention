console.log("✅ Google Input Tool Extension Loaded");

let suggestionDropdown = null;
let suggestionList = [];
let activeSuggestionIndex = 0;
let currentInputField = null;

// --- API call ---
async function fetchTransliteration(word) {
  const url =
    "https://inputtools.google.com/request?itc=ta-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "text=" + encodeURIComponent(word),
    });
    const result = await response.json();
    console.log("word:",word)
    console.log("result[1][0][1]:",result[1][0][1])
    if (result[0] === "SUCCESS") return result[1][0][1];
  } catch (error) {
    console.error("Transliteration failed", error);
  }
  return [];
}

// --- Suggestion box creation ---
function renderSuggestionDropdown() {
  if (!suggestionDropdown) {
    suggestionDropdown = document.createElement("div");
    suggestionDropdown.style.position = "fixed";
    suggestionDropdown.style.background = "#fff";
    suggestionDropdown.style.border = "1px solid #ccc";
    suggestionDropdown.style.borderRadius = "6px";
    suggestionDropdown.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    suggestionDropdown.style.zIndex = "2147483647";
    suggestionDropdown.style.fontFamily = "'Noto Sans Tamil', sans-serif";
    suggestionDropdown.style.fontSize = "14px";
    suggestionDropdown.style.maxHeight = "150px";
    suggestionDropdown.style.overflowY = "auto";
    document.body.appendChild(suggestionDropdown);
  }

  suggestionDropdown.innerHTML = "";
  suggestionList.forEach((suggestion, index) => {
    const option = document.createElement("div");
    option.textContent = suggestion;
    option.style.padding = "4px 8px";
    option.style.cursor = "pointer";
    option.style.background = index === activeSuggestionIndex ? "#eee" : "#fff";

    option.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applySuggestion(suggestion);
    });

    suggestionDropdown.appendChild(option);
  });
}

// --- Hide / show dropdown ---
function hideSuggestionDropdown() {
  if (suggestionDropdown) suggestionDropdown.style.display = "none";
}

function showSuggestionDropdown(x, y) {
  if (!suggestionDropdown) renderSuggestionDropdown();
  suggestionDropdown.style.display = "block";
  suggestionDropdown.style.left = x + "px";
  suggestionDropdown.style.top = y + "px";
}

// --- Helpers ---
// function getInputText(field) {
//   let wholeText =field.tagName === "TEXTAREA" || field.tagName === "INPUT"? field.value:field.innerText;
//    let str= ""
//    for(let i=wholeText.length-1; i>=0; i++){
//     if(wholeText== " "){
//       break
//     }
//     str=wholeText[i]+str
//    }
//    console.log("str :",str)
//   return field.tagName === "TEXTAREA" || field.tagName === "INPUT"
//     ? field.value
//     : field.innerText;
// }

function getInputText(field) {
  let wholeText =
    field.tagName === "TEXTAREA" || field.tagName === "INPUT"
      ? field.value
      : field.innerText;

  let str = "";
  for (let i = wholeText.length - 1; i >= 0; i--) {
    if (wholeText[i] === " ") {
      break;
    }
    str = wholeText[i] + str;
  }

  console.log("lastWord:", str);

  return wholeText;
}

function setInputText(field, text) {
  if (field.tagName === "TEXTAREA" || field.tagName === "INPUT")
    field.value = text;
  else field.innerText = text + " ";
}

function getCaretIndex(field) {
  if (field.selectionStart !== undefined) return field.selectionStart;
  const selection = window.getSelection();
  return selection.focusOffset;
}

function getWordAtCaret(text, caretIndex) {
  let start = caretIndex;
  let end = caretIndex;
  while (start > 0 && !/\s/.test(text[start - 1])) start--;
  while (end < text.length && !/\s/.test(text[end])) end++;
  return { word: text.substring(start, end), start, end };
}

// function replaceWordAtCaret(field, start, end, replacement) {
//   const text = getInputText(field);
//   const updatedText =
//     text.substring(0, start) + replacement+" " + text.substring(end);
//   setInputText(field, updatedText);

//   // Move caret to end of inserted word
//   if (field.selectionStart !== undefined) {
//     field.focus();
//     const caretPosition = start + replacement.length+1;
//     field.setSelectionRange(caretPosition, caretPosition);
//   } else {

//     // For contenteditable
//     const range = document.createRange();
//     const selection = window.getSelection();

//     // Find the text node inside contenteditable
//     const textNode = field.firstChild || field;

//     // Caret should be right after the replacement
//     const caretPosition = start + replacement.length+1;

//     // Place caret at that exact character offset
//     range.setStart(textNode, caretPosition);
//     range.collapse(true);

//     selection.removeAllRanges();
//     selection.addRange(range);
//   }
// }

function replaceWordAtCaret(field, start, end, replacement) {
  const text = getInputText(field);

  // Add replacement + trailing space
  const updatedText =
    text.substring(0, start) + replacement + " " + text.substring(end);
  setInputText(field, updatedText);

  // For input/textarea
  if (field.selectionStart !== undefined) {
    field.focus();
    const caretPosition = start + replacement.length + 1; // +1 for space
    field.setSelectionRange(caretPosition, caretPosition);
  } else {
    // For contenteditable
    const range = document.createRange();
    const selection = window.getSelection();

    const textNode = field.firstChild || field;
    const caretPosition = start + replacement.length + 1; // +1 for space

    range.setStart(textNode, caretPosition);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }
}


// --- Caret coordinates ---
function getCaretCoordinates() {
  let x = 0,
    y = 0;
  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rects = range.getClientRects();
    if (rects.length > 0) {
      const rect = rects[0];
      x = rect.left;
      y = rect.bottom;
    }
  }
  return { x, y };
}

// --- Apply suggestion ---
function applySuggestion(suggestion) {
  if (!currentInputField) return;
  const caretIndex = getCaretIndex(currentInputField);
  const { start, end } = getWordAtCaret(
    getInputText(currentInputField),
    caretIndex
  );
  replaceWordAtCaret(currentInputField, start, end, suggestion);
  hideSuggestionDropdown();
}

// --- Handle input ---
async function handleInput(event) {
  // console.log("event:", event.target);
  currentInputField = event.target;
  const caretIndex = getCaretIndex(currentInputField);
  const { word } = getWordAtCaret(getInputText(currentInputField), caretIndex);

  if (!word) return hideSuggestionDropdown();
  
  suggestionList = await fetchTransliteration(word);
  if (!suggestionList.length) return hideSuggestionDropdown();

  activeSuggestionIndex = 0;
  renderSuggestionDropdown();
  const coords = getCaretCoordinates();
  showSuggestionDropdown(coords.x, coords.y);
}

// --- Handle keyboard navigation ---
function handleKeyDown(event) {
  if (!suggestionDropdown || suggestionDropdown.style.display === "none") {
    if (event.ctrlKey && event.code === "Space") {
      event.preventDefault();
      handleInput({ target: currentInputField });
    }
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestionList.length;
    renderSuggestionDropdown();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeSuggestionIndex =
      (activeSuggestionIndex - 1 + suggestionList.length) %
      suggestionList.length;
    renderSuggestionDropdown();
  } else if (event.key === "Enter" || event.key === " ") {
    console.log("enter clicked");
    event.preventDefault();
    applySuggestion(suggestionList[activeSuggestionIndex]);
  } else if (event.key === "Escape") {
    hideSuggestionDropdown();
  }
}

// --- Attach to inputs/contenteditables ---
document.addEventListener("focusin", (event) => {
  if (
    event.target.tagName === "TEXTAREA" ||
    event.target.tagName === "INPUT" ||
    event.target.getAttribute("contenteditable") === "true"
  ) {
    currentInputField = event.target;
    currentInputField.addEventListener("input", handleInput);
    currentInputField.addEventListener("keydown", handleKeyDown);
  }
});

document.addEventListener("focusout", (event) => {
  if (event.target === currentInputField) {
    hideSuggestionDropdown();
    currentInputField.removeEventListener("input", handleInput);
    currentInputField.removeEventListener("keydown", handleKeyDown);
  }
});

