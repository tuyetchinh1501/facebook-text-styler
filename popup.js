import { textStyles, segmentGraphemes } from "./text-styles.js";

const DEFAULT_TEXT = "Tuyết Chinh - Tinh gọn quy trình 🚀";
const DEFAULT_SIGNATURE = "Tuyết Chinh - Tinh gọn quy trình\n#Lark #AI #Automation #tuyetchinh.com";
const DEFAULT_MONEY = "1250000";
const SIGNATURE_STORAGE_KEY = "contentSignature";
const DIGIT_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const GROUP_UNITS = ["", "nghìn", "triệu"];
const sourceText = document.querySelector("#sourceText");
const charCount = document.querySelector("#charCount");
const styleList = document.querySelector("#styleList");
const modeSelect = document.querySelector("#modeSelect");
const prefixSelect = document.querySelector("#prefixSelect");
const suffixSelect = document.querySelector("#suffixSelect");
const signatureText = document.querySelector("#signatureText");
const signatureStatus = document.querySelector("#signatureStatus");
const moneyInput = document.querySelector("#moneyInput");
const moneyStatus = document.querySelector("#moneyStatus");
const moneyOutput = document.querySelector("#moneyOutput");
const sampleBtn = document.querySelector("#sampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const signatureSampleBtn = document.querySelector("#signatureSampleBtn");
const appendSignatureBtn = document.querySelector("#appendSignatureBtn");
const copySignatureBtn = document.querySelector("#copySignatureBtn");
const moneySampleBtn = document.querySelector("#moneySampleBtn");
const appendMoneyBtn = document.querySelector("#appendMoneyBtn");
const copyMoneyBtn = document.querySelector("#copyMoneyBtn");
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

function getMoneyValue() {
  return moneyOutput.dataset.value ?? "";
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

function renderMoney() {
  const amount = parseMoneyInput(moneyInput.value);

  if (!moneyInput.value.trim()) {
    setMoneyOutput("", "Nhập số tiền để chuyển thành chữ", "VND");
    return;
  }

  if (!amount) {
    setMoneyOutput("", "Chỉ hỗ trợ số nguyên dương", "Chưa hợp lệ");
    return;
  }

  const words = `${capitalizeFirst(numberToVietnameseWords(amount))} đồng`;
  setMoneyOutput(words, words, formatMoney(amount));
}

function setMoneyOutput(value, text, status) {
  moneyOutput.dataset.value = value;
  moneyOutput.textContent = text;
  moneyOutput.classList.toggle("is-empty", !value);
  moneyStatus.textContent = status;
  copyMoneyBtn.disabled = !value;
  appendMoneyBtn.disabled = !value;
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

function parseMoneyInput(value) {
  const digits = value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  return digits || "";
}

function formatMoney(value) {
  return `${value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`;
}

function numberToVietnameseWords(value) {
  if (value === "0") {
    return DIGIT_WORDS[0];
  }

  const groups = [];
  for (let index = value.length; index > 0; index -= 3) {
    groups.unshift(value.slice(Math.max(0, index - 3), index));
  }

  const words = [];
  groups.forEach((group, index) => {
    const groupNumber = Number(group);
    if (!groupNumber) {
      return;
    }

    const unitIndex = groups.length - index - 1;
    const shouldReadFull = words.length > 0 && group.length === 3;
    const groupWords = readThreeDigitGroup(groupNumber, shouldReadFull);
    const unit = getGroupUnit(unitIndex);
    words.push(unit ? `${groupWords} ${unit}` : groupWords);
  });

  return words.join(" ").replace(/\s+/g, " ").trim();
}

function getGroupUnit(index) {
  const baseUnit = GROUP_UNITS[index % GROUP_UNITS.length];
  const billionLevel = Math.floor(index / GROUP_UNITS.length);
  return [baseUnit, ...Array(billionLevel).fill("tỷ")].filter(Boolean).join(" ");
}

function readThreeDigitGroup(number, readFull) {
  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;
  const words = [];

  if (hundreds > 0 || readFull) {
    words.push(DIGIT_WORDS[hundreds], "trăm");
  }

  if (tens === 0) {
    if (ones > 0) {
      if (hundreds > 0 || readFull) {
        words.push("lẻ");
      }
      words.push(DIGIT_WORDS[ones]);
    }
    return words.join(" ");
  }

  if (tens === 1) {
    words.push("mười");
  } else {
    words.push(DIGIT_WORDS[tens], "mươi");
  }

  if (ones === 1 && tens > 1) {
    words.push("mốt");
  } else if (ones === 5) {
    words.push("lăm");
  } else if (ones > 0) {
    words.push(DIGIT_WORDS[ones]);
  }

  return words.join(" ");
}

function capitalizeFirst(text) {
  return text ? `${text[0].toLocaleUpperCase("vi")}${text.slice(1)}` : "";
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
moneyInput.addEventListener("input", renderMoney);
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

moneySampleBtn.addEventListener("click", () => {
  moneyInput.value = DEFAULT_MONEY;
  moneyInput.focus();
  renderMoney();
});

appendMoneyBtn.addEventListener("click", () => {
  const money = getMoneyValue();

  if (!money) {
    moneyInput.focus();
    showToast("Chưa có số tiền");
    return;
  }

  const sourceValue = getSourceValue();
  sourceText.value = sourceValue ? `${sourceValue}\n${money}` : money;
  sourceText.focus();
  render();
  showToast("Đã thêm số tiền");
});

copyMoneyBtn.addEventListener("click", () => {
  const money = getMoneyValue();

  if (!money) {
    moneyInput.focus();
    showToast("Chưa có số tiền");
    return;
  }

  copyText(money);
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
  renderMoney();
  render();
}

init();
