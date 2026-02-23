// assets/js/lightbox.js
(function () {
    function ensureMarkup() {
        if (document.getElementById("lightbox")) return;

        const wrap = document.createElement("div");
        wrap.innerHTML = `
<div class="lightbox" id="lightbox" aria-hidden="true">
  <div class="lightbox__backdrop" data-lb-close></div>
  <div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="Artwork preview">
    <button class="lightbox__btn lightbox__btn--close" type="button" aria-label="Close" data-lb-close>×</button>
    <button class="lightbox__btn lightbox__btn--prev" type="button" aria-label="Previous" data-lb-prev>‹</button>
    <button class="lightbox__btn lightbox__btn--next" type="button" aria-label="Next" data-lb-next>›</button>
    <div class="lightbox__stage">
      <img class="lightbox__img" alt="" draggable="false">
      <div class="lightbox__caption" id="lightboxCaption"></div>
    </div>
  </div>
</div>`;
        document.body.appendChild(wrap.firstElementChild);
    }

    function mount(rootEl) {
        ensureMarkup();

        const root = rootEl || document;
        const imgs = Array.from(root.querySelectorAll(".slot img"))
            .filter((img) => img.getAttribute("src"));

        if (!imgs.length) return;

        const lb = document.getElementById("lightbox");
        const lbImg = lb.querySelector(".lightbox__img");
        const caption = document.getElementById("lightboxCaption");
        const btnPrev = lb.querySelector("[data-lb-prev]");
        const btnNext = lb.querySelector("[data-lb-next]");
        const closeEls = lb.querySelectorAll("[data-lb-close]");

        let index = -1;
        let lastFocus = null;

        const preload = (i) => { const p = new Image(); p.src = imgs[i].currentSrc || imgs[i].src; };

        const updateNav = () => {
            const many = imgs.length > 1;
            btnPrev.style.display = many ? "" : "none";
            btnNext.style.display = many ? "" : "none";
        };

        const setIndex = (i) => {
            index = (i + imgs.length) % imgs.length;
            const img = imgs[index];
            const src = img.currentSrc || img.src;
            const alt = img.getAttribute("alt") || "";

            preload((index - 1 + imgs.length) % imgs.length);
            preload((index + 1) % imgs.length);

            lbImg.src = src;
            lbImg.alt = alt;
            caption.textContent = alt ? alt : `${index + 1} / ${imgs.length}`;
            updateNav();
        };

        const openAt = (i) => {
            lastFocus = document.activeElement;
            lb.classList.add("is-open");
            lb.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            setIndex(i);
            (lb.querySelector("[data-lb-close]") || lb).focus?.();
        };

        const close = () => {
            lb.classList.remove("is-open");
            lb.setAttribute("aria-hidden", "true");
            lbImg.removeAttribute("src");
            document.body.style.overflow = "";
            index = -1;
            lastFocus?.focus?.();
        };

        const next = () => { if (index >= 0) setIndex(index + 1); };
        const prev = () => { if (index >= 0) setIndex(index - 1); };

        // cleanup for repeated route mounts
        if (lb.__lbCleanup) lb.__lbCleanup();

        const onDocClick = (e) => {
            const img = e.target.closest?.(".slot img");
            if (!img) return;
            const i = imgs.indexOf(img);
            if (i === -1) return;
            openAt(i);
        };

        const onKey = (e) => {
            if (!lb.classList.contains("is-open")) return;
            if (e.key === "Escape") close();
            else if (e.key === "ArrowRight") next();
            else if (e.key === "ArrowLeft") prev();
        };

        document.addEventListener("click", onDocClick, true);
        window.addEventListener("keydown", onKey);

        btnNext.onclick = (e) => { e.stopPropagation(); next(); };
        btnPrev.onclick = (e) => { e.stopPropagation(); prev(); };
        closeEls.forEach((el) => el.onclick = (e) => { e.stopPropagation(); close(); });

        lb.__lbCleanup = () => {
            document.removeEventListener("click", onDocClick, true);
            window.removeEventListener("keydown", onKey);
            btnNext.onclick = null;
            btnPrev.onclick = null;
            closeEls.forEach((el) => el.onclick = null);
            lb.__lbCleanup = null;
        };
    }

    window.Lightbox = { mount };
})();