const API_BASE = "https://api.alquran.cloud/v1";
const MP3QURAN_API = "https://www.mp3quran.net/api/v3/reciters?language=ar";

const searchInput = document.getElementById("searchInput");
const surahSelect = document.getElementById("surahSelect");
const juzSelect = document.getElementById("juzSelect");
const hizbSelect = document.getElementById("hizbSelect");

const loadSurahBtn = document.getElementById("loadSurahBtn");
const loadJuzBtn = document.getElementById("loadJuzBtn");
const loadHizbBtn = document.getElementById("loadHizbBtn");

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

const reciterSelect = document.getElementById("reciterSelect");
const playSurahBtn = document.getElementById("playSurahBtn");
const pauseAudioBtn = document.getElementById("pauseAudioBtn");
const resumeAudioBtn = document.getElementById("resumeAudioBtn");
const stopAudioBtn = document.getElementById("stopAudioBtn");
const quranPlayer = document.getElementById("quranPlayer");
const audioStatus = document.getElementById("audioStatus");

let surahs = [];
let reciters = [];
let currentFontSize = parseFloat(localStorage.getItem("quranFontSize")) || 2.2;
let currentSurahName = "";

function applyFontSize() {
  contentArea.style.fontSize = `${currentFontSize}rem`;
  localStorage.setItem("quranFontSize", currentFontSize.toString());
}

function showLoading(status) {
  loadingBox.classList.toggle("d-none", !status);
}

function normalizeArabic(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ");
}

function cleanSearchQuery(query) {
  let q = normalizeArabic(query);

  const removableWords = [
    "سوره",
    "سورة",
    "السوره",
    "السورة",
    "surah",
    "sura",
    "sorat",
    "soorat",
    "sourat",
    "sourah",
    "asoorat",
    "assorat",
    "chapter"
  ];

  removableWords.forEach(word => {
    q = q.replaceAll(normalizeArabic(word), "");
  });

  return q.trim();
}

function saveTheme() {
  const mode = document.body.classList.contains("light-mode") ? "light" : "dark";
  localStorage.setItem("quranTheme", mode);
}

function loadTheme() {
  const mode = localStorage.getItem("quranTheme");
  if (mode === "light") {
    document.body.classList.add("light-mode");
  }
}

function saveReciter() {
  localStorage.setItem("quranReciterId", reciterSelect.value);
}

function loadSavedReciter() {
  return localStorage.getItem("quranReciterId");
}

function setReaderHeader(kicker, title, meta) {
  readerKicker.textContent = kicker;
  readerTitle.textContent = title;
  readerMeta.textContent = meta;
}

function setBismillahVisible(status) {
  bismillah.style.display = status ? "block" : "none";
}

function renderAyahsInline(ayahs) {
  contentArea.innerHTML = ayahs
    .map((ayah, index) => {
      const number = ayah.numberInSurah || index + 1;
      const text = ayah.text || "";
      return `<span class="ayah">${text}</span><span class="ayah-number">${number}</span>`;
    })
    .join(" ");
}

function setActiveSurah(number) {
  document.querySelectorAll(".surah-item").forEach(item => {
    item.classList.toggle("active", item.dataset.number === String(number));
  });
}

function renderSurahSelect(list) {
  surahSelect.innerHTML = list
    .map(surah => `<option value="${surah.number}">${surah.number} - ${surah.name}</option>`)
    .join("");
}

function renderSurahList(list) {
  surahList.innerHTML = list
    .map(surah => {
      return `
        <div class="surah-item" data-number="${surah.number}">
          <div class="surah-name">${surah.number}. ${surah.name}</div>
          <div class="surah-meta">${surah.englishName} • ${surah.numberOfAyahs} آيات</div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".surah-item").forEach(item => {
    item.addEventListener("click", () => {
      const number = item.dataset.number;
      surahSelect.value = number;
      loadSurah(number);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function initJuz() {
  let html = "";
  for (let i = 1; i <= 30; i++) {
    html += `<option value="${i}">الجزء ${i}</option>`;
  }
  juzSelect.innerHTML = html;
}

function initHizb() {
  let html = "";
  for (let i = 1; i <= 60; i++) {
    html += `<option value="${i}">الحزب ${i}</option>`;
  }
  hizbSelect.innerHTML = html;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("API error");
  }
  return response.json();
}

async function loadSurahList() {
  try {
    showLoading(true);
    const data = await fetchJson(`${API_BASE}/surah`);
    surahs = data.data || [];
    renderSurahSelect(surahs);
    renderSurahList(surahs);
    surahSelect.value = "1";
  } catch (error) {
    setReaderHeader("تنبيه", "تعذر تحميل البيانات", "تحقق من الاتصال بالإنترنت");
    contentArea.innerHTML = "حدث خطأ أثناء تحميل قائمة السور.";
  } finally {
    showLoading(false);
  }
}

async function loadReciters() {
  try {
    const data = await fetchJson(MP3QURAN_API);

    const wantedNames = [
      "العفاسي",
      "السديس",
      "الشريم",
      "المعيقلي"
    ];

    const allReciters = data.reciters || [];

    const filtered = allReciters.filter(reciter => {
      const name = reciter.name || "";
      return wantedNames.some(keyword => name.includes(keyword));
    });

    reciters = filtered
      .map(reciter => {
        const usableMoshaf = (reciter.moshaf || []).find(
          m => m.server && m.surah_list && Number(m.surah_total) > 0
        );

        if (!usableMoshaf) return null;

        return {
          id: String(reciter.id),
          name: reciter.name,
          server: usableMoshaf.server,
          surahList: String(usableMoshaf.surah_list)
            .split(",")
            .map(v => Number(v.trim()))
            .filter(Boolean)
        };
      })
      .filter(Boolean);

    reciterSelect.innerHTML = reciters
      .map(reciter => `<option value="${reciter.id}">${reciter.name}</option>`)
      .join("");

    const savedId = loadSavedReciter();
    const exists = reciters.some(r => r.id === savedId);

    if (savedId && exists) {
      reciterSelect.value = savedId;
    } else if (reciters.length) {
      reciterSelect.value = reciters[0].id;
    }
  } catch (error) {
    reciterSelect.innerHTML = `<option value="">تعذر تحميل القراء</option>`;
    audioStatus.textContent = "تعذر تحميل قائمة القراء";
  }
}

async function loadSurah(number = 1) {
  try {
    showLoading(true);
    const result = await fetchJson(`${API_BASE}/surah/${number}/quran-uthmani`);
    const surah = result.data;

    currentSurahName = surah.name;

    setReaderHeader(
      "السورة الحالية",
      surah.name,
      `${surah.englishName} • ${surah.numberOfAyahs} آيات`
    );

    setBismillahVisible(Number(number) !== 9);
    renderAyahsInline(surah.ayahs);
    applyFontSize();
    setActiveSurah(number);
  } catch (error) {
    setReaderHeader("تنبيه", "تعذر تحميل السورة", "حاول مرة أخرى");
    setBismillahVisible(false);
    contentArea.innerHTML = "حدث خطأ أثناء تحميل السورة.";
  } finally {
    showLoading(false);
  }
}

async function loadJuz(juzNumber = 1) {
  try {
    showLoading(true);
    const result = await fetchJson(`${API_BASE}/juz/${juzNumber}/quran-uthmani`);
    const juz = result.data;

    currentSurahName = `الجزء ${juz.number}`;

    setReaderHeader(
      "عرض حسب الجزء",
      `الجزء ${juz.number}`,
      `${juz.ayahs.length} آية`
    );

    setBismillahVisible(false);
    renderAyahsInline(juz.ayahs);
    applyFontSize();
    setActiveSurah("");
  } catch (error) {
    setReaderHeader("تنبيه", "تعذر تحميل الجزء", "حاول مرة أخرى");
    setBismillahVisible(false);
    contentArea.innerHTML = "حدث خطأ أثناء تحميل الجزء.";
  } finally {
    showLoading(false);
  }
}

async function loadHizb(hizbNumber = 1) {
  try {
    showLoading(true);

    const hizbQuarter = ((Number(hizbNumber) - 1) * 4) + 1;
    const result = await fetchJson(`${API_BASE}/hizbQuarter/${hizbQuarter}/quran-uthmani`);
    const hizb = result.data;

    currentSurahName = `الحزب ${hizbNumber}`;

    setReaderHeader(
      "عرض حسب الحزب",
      `الحزب ${hizbNumber}`,
      `${hizb.ayahs.length} آية من بداية الحزب`
    );

    setBismillahVisible(false);
    renderAyahsInline(hizb.ayahs);
    applyFontSize();
    setActiveSurah("");
  } catch (error) {
    setReaderHeader("تنبيه", "تعذر تحميل الحزب", "حاول مرة أخرى");
    setBismillahVisible(false);
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

  const filtered = surahs.filter(surah => {
    const ar = normalizeArabic(surah.name);
    const en = normalizeArabic(surah.englishName || "");
    const tr = normalizeArabic(surah.englishNameTranslation || "");
    return (
      ar.includes(cleaned) ||
      en.includes(cleaned) ||
      tr.includes(cleaned) ||
      String(surah.number) === cleaned
    );
  });

  renderSurahList(filtered);

  if (filtered.length > 0) {
    surahSelect.value = filtered[0].number;
  }
}

function stopAudio() {
  quranPlayer.pause();
  quranPlayer.currentTime = 0;
  quranPlayer.removeAttribute("src");
  quranPlayer.load();
}

async function playSurahAudio(surahNumber) {
  try {
    const selectedReciter = reciters.find(r => r.id === reciterSelect.value);

    if (!selectedReciter) {
      throw new Error("No reciter selected");
    }

    if (!selectedReciter.surahList.includes(Number(surahNumber))) {
      throw new Error("This reciter does not have this surah");
    }

    const paddedSurah = String(surahNumber).padStart(3, "0");
    const server = selectedReciter.server.endsWith("/")
      ? selectedReciter.server
      : `${selectedReciter.server}/`;

    const audioUrl = `${server}${paddedSurah}.mp3`;

    quranPlayer.src = audioUrl;
    quranPlayer.load();
    await quranPlayer.play();

    audioStatus.textContent = `يتم الآن تشغيل السورة كاملة بصوت ${selectedReciter.name}`;
  } catch (error) {
    console.error(error);
    audioStatus.textContent = "تعذر تشغيل السورة لهذا القارئ";
  }
}

quranPlayer.addEventListener("play", () => {
  if (currentSurahName) {
    const selectedReciter = reciters.find(r => r.id === reciterSelect.value);
    if (selectedReciter) {
      audioStatus.textContent = `يتم الآن تشغيل ${currentSurahName} بصوت ${selectedReciter.name}`;
    }
  }
});

quranPlayer.addEventListener("pause", () => {
  if (quranPlayer.currentTime > 0 && !quranPlayer.ended) {
    audioStatus.textContent = "تم إيقاف التلاوة مؤقتًا";
  }
});

quranPlayer.addEventListener("ended", () => {
  audioStatus.textContent = `انتهت تلاوة ${currentSurahName}`;
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  saveTheme();
});

fontPlusBtn.addEventListener("click", () => {
  currentFontSize = Math.min(currentFontSize + 0.15, 4);
  applyFontSize();
});

fontMinusBtn.addEventListener("click", () => {
  currentFontSize = Math.max(currentFontSize - 0.15, 1.4);
  applyFontSize();
});

searchInput.addEventListener("input", handleSearch);

loadSurahBtn.addEventListener("click", () => {
  loadSurah(surahSelect.value || 1);
});

loadJuzBtn.addEventListener("click", () => {
  loadJuz(juzSelect.value || 1);
});

loadHizbBtn.addEventListener("click", () => {
  loadHizb(hizbSelect.value || 1);
});

surahSelect.addEventListener("change", () => {
  loadSurah(surahSelect.value);
});

reciterSelect.addEventListener("change", saveReciter);

playSurahBtn.addEventListener("click", () => {
  const surahNumber = surahSelect.value || 1;
  playSurahAudio(surahNumber);
});

pauseAudioBtn.addEventListener("click", () => {
  quranPlayer.pause();
  audioStatus.textContent = "تم إيقاف التلاوة مؤقتًا";
});

resumeAudioBtn.addEventListener("click", async () => {
  try {
    await quranPlayer.play();
  } catch (error) {
    audioStatus.textContent = "تعذر متابعة التشغيل";
  }
});

stopAudioBtn.addEventListener("click", () => {
  stopAudio();
  audioStatus.textContent = "تم إنهاء التلاوة";
});

window.addEventListener("DOMContentLoaded", async () => {
  loadTheme();
  initJuz();
  initHizb();
  applyFontSize();
  await loadSurahList();
  await loadReciters();
  await loadSurah(1);
});