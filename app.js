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
  
  // New redesign state
  compareIds: [],
  isWizardOpen: false,
  wizardStep: 0,
  wizardAnswers: {},
  isMobileFiltersOpen: false,
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
      
      // Wizard elements
      startWizardBtn: document.querySelector("#startWizardBtn"),
      closeWizardBtn: document.querySelector("#closeWizardBtn"),
      wizardModal: document.querySelector("#wizardModal"),
      wizardStepContent: document.querySelector("#wizardStepContent"),
      wizardBackBtn: document.querySelector("#wizardBackBtn"),
      wizardNextBtn: document.querySelector("#wizardNextBtn"),
      wizardProgress: document.querySelector("#wizardProgress"),
      
      // Comparison elements
      closeCompareBtn: document.querySelector("#closeCompareBtn"),
      compareModal: document.querySelector("#compareModal"),
      compareTable: document.querySelector("#compareTable"),
      compareBar: document.querySelector("#compareBar"),
      compareCountText: document.querySelector("#compareCountText"),
      clearCompareBtn: document.querySelector("#clearCompareBtn"),
      startCompareBtn: document.querySelector("#startCompareBtn"),
      
      // Reset & Mobile Drawer elements
      resetFiltersBtn: document.querySelector("#resetFiltersBtn"),
      mobileFilterToggle: document.querySelector("#mobileFilterToggle"),
      filtersSection: document.querySelector("#filtersSection"),
      filtersBackdrop: document.querySelector("#filtersBackdrop"),
    }
  : {};

function init() {
  if (elements.metricProducts) {
    elements.metricProducts.textContent = catalog.filter((product) => product.type !== "cover").length.toString();
  }
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

  // Reset Filters Button
  if (elements.resetFiltersBtn) {
    elements.resetFiltersBtn.addEventListener("click", () => {
      resetFilters();
    });
  }

  // Mobile Filter Drawer Toggle
  if (elements.mobileFilterToggle) {
    elements.mobileFilterToggle.addEventListener("click", () => {
      state.isMobileFiltersOpen = true;
      renderMobileFilters();
    });
  }

  if (elements.filtersBackdrop) {
    elements.filtersBackdrop.addEventListener("click", () => {
      state.isMobileFiltersOpen = false;
      renderMobileFilters();
    });
  }

  // Sales Wizard Modals Trigger
  if (elements.startWizardBtn) {
    elements.startWizardBtn.addEventListener("click", () => {
      openWizard();
    });
  }

  if (elements.closeWizardBtn) {
    elements.closeWizardBtn.addEventListener("click", () => {
      closeWizard();
    });
  }

  if (elements.wizardBackBtn) {
    elements.wizardBackBtn.addEventListener("click", () => {
      navigateWizard(-1);
    });
  }

  if (elements.wizardNextBtn) {
    elements.wizardNextBtn.addEventListener("click", () => {
      navigateWizard(1);
    });
  }

  // Product Comparison Modals Trigger
  if (elements.closeCompareBtn) {
    elements.closeCompareBtn.addEventListener("click", () => {
      closeCompareModal();
    });
  }

  if (elements.clearCompareBtn) {
    elements.clearCompareBtn.addEventListener("click", () => {
      clearCompareList();
    });
  }

  if (elements.startCompareBtn) {
    elements.startCompareBtn.addEventListener("click", () => {
      openCompareModal();
    });
  }

  // Event delegation on product list for checkboxes and copy buttons
  if (elements.productList) {
    elements.productList.addEventListener("change", (event) => {
      if (event.target.matches("input[data-compare-id]")) {
        toggleCompareProduct(event.target.dataset.compareId);
      }
    });

    elements.productList.addEventListener("click", (event) => {
      const copyBtn = event.target.closest(".copy-sku-btn");
      if (copyBtn) {
        copySkuToClipboard(copyBtn.dataset.copySku, copyBtn);
      }
    });
  }
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
  renderMobileFilters();
  renderCompareBar();
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
  elements.catalogCount.textContent = `(${formatResultCount(products.length)})`;

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
  const isCompared = state.compareIds.includes(product.id);
  const compareChecked = isCompared ? "checked" : "";

  return `
    <article class="product-card${selected} card-${product.quality.toLowerCase()}">
      <div class="product-header-row">
        <div class="product-header-details">
          <div class="product-title-line">
            <div class="title-left">
              <h3>${product.name}</h3>
            </div>
            <label class="compare-checkbox" onclick="event.stopPropagation();">
              <input type="checkbox" data-compare-id="${product.id}" ${compareChecked}>
              <span>Srovnat</span>
            </label>
          </div>
          <p class="product-subtitle">${product.filling || ""}, ${product.size}</p>
          <p class="product-spec-row">${product.type === "blanket" ? "Hřejivost" : "Výška"}: ${product.warmth || product.height || "-"}</p>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="action-button" type="button" data-sale-product="${product.id}" aria-expanded="${isSalesOpen ? "true" : "false"}" aria-pressed="${isSalesOpen ? "true" : "false"}">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="margin-right: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-10.5m0 0H9m5.25 0v4.5m-10.5 4.5V18m0-10.5L14.25 18M18 18h-4.5m0 0v-4.5" />
          </svg>
          NAVRHNOUT UP-SELL & CROSS-SELL
        </button>
        <button class="secondary-button" type="button" data-select-product="${product.id}" aria-expanded="${isDetailOpen ? "true" : "false"}" aria-pressed="${isDetailOpen ? "true" : "false"}">
          VÍCE INFORMACÍ A RADY
        </button>
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
        <div class="detail-tags" style="margin-top: 0;">
          <span class="tag">${product.typeLabel}</span>
          <span class="tag sku-container">
            SKU ${product.sku}
            <button class="copy-sku-btn" data-copy-sku="${product.sku}">Kopírovat</button>
          </span>
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
  const options = activeQuickFilters().filter((option) => option.id !== "all");
  if (!activeQuickFilters().some((option) => option.id === state.quickFilter)) {
    state.quickFilter = "all";
  }

  let htmlContent = options
    .map((option) => {
      return `<button type="button" data-quick-filter="${option.id}" aria-pressed="${state.quickFilter === option.id ? "true" : "false"}">${option.label}</button>`;
    })
    .join("");

  // Add the inline Zobrazit Filtry button at the end
  htmlContent += `
    <button type="button" id="inlineFilterBtn" class="inline-filter-btn">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="margin-right: 4px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.874c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/>
      </svg>
      Zobrazit Filtry
    </button>
  `;

  elements.quickFilters.innerHTML = htmlContent;

  elements.quickFilters.querySelectorAll("button[data-quick-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetFilter = button.dataset.quickFilter;
      if (state.quickFilter === targetFilter) {
        state.quickFilter = "all";
        state.pillowFamily = "all";
      } else {
        state.quickFilter = targetFilter;
        if (state.quickFilter === "memory") state.pillowFamily = "memory";
        if (state.quickFilter === "classicPillow") state.pillowFamily = "classic";
      }
      selectFirstVisibleProduct();
      render();
    });
  });

  const inlineFilterBtn = elements.quickFilters.querySelector("#inlineFilterBtn");
  if (inlineFilterBtn) {
    inlineFilterBtn.addEventListener("click", () => {
      state.isMobileFiltersOpen = true;
      render();
    });
  }
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

function resetFilters() {
  state.type = "pillow";
  state.quality = "BASIC";
  state.sleep = "side";
  state.warmth = "warm";
  state.allergy = false;
  state.pillowFamily = "classic";
  state.quickFilter = "all";
  state.search = "";
  state.selectedId = null;
  state.expandedId = null;
  state.compareIds = [];

  // Reset inputs visually
  if (elements.sleepSelect) elements.sleepSelect.value = "side";
  if (elements.pillowFamilySelect) elements.pillowFamilySelect.value = "classic";
  if (elements.warmthSelect) elements.warmthSelect.value = "warm";
  if (elements.allergyToggle) elements.allergyToggle.checked = false;
  if (elements.searchInput) elements.searchInput.value = "";

  render();
}

function renderMobileFilters() {
  if (elements.filtersSection && elements.filtersBackdrop) {
    if (state.isMobileFiltersOpen) {
      elements.filtersSection.classList.add("is-open");
      elements.filtersBackdrop.classList.add("is-visible");
    } else {
      elements.filtersSection.classList.remove("is-open");
      elements.filtersBackdrop.classList.remove("is-visible");
    }
  }
}

function toggleCompareProduct(productId) {
  const index = state.compareIds.indexOf(productId);
  if (index > -1) {
    state.compareIds.splice(index, 1);
  } else {
    if (state.compareIds.length >= 3) {
      alert("Můžete porovnávat maximálně 3 produkty najednou.");
      renderProductList();
      return;
    }
    state.compareIds.push(productId);
  }
  render();
}

function clearCompareList() {
  state.compareIds = [];
  render();
}

function renderCompareBar() {
  if (!elements.compareBar) return;
  const count = state.compareIds.length;
  if (count > 0) {
    elements.compareBar.removeAttribute("aria-hidden");
    document.body.classList.add("compare-bar-active");
    if (elements.compareCountText) {
      elements.compareCountText.textContent = `Vybráno k porovnání: ${count} ${count === 1 ? 'produkt' : count < 5 ? 'produkty' : 'produktů'} (max 3)`;
    }
  } else {
    elements.compareBar.setAttribute("aria-hidden", "true");
    document.body.classList.remove("compare-bar-active");
  }
}

function openCompareModal() {
  if (state.compareIds.length === 0) return;
  state.isCompareOpen = true;
  if (elements.compareModal) {
    elements.compareModal.removeAttribute("aria-hidden");
  }
  renderCompareTable();
}

function closeCompareModal() {
  state.isCompareOpen = false;
  if (elements.compareModal) {
    elements.compareModal.setAttribute("aria-hidden", "true");
  }
}

function renderCompareTable() {
  if (!elements.compareTable) return;
  const products = catalog.filter((p) => state.compareIds.includes(p.id));
  if (products.length === 0) {
    closeCompareModal();
    return;
  }

  const headerRow = `
    <tr>
      <th>Vlastnost</th>
      ${products.map(p => `
        <td>
          <div class="compare-product-header">
            <h4>${p.name}</h4>
            ${qualityBadge(p.quality)}
            <div>
              <button class="remove-compare-item" data-remove-id="${p.id}">Odstranit</button>
            </div>
          </div>
        </td>
      `).join("")}
    </tr>
  `;

  const specs = [
    { key: "typeLabel", label: "Typ" },
    { key: "sku", label: "SKU" },
    { key: "size", label: "Rozměry" },
    { key: "height", label: "Výška / Hřejivost", custom: p => p.warmth || p.height || "-" },
    { key: "filling", label: "Náplň" },
    { key: "cover", label: "Potah" },
    { key: "description", label: "Popis" }
  ];

  const specRows = specs.map(spec => `
    <tr>
      <th>${spec.label}</th>
      ${products.map(p => `
        <td>${spec.custom ? spec.custom(p) : (p[spec.key] || "-")}</td>
      `).join("")}
    </tr>
  `).join("");

  elements.compareTable.innerHTML = `<thead>${headerRow}</thead><tbody>${specRows}</tbody>`;

  // Bind delete buttons inside comparison table
  elements.compareTable.querySelectorAll(".remove-compare-item").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleCompareProduct(btn.dataset.removeId);
      renderCompareTable();
    });
  });
}

function copySkuToClipboard(sku, buttonElement) {
  if (!navigator.clipboard) {
    const textArea = document.createElement("textarea");
    textArea.value = sku;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showCopyFeedback(buttonElement);
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textArea);
    return;
  }
  navigator.clipboard.writeText(sku).then(() => {
    showCopyFeedback(buttonElement);
  }, (err) => {
    console.error("Chyba při kopírování SKU: ", err);
  });
}

function showCopyFeedback(btn) {
  const existing = btn.querySelector(".copy-feedback");
  if (existing) existing.remove();
  
  const feedback = document.createElement("span");
  feedback.className = "copy-feedback";
  feedback.textContent = "Zkopírováno!";
  btn.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 1000);
}

const wizardSteps = [
  {
    question: "Který produkt hledáte?",
    key: "type",
    options: [
      { value: "pillow", label: "Polštář", desc: "Podpora krční páteře" },
      { value: "blanket", label: "Přikrývka", desc: "Tepelný komfort během noci" },
      { value: "set", label: "Set", desc: "Zvýhodněná sada polštáře a přikrývky" }
    ]
  },
  {
    question: "Jakou kvalitativní řadu preferujete?",
    key: "quality",
    options: [
      { value: "all", label: "Nezáleží mi na tom", desc: "Zobrazit všechny řady" },
      { value: "BASIC", label: "BASIC", desc: "Dostupná kvalita za skvělou cenu" },
      { value: "PLUS", label: "PLUS", desc: "Kvalitní produkty s delší zárukou" },
      { value: "GOLD", label: "GOLD", desc: "Špičkové materiály a maximální komfort" }
    ]
  },
  {
    question: "V jaké poloze nejraději spíte? (pouze pro polštáře)",
    key: "sleep",
    condition: answers => answers.type === "pillow" || answers.type === "set",
    options: [
      { value: "side", label: "Na boku", desc: "Potřebujete vyšší a pevnější polštář" },
      { value: "back", label: "Na zádech", desc: "Středně vysoký polštář pro oporu hlavy" },
      { value: "stomach", label: "Na břiše", desc: "Nízký a měkký polštář, aby se neprohýbal krk" }
    ]
  },
  {
    question: "Hledáte spíše hřejivější nebo chladnější přikrývku?",
    key: "warmth",
    condition: answers => answers.type === "blanket" || answers.type === "set",
    options: [
      { value: "cool", label: "Chladivá", desc: "Na léto nebo pro ty, kterým bývá horko" },
      { value: "warm", label: "Teplá", desc: "Standardní celoroční hřejivost" },
      { value: "extraWarm", label: "Extra teplá", desc: "Na zimu nebo pro zimomřivé lidi" }
    ]
  },
  {
    question: "Má zákazník alergie nebo citlivou pokožku?",
    key: "allergy",
    options: [
      { value: "yes", label: "Ano", desc: "Doporučit syntetické nebo vyvařovací produkty" },
      { value: "no", label: "Ne", desc: "Všechny produkty jsou vhodné" }
    ]
  }
];

function openWizard() {
  state.isWizardOpen = true;
  state.wizardStep = 0;
  state.wizardAnswers = {
    type: state.type,
    quality: state.quality,
    sleep: state.sleep,
    warmth: state.warmth,
    allergy: state.allergy ? "yes" : "no"
  };
  if (elements.wizardModal) {
    elements.wizardModal.removeAttribute("aria-hidden");
  }
  renderWizardStep();
}

function closeWizard() {
  state.isWizardOpen = false;
  if (elements.wizardModal) {
    elements.wizardModal.setAttribute("aria-hidden", "true");
  }
}

function getActiveWizardSteps() {
  return wizardSteps.filter(step => !step.condition || step.condition(state.wizardAnswers));
}

function renderWizardStep() {
  const activeSteps = getActiveWizardSteps();
  const stepData = activeSteps[state.wizardStep];
  if (!stepData) return;

  if (elements.wizardProgress) {
    const progress = ((state.wizardStep + 1) / activeSteps.length) * 100;
    elements.wizardProgress.style.width = `${progress}%`;
  }

  if (elements.wizardBackBtn) {
    if (state.wizardStep === 0) {
      elements.wizardBackBtn.style.visibility = "hidden";
    } else {
      elements.wizardBackBtn.style.visibility = "visible";
    }
  }

  if (elements.wizardNextBtn) {
    if (state.wizardStep === activeSteps.length - 1) {
      elements.wizardNextBtn.textContent = "Dokončit a filtrovat";
    } else {
      elements.wizardNextBtn.textContent = "Pokračovat";
    }
  }

  const optionsHtml = stepData.options.map(opt => {
    const isSelected = state.wizardAnswers[stepData.key] === opt.value ? " is-selected" : "";
    return `
      <div class="wizard-option-card${isSelected}" data-wizard-value="${opt.value}">
        <strong>${opt.label}</strong>
        <span>${opt.desc}</span>
      </div>
    `;
  }).join("");

  if (elements.wizardStepContent) {
    elements.wizardStepContent.innerHTML = `
      <p class="wizard-question">${stepData.question}</p>
      <div class="wizard-options-grid">
        ${optionsHtml}
      </div>
    `;

    elements.wizardStepContent.querySelectorAll(".wizard-option-card").forEach(card => {
      card.addEventListener("click", () => {
        state.wizardAnswers[stepData.key] = card.dataset.wizardValue;
        renderWizardStep();
      });
    });
  }
}

function navigateWizard(direction) {
  const activeSteps = getActiveWizardSteps();
  const nextIndex = state.wizardStep + direction;
  
  if (nextIndex < 0) return;
  if (nextIndex >= activeSteps.length) {
    applyWizardResults();
    return;
  }
  
  state.wizardStep = nextIndex;
  renderWizardStep();
}

function applyWizardResults() {
  const answers = state.wizardAnswers;
  state.type = answers.type;
  state.quality = answers.quality;
  if (answers.type === "pillow" || answers.type === "set") {
    state.sleep = answers.sleep;
    if (elements.sleepSelect) elements.sleepSelect.value = answers.sleep;
  }
  if (answers.type === "blanket" || answers.type === "set") {
    state.warmth = answers.warmth;
    if (elements.warmthSelect) elements.warmthSelect.value = answers.warmth;
  }
  state.allergy = answers.allergy === "yes";
  if (elements.allergyToggle) elements.allergyToggle.checked = state.allergy;
  
  selectFirstVisibleProduct();
  closeWizard();
  render();
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
