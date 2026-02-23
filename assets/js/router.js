const routes = {
    home: "partials/home.html",
    prices: "partials/prices.html",
    terms: "partials/terms.html",
};

function getRouteFromHash() {
    const raw = (location.hash || "#home").replace("#", "").trim();
    return routes[raw] ? raw : "home";
}

function setActiveNav(route) {
    document.querySelectorAll('[data-route]').forEach(a => {
        a.classList.toggle("is-active", a.getAttribute("data-route") === route);
    });
}

async function loadRoute(route) {
    const url = routes[route];
    const app = document.getElementById("app");

    setActiveNav(route);

    try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const html = await res.text();

        app.innerHTML = html;

        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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