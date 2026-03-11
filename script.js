const API_BASE = "https://api.alquran.cloud/v1";

const searchInput = document.getElementById("searchInput");
const surahSelect = document.getElementById("surahSelect");
const juzSelect = document.getElementById("juzSelect");
const hizbSelect = document.getElementById("hizbSelect");
const surahList = document.getElementById("surahList");
const readerTitle = document.getElementById("readerTitle");
const readerMeta = document.getElementById("readerMeta");
const readerKicker = document.getElementById("readerKicker");
const contentArea = document.getElementById("contentArea");
const bismillah = document.getElementById("bismillah");
const loadingBox = document.getElementById("loadingBox");
const themeBtn = document.getElementById("themeBtn");
const fontPlusBtn = document.getElementById("fontPlusBtn");
const fontMinusBtn = document.getElementById("fontMinusBtn");
const loadSurahBtn = document.getElementById("loadSurahBtn");
const loadJuzBtn = document.getElementById("loadJuzBtn");
const loadHizbBtn = document.getElementById("loadHizbBtn");

let surahs = [];
let currentFontSize = 2;

function showLoading(show = true) {
  loadingBox.classList.toggle("d-none", !show);
}

function normalizeArabic(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ٱ/g, "ا")
    .replace(/\s+/g, " ");
}

function cleanSearchQuery(query) {
  let q = normalizeArabic(query);

  const removableTerms = [
    "سوره",
    "السوره",
    "سورة",
    "السورة",
    "surah",
    "sura",
    "sorat",
    "soorat",
    "sourat",
    "sourah",
    "asoorat",
    "assorat",
    "sorat al",
    "surat",
    "surat al",
    "chapter"
  ];

  removableTerms.forEach(term => {
    q = q.replaceAll(normalizeArabic(term), "");
  });

  return q.trim();
}

function saveTheme() {
  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("quran-theme", isLight ? "light" : "dark");
}

function loadTheme() {
  const saved = localStorage.getItem("quran-theme");
  if (saved === "light") {
    document.body.classList.add("light-mode");
  }
}

function setReaderHeader(title, meta, kicker = "السورة الحالية") {
  readerTitle.textContent = title;
  readerMeta.textContent = meta;
  readerKicker.textContent = kicker;
}

function renderAyahs(ayahs) {
  contentArea.innerHTML = ayahs
    .map((ayah) => {
      return `
        <span class="ayah-inline">${ayah.text}</span>
        <span class="ayah-number">${ayah.numberInSurah || ayah.number || ""}</span>
      `;
    })
    .join(" ");
}

function renderMixedAyahs(ayahs) {
  contentArea.innerHTML = ayahs
    .map((ayah, index) => {
      const ayahNumber = ayah.numberInSurah || ayah.number || index + 1;
      return `
        <span class="ayah-inline">${ayah.text}</span>
        <span class="ayah-number">${ayahNumber}</span>
      `;
    })
    .join(" ");
}

function setBismillahVisibility(show) {
  bismillah.style.display = show ? "block" : "none";
}

function buildSurahOption(surah) {
  return `<option value="${surah.number}">${surah.number} - ${surah.name}</option>`;
}

function renderSurahSelect(data) {
  surahSelect.innerHTML = data.map(buildSurahOption).join("");
}

function renderSurahList(data) {
  surahList.innerHTML = data
    .map((surah) => {
      return `
        <div class="surah-item" data-surah-number="${surah.number}">
          <div class="surah-name">${surah.number}. ${surah.name}</div>
          <div class="surah-meta">
            ${surah.englishName} • ${surah.numberOfAyahs} آيات
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".surah-item").forEach((item) => {
    item.addEventListener("click", () => {
      const number = item.getAttribute("data-surah-number");
      surahSelect.value = number;
      loadSurah(number);
      setActiveSurahItem(number);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function setActiveSurahItem(number) {
  document.querySelectorAll(".surah-item").forEach((item) => {
    item.classList.toggle(
      "active",
      item.getAttribute("data-surah-number") === String(number)
    );
  });
}

function initJuzSelect() {
  let options = "";
  for (let i = 1; i <= 30; i++) {
    options += `<option value="${i}">الجزء ${i}</option>`;
  }
  juzSelect.innerHTML = options;
}

function initHizbSelect() {
  let options = "";
  for (let i = 1; i <= 60; i++) {
    options += `<option value="${i}">الحزب ${i}</option>`;
  }
  hizbSelect.innerHTML = options;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("تعذر تحميل البيانات");
  }
  return await res.json();
}

async function loadSurahList() {
  try {
    showLoading(true);
    const data = await fetchJSON(`${API_BASE}/surah`);
    surahs = data.data || [];
    renderSurahSelect(surahs);
    renderSurahList(surahs);
    surahSelect.value = "1";
  } catch (error) {
    setReaderHeader("خطأ", "تعذر تحميل قائمة السور", "تنبيه");
    contentArea.innerHTML = "حدث خطأ أثناء تحميل قائمة السور.";
  } finally {
    showLoading(false);
  }
}

async function loadSurah(number = 1) {
  try {
    showLoading(true);
    setBismillahVisibility(true);

    const res = await fetchJSON(`${API_BASE}/surah/${number}/quran-uthmani`);
    const surah = res.data;

    setReaderHeader(
      surah.name,
      `${surah.englishName} • ${surah.numberOfAyahs} آيات`,
      "السورة الحالية"
    );

    if (Number(number) === 9) {
      setBismillahVisibility(false);
    }

    renderAyahs(surah.ayahs);
    setActiveSurahItem(number);
  } catch (error) {
    setReaderHeader("خطأ", "تعذر تحميل السورة", "تنبيه");
    setBismillahVisibility(false);
    contentArea.innerHTML = "حدث خطأ أثناء تحميل السورة.";
  } finally {
    showLoading(false);
  }
}

async function loadJuz(juzNumber = 1) {
  try {
    showLoading(true);
    setBismillahVisibility(false);

    const res = await fetchJSON(`${API_BASE}/juz/${juzNumber}/quran-uthmani`);
    const juz = res.data;

    setReaderHeader(
      `الجزء ${juz.number}`,
      `${juz.ayahs.length} آية`,
      "عرض حسب الجزء"
    );

    renderMixedAyahs(juz.ayahs);
  } catch (error) {
    setReaderHeader("خطأ", "تعذر تحميل الجزء", "تنبيه");
    contentArea.innerHTML = "حدث خطأ أثناء تحميل الجزء.";
  } finally {
    showLoading(false);
  }
}

async function loadHizb(hizbNumber = 1) {
  try {
    showLoading(true);
    setBismillahVisibility(false);

    // AlQuran Cloud يوفر hizbQuarter من 1 إلى 240
    // بما أن المستخدم يريد 60 حزب، نحول كل حزب إلى أول ربع منه تقريباً:
    // الحزب 1 => الربع 1
    // الحزب 2 => الربع 5
    // الحزب 3 => الربع 9
    // وهكذا
    const hizbQuarter = ((Number(hizbNumber) - 1) * 4) + 1;

    const res = await fetchJSON(`${API_BASE}/hizbQuarter/${hizbQuarter}/quran-uthmani`);
    const block = res.data;

    setReaderHeader(
      `الحزب ${hizbNumber}`,
      `بداية الحزب ${hizbNumber} • عرض نصي قرآني`,
      "عرض حسب الحزب"
    );

    renderMixedAyahs(block.ayahs);
  } catch (error) {
    setReaderHeader("خطأ", "تعذر تحميل الحزب", "تنبيه");
    contentArea.innerHTML = "حدث خطأ أثناء تحميل الحزب.";
  } finally {
    showLoading(false);
  }
}

function handleSearch() {
  const raw = searchInput.value;
  const cleaned = cleanSearchQuery(raw);

  if (!cleaned) {
    renderSurahList(surahs);
    return;
  }

  const filtered = surahs.filter((surah) => {
    const arabicName = normalizeArabic(surah.name);
    const englishName = normalizeArabic(surah.englishName || "");
    const englishTranslation = normalizeArabic(surah.englishNameTranslation || "");

    return (
      arabicName.includes(cleaned) ||
      englishName.includes(cleaned) ||
      englishTranslation.includes(cleaned) ||
      String(surah.number) === cleaned
    );
  });

  renderSurahList(filtered);

  if (filtered.length > 0) {
    surahSelect.value = filtered[0].number;
  }
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  saveTheme();
});

fontPlusBtn.addEventListener("click", () => {
  currentFontSize += 0.15;
  document.documentElement.style.setProperty("--ayah-size", `${currentFontSize}rem`);
});

fontMinusBtn.addEventListener("click", () => {
  currentFontSize = Math.max(1.2, currentFontSize - 0.15);
  document.documentElement.style.setProperty("--ayah-size", `${currentFontSize}rem`);
});

searchInput.addEventListener("input", handleSearch);

loadSurahBtn.addEventListener("click", () => {
  const selected = surahSelect.value || 1;
  loadSurah(selected);
});

loadJuzBtn.addEventListener("click", () => {
  const selected = juzSelect.value || 1;
  loadJuz(selected);
});

loadHizbBtn.addEventListener("click", () => {
  const selected = hizbSelect.value || 1;
  loadHizb(selected);
});

surahSelect.addEventListener("change", () => {
  loadSurah(surahSelect.value);
});

window.addEventListener("DOMContentLoaded", async () => {
  loadTheme();
  initJuzSelect();
  initHizbSelect();
  await loadSurahList();
  await loadSurah(1);
});