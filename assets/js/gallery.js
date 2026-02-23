let state = {
    images: null,
    rendered: 0,
    batch: 24,
    scrollY: 0,
    observer: null,
    mounted: false,
};

const STORAGE_KEY = "galleryStateV1";

function saveState() {
    const payload = {
        rendered: state.rendered,
        scrollY: window.scrollY || 0,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Number.isFinite(parsed.rendered)) state.rendered = parsed.rendered;
        if (Number.isFinite(parsed.scrollY)) state.scrollY = parsed.scrollY;
    } catch {
        // ignore
    }
}

async function loadImages() {
    if (state.images) return state.images;

    const resp = await fetch("assets/data/derpi.json", { cache: "no-store" });
    if (!resp.ok) throw new Error(`Failed to load derpi.json: ${resp.status}`);
    const data = await resp.json();

    state.images = data.images || [];
    return state.images;
}

function renderNext(grid) {
    if (!state.images) return;
    const start = state.rendered;
    const end = Math.min(state.rendered + state.batch, state.images.length);
    if (start >= end) return;

    const chunk = state.images.slice(start, end);
    const html = chunk.map(img => `
    <a class="gallery-item" href="${img.link}" target="_blank" rel="noopener">
      <img loading="lazy" src="${img.thumb}" alt="Artwork ${img.id}">
    </a>
  `).join("");

    grid.insertAdjacentHTML("beforeend", html);
    state.rendered = end;
}

function setupObserver(appEl) {
    const grid = appEl.querySelector("#gallery");
    const sentinel = appEl.querySelector("#gallery-sentinel");
    if (!grid || !sentinel) return;

    if (state.observer) state.observer.disconnect();

    state.observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                renderNext(grid);
                saveState();
            }
        }
    }, { root: null, rootMargin: "800px 0px", threshold: 0 });

    state.observer.observe(sentinel);
}

export async function mountGallery(appEl) {
    loadState();

    const grid = appEl.querySelector("#gallery");
    const meta = appEl.querySelector("#gallery-meta");
    if (!grid) return;
    grid.innerHTML = "";

    const images = await loadImages();

    const target = Math.min(state.rendered || state.batch, images.length);
    state.rendered = 0;

    while (state.rendered < target) {
        renderNext(grid);
    }

    if (meta) {
        meta.textContent = `Items: ${images.length}`;
    }

    setupObserver(appEl);

    requestAnimationFrame(() => {
        if (state.scrollY > 0) window.scrollTo(0, state.scrollY);
    });

    if (!state.mounted) {
        state.mounted = true;
        window.addEventListener("scroll", () => {
            saveState();
        }, { passive: true });
    }
}

export function unmountGallery() {
    saveState();
    if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
    }
}