// Global App State
let allNotes = [];
let selectedNoteIds = new Set();
let currentFilter = "all";

// DOM Elements
const notesGrid = document.getElementById("notes-grid");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const refreshBtn = document.getElementById("refresh-btn");
const refreshIcon = document.getElementById("refresh-icon");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeCheckbox = document.getElementById("theme-checkbox");
const exportCsvBtn = document.getElementById("export-csv-btn");
const selectAllCheckbox = document.getElementById("select-all-checkbox");
const selectionDrawer = document.getElementById("selection-drawer");
const selectedCountBadge = document.getElementById("selected-count-badge");
const clearSelectionBtn = document.getElementById("clear-selection-btn");
const tweetSelectedBtn = document.getElementById("tweet-selected-btn");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  fetchReleaseNotes();

  // Event Listeners
  refreshBtn.addEventListener("click", fetchReleaseNotes);
  searchInput.addEventListener("input", filterAndRenderNotes);
  clearSelectionBtn.addEventListener("click", clearSelection);
  tweetSelectedBtn.addEventListener("click", tweetSelected);
  selectAllCheckbox.addEventListener("change", handleSelectAll);
  exportCsvBtn.addEventListener("click", handleExportCSV);

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter.toLowerCase();
      filterAndRenderNotes();
    });
  });
});

// Theme Management (Toggle Switch)
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  
  // checkbox checked = light theme, unchecked = dark theme
  themeCheckbox.checked = (savedTheme === "light");

  themeCheckbox.addEventListener("change", () => {
    const newTheme = themeCheckbox.checked ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

// Export to CSV Handler
function handleExportCSV() {
  const searchQuery = searchInput.value.toLowerCase().trim();
  const filteredNotes = allNotes.filter(note => {
    const matchesFilter = currentFilter === "all" || note.type.toLowerCase() === currentFilter;
    const textToSearch = `${note.date} ${note.type} ${note.description}`.toLowerCase();
    const matchesSearch = !searchQuery || textToSearch.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  if (filteredNotes.length === 0) {
    showToast("No updates to export!");
    return;
  }

  const headers = ["Date", "Category", "Link", "Description"];
  const rows = filteredNotes.map(note => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = note.description;
    const plainText = (tempDiv.textContent || tempDiv.innerText || "").replace(/"/g, '""').trim();
    return [
      `"${note.date}"`,
      `"${note.type}"`,
      `"${note.link}"`,
      `"${plainText}"`
    ].join(",");
  });

  const csvString = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${filteredNotes.length} updates to CSV!`);
}

// Fetch Notes from API
async function fetchReleaseNotes() {
  // Show spinner
  refreshIcon.classList.add("spinning");
  refreshBtn.disabled = true;
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");

  // Keep existing cards but show loading
  const cards = document.querySelectorAll(".note-card");
  cards.forEach(c => c.style.opacity = "0.5");

  try {
    const response = await fetch("/api/release-notes");
    const data = await response.json();

    if (data.success) {
      allNotes = data.notes;
      clearSelection();
      filterAndRenderNotes();
    } else {
      showToast("Error: " + (data.error || "Failed to fetch release notes"));
    }
  } catch (err) {
    showToast("Network error fetching release notes");
    console.error(err);
  } finally {
    refreshIcon.classList.remove("spinning");
    refreshBtn.disabled = false;
    loadingState.classList.add("hidden");
  }
}

// Filter and Render Notes
function filterAndRenderNotes() {
  const searchQuery = searchInput.value.toLowerCase().trim();
  
  // Filter notes
  const filteredNotes = allNotes.filter(note => {
    const matchesFilter = currentFilter === "all" || note.type.toLowerCase() === currentFilter;
    
    // Simple text match
    const textToSearch = `${note.date} ${note.type} ${note.description}`.toLowerCase();
    const matchesSearch = !searchQuery || textToSearch.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  // Render
  renderNotesGrid(filteredNotes);
  updateShowingCount(filteredNotes.length);
  updateSelectAllCheckboxState(filteredNotes);
}

function renderNotesGrid(notes) {
  // Remove existing note cards (keep loading/empty states)
  const existingCards = notesGrid.querySelectorAll(".note-card");
  existingCards.forEach(card => card.remove());

  if (notes.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = `card note-card ${selectedNoteIds.has(note.id) ? "selected" : ""}`;
    card.dataset.id = note.id;

    // Get color badge class
    const typeLower = note.type.toLowerCase();
    let badgeClass = "badge-general";
    if (["feature", "breaking", "issue", "change", "announcement"].includes(typeLower)) {
      badgeClass = `badge-${typeLower}`;
    }

    card.innerHTML = `
      <div class="note-card-header">
        <div class="note-meta">
          <span class="note-date">${note.date}</span>
          <span class="type-badge ${badgeClass}">${note.type}</span>
        </div>
        <label class="checkbox-container">
          <input type="checkbox" class="note-checkbox" ${selectedNoteIds.has(note.id) ? "checked" : ""}>
          <span class="checkmark"></span>
        </label>
      </div>
      <div class="note-card-body">
        ${note.description}
      </div>
      <div class="note-card-footer">
        <button class="btn-card-action copy-text" title="Copy update text">
          <i class="fa-regular fa-copy"></i>
        </button>
        <button class="btn-card-action copy-link" title="Copy original link">
          <i class="fa-solid fa-link"></i>
        </button>
        <button class="btn-card-action tweet" title="Tweet this update">
          <i class="fa-brands fa-x-twitter"></i>
        </button>
      </div>
    `;

    // Event Listeners for Card
    const checkbox = card.querySelector(".note-checkbox");
    checkbox.addEventListener("change", (e) => {
      toggleNoteSelection(note.id, e.target.checked);
    });

    // Toggle select by clicking empty card space (excluding links/buttons/checkboxes)
    card.addEventListener("click", (e) => {
      if (
        e.target.tagName !== "A" && 
        e.target.tagName !== "INPUT" && 
        !e.target.closest(".btn-card-action") && 
        !e.target.closest(".checkbox-container")
      ) {
        const isChecked = !checkbox.checked;
        checkbox.checked = isChecked;
        toggleNoteSelection(note.id, isChecked);
      }
    });

    // Copy text handler
    card.querySelector(".copy-text").addEventListener("click", (e) => {
      e.stopPropagation();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = note.description;
      const plainText = (tempDiv.textContent || tempDiv.innerText || "").trim();
      navigator.clipboard.writeText(plainText).then(() => {
        showToast("Update text copied to clipboard!");
      });
    });

    // Copy link handler
    card.querySelector(".copy-link").addEventListener("click", (e) => {
      e.stopPropagation();
      if (note.link) {
        navigator.clipboard.writeText(note.link).then(() => {
          showToast("Original release note link copied!");
        });
      } else {
        showToast("No direct link available for this update.");
      }
    });

    // Tweet single handler
    card.querySelector(".tweet").addEventListener("click", (e) => {
      e.stopPropagation();
      tweetSingle(note);
    });

    notesGrid.appendChild(card);
  });
}

// Selection Handlers
function toggleNoteSelection(noteId, isSelected) {
  const card = document.querySelector(`.note-card[data-id="${noteId}"]`);
  
  if (isSelected) {
    selectedNoteIds.add(noteId);
    if (card) card.classList.add("selected");
  } else {
    selectedNoteIds.delete(noteId);
    if (card) card.classList.remove("selected");
  }

  updateSelectionDrawer();
}

function handleSelectAll(e) {
  const isChecked = e.target.checked;
  const visibleCards = notesGrid.querySelectorAll(".note-card");

  visibleCards.forEach(card => {
    const noteId = card.dataset.id;
    const checkbox = card.querySelector(".note-checkbox");
    checkbox.checked = isChecked;
    
    if (isChecked) {
      selectedNoteIds.add(noteId);
      card.classList.add("selected");
    } else {
      selectedNoteIds.delete(noteId);
      card.classList.remove("selected");
    }
  });

  updateSelectionDrawer();
}

function clearSelection() {
  selectedNoteIds.clear();
  selectAllCheckbox.checked = false;
  
  const cards = document.querySelectorAll(".note-card");
  cards.forEach(card => {
    card.classList.remove("selected");
    const checkbox = card.querySelector(".note-checkbox");
    if (checkbox) checkbox.checked = false;
  });

  updateSelectionDrawer();
}

function updateSelectionDrawer() {
  const size = selectedNoteIds.size;
  if (size > 0) {
    selectedCountBadge.textContent = size;
    selectionDrawer.classList.remove("hidden");
  } else {
    selectionDrawer.classList.add("hidden");
  }
}

// Tweet Functions
function tweetSingle(note) {
  // Extract text content from description HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = note.description;
  const rawText = tempDiv.textContent || tempDiv.innerText || "";
  
  // Format tweet
  const intro = `BigQuery [${note.type}] (${note.date}): `;
  const hashtag = "\n\n#GoogleCloud #BigQuery";
  const url = note.link ? `\nRead more: ${note.link}` : "";
  
  // Max Tweet Limit is 280. Calculate remaining space.
  const fixedLength = intro.length + url.length + hashtag.length;
  const maxBodyLength = 280 - fixedLength - 5; // buffer
  
  let tweetBody = rawText.trim();
  if (tweetBody.length > maxBodyLength) {
    tweetBody = tweetBody.substring(0, maxBodyLength - 3) + "...";
  }

  const tweetText = `${intro}${tweetBody}${url}${hashtag}`;
  openTwitterIntent(tweetText);
}

function tweetSelected() {
  if (selectedNoteIds.size === 0) return;

  // Find all selected notes objects
  const selectedNotes = allNotes.filter(note => selectedNoteIds.has(note.id));

  let tweetText = "";
  if (selectedNotes.length === 1) {
    tweetSingle(selectedNotes[0]);
    return;
  }

  // Multi-update tweet styling
  const intro = `New BigQuery Updates (${selectedNotes[0].date}):\n`;
  const hashtag = "\n#GoogleCloud #BigQuery";
  const link = "\nRelease Notes: https://docs.cloud.google.com/bigquery/docs/release-notes";
  
  const fixedLength = intro.length + link.length + hashtag.length;
  const maxItemsLength = 280 - fixedLength - 10;

  let itemsText = "";
  selectedNotes.forEach((note, idx) => {
    // Extract short summary
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = note.description;
    let descText = tempDiv.textContent || tempDiv.innerText || "";
    descText = descText.replace(/\s+/g, " ").trim();
    if (descText.length > 50) descText = descText.substring(0, 47) + "...";
    
    itemsText += `${idx + 1}. [${note.type}] ${descText}\n`;
  });

  if (itemsText.length > maxItemsLength) {
    itemsText = itemsText.substring(0, maxItemsLength - 3) + "...";
  }

  tweetText = `${intro}${itemsText}${link}${hashtag}`;
  openTwitterIntent(tweetText);
}

function openTwitterIntent(text) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "width=550,height=420");
}

// Helpers
function updateShowingCount(count) {
  const showingCount = document.getElementById("showing-count");
  showingCount.textContent = `Showing ${count} update${count === 1 ? "" : "s"}`;
}

function updateSelectAllCheckboxState(visibleNotes) {
  if (visibleNotes.length === 0) {
    selectAllCheckbox.disabled = true;
    selectAllCheckbox.checked = false;
    return;
  }
  
  selectAllCheckbox.disabled = false;
  const allVisibleSelected = visibleNotes.every(note => selectedNoteIds.has(note.id));
  selectAllCheckbox.checked = allVisibleSelected;
}

function showToast(message) {
  // Remove existing toast if any
  const existingToast = document.querySelector(".toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-info-circle"></i> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
