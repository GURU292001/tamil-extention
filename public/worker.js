console.log("✅ Google Input Tool Extension Loaded");
//  toggle was not remove when disable the "featureEnable"
let suggestionDropdown = null;
let suggestionList = [];
let activeSuggestionIndex = 0;
let currentInputField = null;
let active = false;

// GET_FEATURE_STATE - update the toggle state from the localstorage (Refresh)
// TOGGLE_FEATURE - update the toggle state at runtime (from the pop.html)

console.log("👋 content.js injected");
let featureEnabled = false;
chrome.storage.local.get("featureEnabled", (data) => {
  if (typeof data.featureEnabled === "boolean") {
    featureEnabled = data.featureEnabled;
    console.log("🔄 Restored featureEnabled:", featureEnabled);
  }
});

// worker.js (content script)

let observer = null;

// Inject toggle into a field
function addToggleToField(field) {
  if (field.dataset.toggleAttached) return;
  field.dataset.toggleAttached = "true";

  field.style.margin = "0";

  // Make wrapper for positioning
  const wrapper = document.createElement("span");
  wrapper.style.position = "relative";
  wrapper.style.display = "inline-flex";
  wrapper.style.alignItems = "center";
  wrapper.style.width = field.offsetWidth + "px";
  wrapper.style.height = field.offsetHeight + "px";
  wrapper.id = "data-toggle-attached"
  // Wrap the field
  field.parentNode.insertBefore(wrapper, field);
  wrapper.appendChild(field);

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "OFF";
  toggleBtn.style.position = "relative";
  toggleBtn.style.right = "4px";
  toggleBtn.style.bottom = "4px";
  toggleBtn.style.padding = "2px 6px";
  toggleBtn.style.fontSize = "12px";
  toggleBtn.style.cursor = "pointer";
  toggleBtn.style.zIndex = "9999";
  toggleBtn.style.border = "none";
  toggleBtn.style.borderRadius = "3px";
  toggleBtn.style.color = "#fff";
  toggleBtn.style.background = "#f44336";

  // Local active state
  toggleBtn.addEventListener("click", () => {
    active = !active;
    toggleBtn.textContent = active ? "ON" : "OFF";
    toggleBtn.style.background = active ? "#4caf50" : "#f44336";
    console.log("📩 Toggle clicked for:", field, "State:", active);

  });

  wrapper.appendChild(toggleBtn);
}

// Start observing + injecting
function startFeature() {
  console.log("✅ Feature enabled in worker.js");
  document
    .querySelectorAll("input[type='text'], textarea, [contenteditable='true']")
    .forEach(addToggleToField);
  // document.querySelectorAll("input[type='text'], textarea, [contenteditable='true']").forEach(addToggleToField);

  observer = new MutationObserver((mutations) => {
    if (!featureEnabled) return;
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (
            node.matches(
              "input[type='text'],textarea, [contenteditable='true']"
            )
          ) {
            addToggleToField(node);
          }

          node
            .querySelectorAll?.(
              " input[type='text'],textarea, [contenteditable='true']"
            )
            .forEach(addToggleToField);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Stop observing + clean up
function stopFeature() {
  console.log("⛔ Feature disabled in worker.js");
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  // Remove wrappers & buttons
  document.querySelectorAll("[data-toggle-attached]").forEach((field) => {
    const wrapper = field.parentNode;
    if (
      wrapper &&
      wrapper.tagName === "SPAN" &&
      wrapper.style.position === "relative"
    ) {
      wrapper.parentNode.insertBefore(field, wrapper);
      wrapper.remove();
    }
    field.removeAttribute("data-toggle-attached");
  });
}

// On load, sync with background state
chrome.runtime.sendMessage({ type: "GET_FEATURE_STATE" }, (resp) => {
  if (resp && typeof resp.enable === "boolean") {
    featureEnabled = resp.enable;
    if (!featureEnabled) {
      stopFeature();
    }
    console.log("done by GET_FEATURE_STATE");
    // if (featureEnabled) startFeature();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_FEATURE") {
    featureEnabled = message.enable;
    console.log("📩 Content script updated, featureEnabled:", featureEnabled);
    console.log("done by TOGGLE_FEATURE");
    if (!featureEnabled) {
      stopFeature();
      active = false;
    }
    sendResponse({ status: "ok" });
  } else if (message.type === "GET_FEATURE_STATE") {
    console.log("GET_FEATURE_STATE workd :", message.enable);
    if (!featureEnabled) {
      active = false;
      stopFeature();
    }
    sendResponse({ enable: featureEnabled });
  }
  console.log("send Response from the worker.js");
  return true;
});

// Since we're already in the page as a content script, directly apply the font
(function injectTamilFont() {
  // Check if already applied
  if (document.querySelector("#tamil-font-injected")) {
    console.log("Tamil font already injected");
    return;
  }

  // Marker
  const marker = document.createElement("meta");
  marker.id = "tamil-font-injected";
  document.head.appendChild(marker);

  // Load Google Font
  const link = document.createElement("link");
  link.href =
    "https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@100;200;300;400;500;600;700;800;900&display=swap";
  link.rel = "stylesheet";
  link.onload = () => console.log("Noto Sans Tamil loaded");
  document.head.appendChild(link);

  // Scoped style (only for `.tamil-clone` elements)
  const style = document.createElement("style");
  style.textContent = `
    .tamil-font {
      font-family: 'Noto Sans Tamil', 'Latha', 'Vijaya', sans-serif !important;
    }
  `;
  document.head.appendChild(style);

  console.log("Tamil font available. Use .tamil-clone on your elements.");
})();

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

    if (result[0] === "SUCCESS") {
      let list = [];

      // Safe spreading (Google gives [ [typedWord, [suggestions...] ] ])
      if (result[1] && result[1][0]) {
        if (Array.isArray(result[1][0][1])) {
          list.push(...result[1][0][1]); // suggestions
        }
        if (Array.isArray(result[1][0][0])) {
          list.push(...result[1][0][0]); // original word(s)
        } else {
          list.push(result[1][0][0]); // single word
        }
      }

      console.log("list:", list);
      console.log("word:", word);
      return list;
    }
  } catch (error) {
    console.error("Transliteration failed", error);
  }

  return [word]; // fallback
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
      console.log("mouseDown Suggestion:", suggestion);
      applySuggestionUniversal(suggestion);
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

  // console.log("lastWord:", str);

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
function getWordAtCaret() {
  const selection = window.getSelection();

  if (!selection.rangeCount)
    return { word: "", start: 0, end: 0, container: null };

  const range = selection.getRangeAt(0);
  const container = range.startContainer;

  // Text node only
  if (!container || container.nodeType !== Node.TEXT_NODE) {
    return { word: "", start: 0, end: 0, container: null };
  }

  const offset = range.startOffset;
  const text = container.textContent;

  // Left boundary: find last space before caret
  let start = offset;
  while (start > 0 && !/\s/.test(text[start - 1])) start--;

  // Right boundary: find first space after caret
  let end = offset;
  while (end < text.length && !/\s/.test(text[end])) end++;

  const word = text.slice(start, end);
  console.log("word, start, end, container", word, start, end, container);
  return { word, start, end, container };
}

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
function applySuggestionUniversal(suggestion, field = currentInputField) {
  console.log("apply suggestion universel working");
  if (!field) return;

  // --- Textarea / Input ---
  if (field.tagName === "TEXTAREA" || field.tagName === "INPUT") {
    const caretIndex = field.selectionStart;
    const text = field.value;

    // Find current word boundaries
    const left = text.slice(0, caretIndex).search(/\S+$/);
    const right = text.slice(caretIndex).search(/\s/);

    const start = left === -1 ? caretIndex : left;
    const end = right === -1 ? text.length : caretIndex + right;

    // Replace word and add space
    const updatedText =
      text.substring(0, start) + suggestion + " " + text.substring(end);
    console.log("textarea/input- updatedText:", updatedText);
    field.value = updatedText;

    // Move caret after the inserted word + space
    const caretPosition = start + suggestion.length + 1;
    field.focus();
    field.setSelectionRange(caretPosition, caretPosition);

    hideSuggestionDropdown();
    return;
  }

  // --- Contenteditable ---
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const { word, start, end, container } = getWordAtCaret();
  if (!word || !container) return;

  const text = container.textContent;
  const textLength = text.length;

  // Detect special characters at the end
  // const specialCharMatch = word.match(/[.,!?;:/\\]+$/);
  const specialCharMatch = word.match(/[,/\\]+$/);
  const specialChar = specialCharMatch ? specialCharMatch[0] : "";

  // Adjust replacement end
  // const cleanEnd =  end;
  // const cleanEnd = specialChar ? end - specialChar.length : end;
  const safeStart = Math.max(0, Math.min(start, textLength));
  const safeEnd = Math.max(0, Math.min(end, textLength));

  range.setStart(container, safeStart);
  range.setEnd(container, safeEnd);
  range.deleteContents();

  // Insert Tamil word + punctuation + space
  const frag = document.createDocumentFragment();
  console.log("frag:", frag);
  console.log("specialChar:", specialChar);
  console.log("suggestion:", suggestion);
  // frag.appendChild(document.createTextNode(suggestion));

  // const suggestionSpan = document.createElement("span");
  // suggestionSpan.textContent = suggestion;
  // suggestionSpan.classList.add("tamil-font");
  // frag.appendChild(suggestionSpan);

  // const frag = document.createDocumentFragment();
  const isTamil = /[\u0B80-\u0BFF]/.test(suggestion); // Tamil char check

  if (isTamil) {
    const suggestionSpan = document.createElement("span");
    suggestionSpan.textContent = suggestion;
    suggestionSpan.classList.add("tamil-font"); // only Tamil gets styled
    frag.appendChild(suggestionSpan);
  } else {
    frag.appendChild(document.createTextNode(suggestion)); // plain English
  }

  if (specialChar) frag.appendChild(document.createTextNode(specialChar));
  // console.log("`safeEnd`:",safeEnd)
  const spaceNode = document.createTextNode("\u00A0");
  frag.appendChild(spaceNode);
  console.log("frag:", frag);
  // console.log("suggestionSpan:",suggestionSpan)
  range.insertNode(frag);

  // Move caret after the space
  const newRange = document.createRange();
  newRange.setStartAfter(spaceNode);
  newRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(newRange);

  hideSuggestionDropdown();
}

// --- Handle input ---
async function handleInput(event) {
  currentInputField = event.target;

  const { word } = getWordAtCaret();
  console.log("caret word:", word);

  if (!word) return hideSuggestionDropdown();

  suggestionList = await fetchTransliteration(word);
  if (!suggestionList.length) return hideSuggestionDropdown();

  activeSuggestionIndex = 0;
  renderSuggestionDropdown();

  // Position dropdown near caret
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
    console.log("activeSuggestionIndex:", activeSuggestionIndex);
    console.log("suggestionList:", suggestionList);
    console.log(
      "enter clicked suggestionList[activeSuggestionIndex]:",
      suggestionList[activeSuggestionIndex]
    );
    console.log("length:", suggestionList.length);
    console.log("activeSuggestionIndex:", activeSuggestionIndex);
    event.preventDefault();

    applySuggestionUniversal(suggestionList[activeSuggestionIndex]);
  } else if (event.key === "Escape") {
    hideSuggestionDropdown();
  }
}

// --- Attach to inputs/contenteditables ---
document.addEventListener("focusin", (event) => {
  console.log("focusIn:", active, featureEnabled);
  if (!featureEnabled) return;
  if (featureEnabled) {
    // focus in start showing
    startFeature();
  }
  if (!active) return;
  if (
    event.target.tagName === "TEXTAREA" ||
    event.target.tagName === "INPUT" ||
    event.target.getAttribute("contenteditable") === "true"
  ) {
    currentInputField = event.target;
    console.log("focusin activated");
    currentInputField.addEventListener("input", handleInput);
    currentInputField.addEventListener("keydown", handleKeyDown);
  }
});

document.addEventListener("focusout", (event) => {
  console.log("focusout:", active, featureEnabled);
  if (!active) return;
  if (event.target === currentInputField) {
    hideSuggestionDropdown();
    currentInputField.removeEventListener("input", handleInput);
    currentInputField.removeEventListener("keydown", handleKeyDown);
  }
});
// --------------------------------------------
