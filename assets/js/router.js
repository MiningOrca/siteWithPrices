import { mountGallery, unmountGallery } from "./gallery.js";

const routes = {
    home: "partials/home.html",
    prices: "partials/prices.html",
    terms: "partials/terms.html",
    gallery: "partials/gallery.html",
};

function getRouteFromHash() {
    const raw = (location.hash || "#home").replace("#", "").trim();
    return routes[raw] ? raw : "home";
}

function setActiveNav(route) {
    document.querySelectorAll("[data-route]").forEach((a) => {
        a.classList.toggle("is-active", a.getAttribute("data-route") === route);
    });
}

/**
 * Loads a script only once (safe across route changes)
 */
function loadScriptOnce(src) {
    if (document.querySelector(`script[data-dyn="${src}"]`)) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.defer = true;
        s.dataset.dyn = src;

        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));

        document.head.appendChild(s);
    });
}

/**
 * Route initializers: executed AFTER partial HTML is injected into #app
 */
const routeInits = {
    home: async (_app) => {},
    terms: async (_app) => {},

    // Prices: load lightbox once, then mount it on current page content
    prices: async (app) => {
        await loadScriptOnce("assets/js/lightbox.js");

        if (window.Lightbox && typeof window.Lightbox.mount === "function") {
            window.Lightbox.mount(app);
        } else {
            console.warn("[router] Lightbox API not found. Check assets/js/lightbox.js");
        }
    },

    gallery: async (app) => {
        await mountGallery(app);
    },
};

let currentRoute = null;

async function loadRoute(route) {
    const url = routes[route];
    const app = document.getElementById("app");

    if (currentRoute === "gallery" && route !== "gallery") {
        unmountGallery();
    }

    setActiveNav(route);

    try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const html = await res.text();

        app.innerHTML = html;
        const init = routeInits[route];
        if (typeof init === "function") {
            await init(app);
        }
        currentRoute = route;

        // Reset scroll for all pages EXCEPT gallery (gallery restores its own scroll)
        if (route !== "gallery") {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
    } catch (e) {
        app.innerHTML = `
      <div class="section">
        <div class="kicker">Error</div>
        <h1 class="title">Can't load page</h1>
        <div class="hr"></div>
        <p class="muted">${String(e)}</p>
      </div>
    `;
    }
}

function onNavigate() {
    const route = getRouteFromHash();
    loadRoute(route);
}

window.addEventListener("hashchange", onNavigate);
window.addEventListener("DOMContentLoaded", onNavigate);