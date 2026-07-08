const productTypes = [
  { id: "pillow", label: "Polštáře" },
  { id: "blanket", label: "Přikrývky" },
  { id: "set", label: "Sety" },
];

const qualityOptions = [
  { id: "all", label: "Vše" },
  { id: "BASIC", label: "BASIC" },
  { id: "PLUS", label: "PLUS" },
  { id: "GOLD", label: "GOLD" },
];

const qualityRank = {
  BASIC: 1,
  PLUS: 2,
  GOLD: 3,
};

const quickFilterOptions = [
  { id: "all", label: "Vše", types: ["pillow", "blanket", "set"] },
  { id: "memory", label: "Paměťová pěna", types: ["pillow"] },
  { id: "classicPillow", label: "Klasický", types: ["pillow"] },
  { id: "batist", label: "Batist", types: ["pillow", "blanket", "set"] },
  { id: "cotton", label: "Bavlna", types: ["pillow", "blanket", "set"] },
  { id: "polyester", label: "Polyester", types: ["pillow", "blanket", "set"] },
  { id: "feather", label: "Peří", types: ["pillow", "blanket", "set"] },
];

const salesRules = {
  minimumAttachment: {
    title: "Přikrývka nejde samotná",
    text: "K přikrývce nabídni polštář nebo povlečení. Nejlepší výsledek je sestava 3/3: polštář, přikrývka, povlečení.",
  },
  code7: {
    enabled: true,
    title: "Code7",
    text: "Pokud vybraný set není v akci, ověř možnost code7 podle interních pravidel prodejny.",
  },
  coverAdvice: {
    cottonBatiste: [
      "Hustě tkaný bavlněný batist je dobrý argument proti prachu a roztočům.",
      "Přírodní látka s dobrou cirkulací vzduchu.",
      "Odvádí vlhkost a je příjemná pro každodenní kontakt s pokožkou.",
    ],
    cotton: [
      "Lepší cirkulace vzduchu než u uzavřenějších syntetických potahů.",
      "Odvádí vlhkost a pomáhá držet sušší pocit při spánku.",
      "Přírodní látka, dobrý argument pro zákazníka, který nechce syntetiku.",
    ],
    polyester: [
      "Líp drží teplo, vhodné pro zákazníka, který chce teplejší pocit.",
      "Lehčí údržba a rychlé schnutí.",
      "Barva obvykle nebledne tak rychle a cena bývá dostupnější.",
    ],
  },
};

const browserGlobal = typeof window !== "undefined" ? window : null;
const canRenderApp = browserGlobal && typeof document !== "undefined";
const catalog = browserGlobal && Array.isArray(browserGlobal.JYSK_CATALOG) ? browserGlobal.JYSK_CATALOG : [];

const state = {
  type: "pillow",
  quality: "BASIC",
  sleep: "side",
  warmth: "warm",
  allergy: false,
  pillowFamily: "classic",
  quickFilter: "all",
  panelMode: "detail",
  search: "",
  selectedId: null,
  expandedId: null,
};

const elements = canRenderApp
  ? {
      typeTabs: document.querySelector("#typeTabs"),
      qualityTabs: document.querySelector("#qualityTabs"),
      sleepSelect: document.querySelector("#sleepSelect"),
      pillowFamilySelect: document.querySelector("#pillowFamilySelect"),
      warmthSelect: document.querySelector("#warmthSelect"),
      allergyToggle: document.querySelector("#allergyToggle"),
      searchInput: document.querySelector("#searchInput"),
      productList: document.querySelector("#productList"),
      catalogTitle: document.querySelector("#catalogTitle"),
      catalogCount: document.querySelector("#catalogCount"),
      quickFilters: document.querySelector("#quickFilters"),
      metricProducts: document.querySelector("#metricProducts"),
    }
  : {};

function init() {
  elements.metricProducts.textContent = catalog.filter((product) => product.type !== "cover").length.toString();
  renderControls();
  bindEvents();
  render();
}

function bindEvents() {
  elements.sleepSelect.addEventListener("change", (event) => {
    state.sleep = event.target.value;
    render();
  });

  elements.pillowFamilySelect.addEventListener("change", (event) => {
    state.pillowFamily = event.target.value;
    if (state.quickFilter === "memory" && state.pillowFamily !== "memory") state.quickFilter = "all";
    if (state.quickFilter === "classicPillow" && state.pillowFamily !== "classic") state.quickFilter = "all";
    selectFirstVisibleProduct();
    render();
  });

  elements.warmthSelect.addEventListener("change", (event) => {
    state.warmth = event.target.value;
    render();
  });

  elements.allergyToggle.addEventListener("change", (event) => {
    state.allergy = event.target.checked;
    render();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = normalizeText(event.target.value.trim());
    selectFirstVisibleProduct();
    render();
  });
}

function renderControls() {
  elements.pillowFamilySelect.value = state.pillowFamily;

  elements.typeTabs.innerHTML = productTypes
    .map((type) => controlButton(type.label, state.type === type.id, `data-type="${type.id}"`))
    .join("");

  elements.qualityTabs.innerHTML = qualityOptions
    .map((quality) => controlButton(quality.label, state.quality === quality.id, `data-quality="${quality.id}"`))
    .join("");

  elements.typeTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type;
      if (state.type !== "pillow" && ["memory", "classicPillow"].includes(state.quickFilter)) {
        state.quickFilter = "all";
      }
      selectFirstVisibleProduct();
      render();
    });
  });

  elements.qualityTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.quality = button.dataset.quality;
      selectFirstVisibleProduct();
      render();
    });
  });

  renderQuickFilters();
}

function controlButton(label, pressed, attributes) {
  return `<button type="button" ${attributes} aria-pressed="${pressed ? "true" : "false"}">${label}</button>`;
}

function render() {
  renderControls();
  renderProductList();
}

function visibleProducts() {
  return catalog.filter((product) => {
    if (product.type !== state.type) return false;
    if (state.quality !== "all" && product.quality !== state.quality) return false;
    if (!matchesPillowFamily(product)) return false;
    if (state.quickFilter !== "all" && !quickFilterMatches(product, state.quickFilter)) return false;
    if (!state.search) return true;

    return searchableText(product).includes(state.search);
  });
}

function selectFirstVisibleProduct() {
  const nextProduct = visibleProducts()[0] || catalog.find((product) => product.type === state.type);
  state.selectedId = nextProduct ? nextProduct.id : null;
  state.expandedId = null;
}

function renderProductList() {
  const products = visibleProducts();
  const typeLabel = productTypes.find((type) => type.id === state.type)?.label || "Produkty";
  elements.catalogTitle.textContent = state.quality === "all" ? typeLabel : `${typeLabel} ${state.quality}`;
  elements.catalogCount.textContent = formatResultCount(products.length);

  if (!products.length) {
    elements.productList.innerHTML = `<div class="empty-state">Žádný produkt neodpovídá filtrům.</div>`;
    return;
  }

  if (!products.some((product) => product.id === state.selectedId)) {
    state.selectedId = products[0].id;
  }

  if (state.expandedId && !products.some((product) => product.id === state.expandedId)) {
    state.expandedId = null;
  }

  elements.productList.innerHTML = products.map(productCard).join("");
  elements.productList.querySelectorAll("[data-select-product]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleProductPanel(button.dataset.selectProduct, "detail");
    });
  });

  elements.productList.querySelectorAll("[data-sale-product]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleProductPanel(button.dataset.saleProduct, "sales");
    });
  });

  elements.productList.querySelectorAll("[data-detail-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.productId;
      state.expandedId = button.dataset.productId;
      state.panelMode = button.dataset.detailMode;
      renderProductList();
    });
  });
}

function toggleProductPanel(productId, panelMode) {
  const isSameOpenPanel = state.expandedId === productId && state.panelMode === panelMode;
  state.selectedId = productId;
  state.panelMode = panelMode;
  state.expandedId = isSameOpenPanel ? null : productId;
  renderProductList();
}

function productCard(product) {
  const selected = product.id === state.expandedId ? " is-selected" : "";
  const isDetailOpen = product.id === state.expandedId && state.panelMode === "detail";
  const isSalesOpen = product.id === state.expandedId && state.panelMode === "sales";
  return `
    <article class="product-card${selected}">
      <div class="product-main">
        <div class="product-title-row">
          <h3>${product.name}</h3>
          ${qualityBadge(product.quality)}
        </div>
        <p class="product-subtitle">${product.description}</p>
        <div class="product-chips">
          ${productChips(product).map((chip) => `<span>${chip}</span>`).join("")}
        </div>
        <div class="spec-grid">
          ${smallSpec("Rozměr", product.size)}
          ${smallSpec(product.type === "blanket" ? "Hřejivost" : "Výška", product.warmth || product.height || "-")}
          ${smallSpec("Náplň", product.filling)}
          ${smallSpec("Potah", product.cover)}
        </div>
        <div class="card-actions">
          <button class="secondary-button" type="button" data-select-product="${product.id}" aria-expanded="${isDetailOpen ? "true" : "false"}" aria-pressed="${isDetailOpen ? "true" : "false"}">Detail</button>
          <button class="action-button" type="button" data-sale-product="${product.id}" aria-expanded="${isSalesOpen ? "true" : "false"}" aria-pressed="${isSalesOpen ? "true" : "false"}">Doplňkový prodej</button>
        </div>
      </div>
      ${product.id === state.expandedId ? expandedProductPanel(product) : ""}
    </article>
  `;
}

function expandedProductPanel(product) {
  const recommendations = getRecommendations(product);
  const coverPros = getCoverAdvice(product.cover);
  const primaryLabel = product.type === "pillow" ? "Nejlepší přikrývka" : product.type === "blanket" ? "Nejlepší polštář" : "Doplnění setu";
  const panelMode = state.panelMode === "sales" ? "sales" : "detail";

  return `
    <div class="inline-panel">
      <div class="inline-panel-head">
        ${detailModeTabs(panelMode, product.id)}
        <div class="detail-tags">
          <span class="tag">${product.typeLabel}</span>
          <span class="tag">SKU ${product.sku}</span>
          ${sourceLink(product)}
        </div>
      </div>

      <div class="detail-body">
        ${panelMode === "sales" ? salesPanelBody(product, recommendations, primaryLabel) : productInfoBody(product, coverPros)}
      </div>
    </div>
  `;
}

function infoRow(label, value) {
  return `<div class="info-row"><dt>${label}</dt><dd>${value}</dd></div>`;
}

function detailModeTabs(panelMode, productId) {
  return `
    <div class="detail-mode-tabs" role="group" aria-label="Režim panelu">
      <button type="button" data-product-id="${productId}" data-detail-mode="detail" aria-pressed="${panelMode === "detail" ? "true" : "false"}">Detail</button>
      <button type="button" data-product-id="${productId}" data-detail-mode="sales" aria-pressed="${panelMode === "sales" ? "true" : "false"}">Doplňkový prodej</button>
    </div>
  `;
}

function productInfoBody(product, coverPros) {
  return `
    <dl class="info-list">
      ${infoRow("SKU", `<span class="sku">${product.sku}</span>`)}
      ${infoRow("Náplň", product.filling)}
      ${infoRow("Hmotnost", product.fillWeight)}
      ${infoRow("Potah", `${product.cover}${coverProsHtml(coverPros)}`)}
      ${infoRow(product.type === "blanket" ? "Hřejivost" : "Výška", product.warmth || product.height || "-")}
      ${infoRow("Údržba", product.care)}
    </dl>
  `;
}

function salesPanelBody(product, recommendations, primaryLabel) {
  return `
    <section class="sales-intro" aria-label="Prodejní cíl">
      <p class="eyebrow">Doplňkový prodej</p>
      <h3>${primaryLabel}</h3>
      <p>${salesIntro(product)}</p>
    </section>

    <section class="sales-section" aria-label="Doporučené produkty">
      ${recommendations.map(recommendationCard).join("")}
    </section>

    <section class="sales-section" aria-label="Prodejní pravidla">
      <h3>Prodejní pravidla</h3>
      ${salesNotes(product).map(ruleNote).join("")}
    </section>
  `;
}

function salesIntro(product) {
  if (product.type === "pillow") {
    return "Navazuj přikrývkou stejné třídy a povlečením, aby vznikla sestava 3/3.";
  }

  if (product.type === "blanket") {
    return "Přikrývku nepouštěj samotnou. Doplň polštář nebo povlečení podle rozměru a třídy.";
  }

  if (product.type === "set") {
    return "Set už řeší polštář a přikrývku. Třetí krok je povlečení ve správném rozměru.";
  }

  return "Doplň vybraný produkt do celé spací sestavy.";
}

function smallSpec(label, value) {
  return `<div class="spec"><span>${label}</span><strong>${value}</strong></div>`;
}

function qualityBadge(quality) {
  return `<span class="quality-badge" data-quality="${quality}">${quality}</span>`;
}

function coverProsHtml(pros) {
  if (!pros.length) return "";
  return `<ul class="pros">${pros.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function getCoverAdvice(cover) {
  const normalized = cover.toLowerCase();
  if (normalized.includes("batist")) {
    return salesRules.coverAdvice.cottonBatiste;
  }

  if (normalized.includes("bavln") || normalized.includes("cotton")) {
    return salesRules.coverAdvice.cotton;
  }

  if (normalized.includes("polyester") || normalized.includes("mikrovlákno")) {
    return salesRules.coverAdvice.polyester;
  }

  return [];
}

function getRecommendations(selected) {
  const desiredTypes = recommendationTypes(selected.type);
  return desiredTypes
    .map((type) => bestProductForType(selected, type))
    .filter(Boolean);
}

function recommendationTypes(type) {
  if (type === "pillow") return ["blanket", "cover"];
  if (type === "blanket") return ["pillow", "cover"];
  if (type === "set") return ["cover", "pillow"];
  return ["pillow", "blanket", "cover"];
}

function bestProductForType(selected, type) {
  const candidates = preferredCandidates(selected, type);
  const scored = candidates
    .map((candidate) => scoreRecommendation(selected, candidate))
    .sort((a, b) => b.score - a.score);

  return scored[0];
}

function preferredCandidates(selected, type) {
  let candidates = catalog.filter((product) => product.type === type);

  if (type === "pillow") {
    const preferredFamily = candidates.filter((candidate) => matchesPillowRecommendationFamily(selected, candidate));
    if (preferredFamily.length) {
      candidates = preferredFamily;
    }
  }

  const sameQuality = candidates.filter((candidate) => candidate.quality === selected.quality);

  if (sameQuality.length) {
    return sameQuality;
  }

  return candidates;
}

function scoreRecommendation(selected, candidate) {
  let score = 30;
  const reasons = [];

  if (candidate.quality === selected.quality) {
    score += selected.quality === "GOLD" ? 46 : 36;
    reasons.push(`Pravidlo třídy: ${selected.quality} k ${candidate.quality}.`);
  } else if (Math.abs(qualityRank[candidate.quality] - qualityRank[selected.quality]) === 1) {
    score += 14;
    reasons.push(`Blízká třída k ${selected.quality}.`);
  }

  if (sizeMatches(selected, candidate)) {
    score += 22;
    reasons.push("Rozměr sedí do stejné sestavy.");
  }

  if (state.allergy && candidate.allergyFriendly) {
    score += 18;
    reasons.push("Vhodné pro zákazníka s alergií.");
  }

  if (candidate.type === "blanket" && warmthMatches(candidate.warmth)) {
    score += 20;
    reasons.push(`Hřejivost odpovídá volbě zákazníka: ${candidate.warmth}.`);
  }

  if (candidate.type === "pillow" && candidate.sleepFit.includes(state.sleep)) {
    score += 18;
    reasons.push("Výška polštáře odpovídá poloze spánku.");
  }

  const materialReason = coverSalesReason(candidate.cover);
  if (materialReason) {
    score += materialReason.includes("batist") ? 12 : 8;
    reasons.push(materialReason);
  }

  if (candidate.discount) {
    score += 5;
    reasons.push("V posledním veřejném exportu bylo označeno jako akční.");
  }

  if (!reasons.length) {
    reasons.push("Doplňuje vybraný produkt do prodejní sestavy.");
  }

  return {
    product: candidate,
    score: Math.min(score, 99),
    reasons,
  };
}

function renderQuickFilters() {
  const options = activeQuickFilters();
  if (!options.some((option) => option.id === state.quickFilter)) {
    state.quickFilter = "all";
  }

  elements.quickFilters.innerHTML = options
    .map((option) => {
      const count = quickFilterCount(option.id);
      return `<button type="button" data-quick-filter="${option.id}" aria-pressed="${state.quickFilter === option.id ? "true" : "false"}">${option.label}<span>${count}</span></button>`;
    })
    .join("");

  elements.quickFilters.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.quickFilter = button.dataset.quickFilter;
      if (state.quickFilter === "memory") state.pillowFamily = "memory";
      if (state.quickFilter === "classicPillow") state.pillowFamily = "classic";
      selectFirstVisibleProduct();
      render();
    });
  });
}

function activeQuickFilters() {
  return quickFilterOptions.filter((option) => option.types.includes(state.type));
}

function quickFilterCount(filterId) {
  return catalog.filter((product) => {
    if (product.type !== state.type) return false;
    if (state.quality !== "all" && product.quality !== state.quality) return false;
    if (filterId === "all" && !matchesPillowFamily(product)) return false;
    if (filterId !== "all" && !quickFilterMatches(product, filterId)) return false;
    if (state.search && !searchableText(product).includes(state.search)) return false;
    return true;
  }).length;
}

function quickFilterMatches(product, filterId) {
  if (filterId === "all") return true;
  if (filterId === "memory") return product.type === "pillow" && pillowFamily(product) === "memory";
  if (filterId === "classicPillow") return product.type === "pillow" && pillowFamily(product) === "classic";
  if (filterId === "batist") return searchableText(product.cover).includes("batist");
  if (filterId === "cotton") return searchableText(product.cover).includes("bavln") || searchableText(product.cover).includes("cotton");
  if (filterId === "polyester") return searchableText(`${product.cover} ${product.filling}`).includes("polyester");
  if (filterId === "feather") {
    const text = searchableText(product.filling);
    return ["peri", "prachove", "kachni", "husi"].some((term) => text.includes(term));
  }
  return true;
}

function matchesPillowFamily(product) {
  if (product.type !== "pillow") return true;
  if (state.pillowFamily === "all") return true;
  if (["memory", "classicPillow"].includes(state.quickFilter)) return true;
  return pillowFamily(product) === state.pillowFamily;
}

function matchesPillowRecommendationFamily(selected, candidate) {
  if (candidate.type !== "pillow") return true;
  if (state.pillowFamily !== "all") return pillowFamily(candidate) === state.pillowFamily;
  if (selected.type === "pillow") return pillowFamily(candidate) === pillowFamily(selected);
  return true;
}

function pillowFamily(product) {
  if (product.type !== "pillow") return "";
  const text = searchableText(`${product.description} ${product.filling} ${(product.tags || []).join(" ")} ${product.fillingType}`);
  return text.includes("pamet") || text.includes("foam") || text.includes("pena") ? "memory" : "classic";
}

function productChips(product) {
  const chips = [];

  if (product.type === "pillow") {
    chips.push(pillowFamily(product) === "memory" ? "Paměťová pěna" : "Klasický polštář");
  }

  if (searchableText(product.cover).includes("batist")) {
    chips.push("Batist");
  } else if (searchableText(product.cover).includes("bavln") || searchableText(product.cover).includes("cotton")) {
    chips.push("Bavlna");
  }

  if (searchableText(product.cover).includes("polyester")) {
    chips.push("Polyester");
  }

  if (product.type === "blanket" && product.warmth) {
    chips.push(product.warmth);
  }

  return chips.slice(0, 3);
}

function coverSalesReason(cover) {
  const normalized = cover.toLowerCase();

  if (normalized.includes("batist")) {
    return "Bavlněný batist: hustá tkanina, dobrý argument proti prachu a roztočům.";
  }

  if (normalized.includes("bavln") || normalized.includes("cotton")) {
    return "Bavlna: lepší cirkulace vzduchu a odvod vlhkosti.";
  }

  if (normalized.includes("polyester") || normalized.includes("mikrovlákno")) {
    return "Polyester: líp drží teplo, jednodušší údržba a dostupnější cena.";
  }

  return "";
}

function searchableText(product) {
  if (typeof product === "string") return normalizeText(product);
  return normalizeText([
    product.name,
    product.description,
    product.sku,
    product.size,
    product.filling,
    product.cover,
    product.quality,
    product.height,
    product.warmth,
    (product.tags || []).join(" "),
  ].join(" "));
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatResultCount(count) {
  if (count === 1) return "1 položka";
  if (count > 1 && count < 5) return `${count} položky`;
  return `${count} položek`;
}

function sizeMatches(selected, candidate) {
  const selectedParts = selected.size.split("/").map((part) => part.trim());
  return selectedParts.some((part) => equivalentSize(part, candidate.size));
}

function equivalentSize(selectedSize, candidateSize) {
  const selected = normalizeSize(selectedSize);
  const candidate = normalizeSize(candidateSize);
  const alternatives = {
    "100x135": ["100x140"],
    "135x200": ["140x200"],
    "135x220": ["140x220"],
    "140x200": ["135x200"],
    "140x220": ["135x220"],
  };

  if (!selected || !candidate) return false;
  if (candidate.includes(selected)) return true;
  return (alternatives[selected] || []).some((size) => candidate.includes(size));
}

function normalizeSize(size) {
  return size.toLowerCase().replace(/\s+/g, "").replace(/cm/g, "");
}

function warmthMatches(warmth) {
  const normalized = warmth.toLowerCase();
  if (state.warmth === "cool") return normalized.includes("chlad") || normalized.includes("letní");
  if (state.warmth === "extra") return normalized.includes("extra");
  return normalized.includes("tepl");
}

function recommendationCard(item) {
  const product = item.product;
  return `
    <article class="recommendation">
      <div class="rec-title-row">
        <div>
          <p class="eyebrow">${product.typeLabel}</p>
          <h4>${product.name}</h4>
          <p class="product-subtitle">${product.description}</p>
        </div>
        <span class="match-score">${item.score}%</span>
      </div>
      <div class="spec-grid">
        ${smallSpec("Třída", product.quality)}
        ${smallSpec("Rozměr", product.size)}
      </div>
      <ul class="reason-list">
        ${item.reasons.slice(0, 3).map((reason) => `<li>${reason}</li>`).join("")}
      </ul>
    </article>
  `;
}

function salesNotes(product) {
  const notes = [];

  if (product.type === "blanket") {
    notes.push(salesRules.minimumAttachment);
  }

  if (product.type === "pillow") {
    notes.push({
      title: "Navazující prodej",
      text: "Po výběru polštáře nabídni přikrývku stejné nebo vyšší třídy a zakonči sestavu povlečením.",
    });
  }

  if (product.type === "set") {
    notes.push({
      title: "Set doplň na 3/3",
      text: "Set řeší polštář a přikrývku. Třetí krok je povlečení ve stejném rozměru.",
    });
  }

  if (salesRules.code7.enabled && !product.discount) {
    notes.push(salesRules.code7);
  }

  return notes;
}

function ruleNote(note) {
  return `<div class="rule-note"><strong>${note.title}</strong><span>${note.text}</span></div>`;
}

function sourceLink(product) {
  if (!product.sourceUrl) return "";
  return `<a class="source-link" href="${product.sourceUrl}" target="_blank" rel="noreferrer">Zdroj JYSK</a>`;
}

if (canRenderApp) {
  init();
} else {
  console.log("This is a browser app. Open index.html in a browser, or publish the folder with GitHub Pages.");
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}
