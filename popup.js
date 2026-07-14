import { textStyles, segmentGraphemes } from "./text-styles.js";

const DEFAULT_TEXT = "Chinh Productivity - Đổi số vận hành 🚀";
const DEFAULT_SIGNATURE = "Chinh Productivity - Chinh tối ưu việc gọn gàng\n#lark #AIAutomation #chuyenDoiSo";
const SIGNATURE_STORAGE_KEY = "contentSignature";
const sourceText = document.querySelector("#sourceText");
const charCount = document.querySelector("#charCount");
const styleList = document.querySelector("#styleList");
const modeSelect = document.querySelector("#modeSelect");
const prefixSelect = document.querySelector("#prefixSelect");
const suffixSelect = document.querySelector("#suffixSelect");
const signatureText = document.querySelector("#signatureText");
const signatureStatus = document.querySelector("#signatureStatus");
const sampleBtn = document.querySelector("#sampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const signatureSampleBtn = document.querySelector("#signatureSampleBtn");
const appendSignatureBtn = document.querySelector("#appendSignatureBtn");
const copySignatureBtn = document.querySelector("#copySignatureBtn");
const copyFirstBtn = document.querySelector("#copyFirstBtn");
const toast = document.querySelector("#toast");

let toastTimer;
let saveSignatureTimer;
let renderedItems = [];

function decorate(text) {
  return `${prefixSelect.value}${text}${suffixSelect.value}`;
}

function getSourceValue() {
  return sourceText.value.trimEnd();
}

function getSignatureValue() {
  return signatureText.value.trim();
}

function render() {
  const value = getSourceValue();
  charCount.textContent = `${segmentGraphemes(sourceText.value).length} ký tự`;

  if (!value) {
    renderedItems = [];
    styleList.innerHTML = '<div class="empty-state">Nhập nội dung để xem preview</div>';
    copyFirstBtn.disabled = true;
    return;
  }

  renderedItems = textStyles.map((style) => ({
    ...style,
    output: decorate(style.transform(value, { mode: modeSelect.value }))
  }));

  copyFirstBtn.disabled = false;
  styleList.replaceChildren(...renderedItems.map(createStyleCard));
}

function updateSignatureStatus(message = "Tự lưu") {
  const count = segmentGraphemes(signatureText.value).length;
  signatureStatus.textContent = count ? `${count} ký tự · ${message}` : message;
}

function getStorageArea() {
  return globalThis.chrome?.storage?.local;
}

function loadSignature() {
  const storageArea = getStorageArea();

  if (!storageArea) {
    return Promise.resolve(localStorage.getItem(SIGNATURE_STORAGE_KEY) ?? DEFAULT_SIGNATURE);
  }

  return new Promise((resolve) => {
    storageArea.get({ [SIGNATURE_STORAGE_KEY]: DEFAULT_SIGNATURE }, (items) => {
      resolve(items[SIGNATURE_STORAGE_KEY] ?? DEFAULT_SIGNATURE);
    });
  });
}

function saveSignature(value) {
  const storageArea = getStorageArea();

  if (!storageArea) {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, value);
    updateSignatureStatus("Đã lưu");
    return;
  }

  storageArea.set({ [SIGNATURE_STORAGE_KEY]: value }, () => {
    updateSignatureStatus(chrome.runtime.lastError ? "Chưa lưu được" : "Đã lưu");
  });
}

function scheduleSaveSignature() {
  updateSignatureStatus("Đang lưu");
  clearTimeout(saveSignatureTimer);
  saveSignatureTimer = setTimeout(() => {
    saveSignature(signatureText.value);
  }, 350);
}

function createStyleCard(style) {
  const card = document.createElement("article");
  card.className = "style-card";

  const meta = document.createElement("div");
  meta.className = "style-meta";

  const name = document.createElement("p");
  name.className = "style-name";
  name.textContent = style.name;

  const preview = document.createElement("p");
  preview.className = "style-preview";
  preview.textContent = style.output;

  const copyButton = document.createElement("button");
  copyButton.className = "copy-button";
  copyButton.type = "button";
  copyButton.dataset.copyId = style.id;
  copyButton.textContent = "Copy";
  copyButton.setAttribute("aria-label", `Copy ${style.name}`);

  meta.append(name, preview);
  card.append(meta, copyButton);
  return card;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied");
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-1000px";
  textArea.style.left = "-1000px";
  document.body.append(textArea);
  textArea.select();

  try {
    const copied = document.execCommand("copy");
    showToast(copied ? "Copied" : "Copy failed");
    return copied;
  } catch {
    showToast("Copy failed");
    return false;
  } finally {
    textArea.remove();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1300);
}

sourceText.addEventListener("input", render);
modeSelect.addEventListener("change", render);
prefixSelect.addEventListener("change", render);
suffixSelect.addEventListener("change", render);

sampleBtn.addEventListener("click", () => {
  sourceText.value = DEFAULT_TEXT;
  sourceText.focus();
  render();
});

clearBtn.addEventListener("click", () => {
  sourceText.value = "";
  sourceText.focus();
  render();
});

signatureText.addEventListener("input", scheduleSaveSignature);

signatureSampleBtn.addEventListener("click", () => {
  signatureText.value = DEFAULT_SIGNATURE;
  signatureText.focus();
  saveSignature(signatureText.value);
});

appendSignatureBtn.addEventListener("click", () => {
  const signature = getSignatureValue();

  if (!signature) {
    signatureText.focus();
    showToast("Chưa có chữ ký");
    return;
  }

  const sourceValue = getSourceValue();
  sourceText.value = sourceValue ? `${sourceValue}\n\n${signature}` : signature;
  sourceText.focus();
  render();
  showToast("Đã thêm chữ ký");
});

copySignatureBtn.addEventListener("click", () => {
  const signature = getSignatureValue();

  if (!signature) {
    signatureText.focus();
    showToast("Chưa có chữ ký");
    return;
  }

  copyText(signature);
});

copyFirstBtn.addEventListener("click", () => {
  if (renderedItems[0]) {
    copyText(renderedItems[0].output);
  }
});

styleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-copy-id]");
  if (!button) {
    return;
  }

  const item = renderedItems.find((style) => style.id === button.dataset.copyId);
  if (item) {
    copyText(item.output);
  }
});

async function init() {
  signatureText.value = await loadSignature();
  updateSignatureStatus();
  render();
}

init();
