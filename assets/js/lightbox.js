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
        const stage = lb.querySelector(".lightbox__stage");

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

        let startX = 0, startY = 0, lastX = 0, lastY = 0;
        let tracking = false, swipeDecided = false, preventScroll = false;

        const SWIPE_MIN_X = 40;
        const SWIPE_MAX_Y = 80;
        const DECIDE_T = 8;

        const resetSwipe = () => {
            tracking = false;
            swipeDecided = false;
            preventScroll = false;
        };

        const onSwipeStart = (x, y) => {
            if (!lb.classList.contains("is-open")) return;
            tracking = true;
            swipeDecided = false;
            preventScroll = false;
            startX = lastX = x;
            startY = lastY = y;
        };

        const onSwipeMove = (x, y, e) => {
            if (!tracking) return;

            lastX = x;
            lastY = y;

            const dx = lastX - startX;
            const dy = lastY - startY;

            if (!swipeDecided) {
                if (Math.abs(dx) >= DECIDE_T || Math.abs(dy) >= DECIDE_T) {
                    swipeDecided = true;
                    preventScroll = Math.abs(dx) > Math.abs(dy);
                }
            }

            if (preventScroll) e.preventDefault?.();
        };

        const onSwipeEnd = () => {
            if (!tracking) return;

            const dx = lastX - startX;
            const dy = lastY - startY;

            if (Math.abs(dx) >= SWIPE_MIN_X && Math.abs(dy) <= SWIPE_MAX_Y) {
                if (dx < 0) next();
                else prev();
            }

            resetSwipe();
        };

        const supportsPointer = "PointerEvent" in window;

        let peDown, peMove, peUp, peCancel;
        let teStart, teMove, teEnd, teCancel;

        if (supportsPointer) {
            peDown = (e) => {
                if (e.pointerType === "mouse") return;
                onSwipeStart(e.clientX, e.clientY);
            };
            peMove = (e) => {
                if (!tracking) return;
                onSwipeMove(e.clientX, e.clientY, e);
            };
            peUp = () => onSwipeEnd();
            peCancel = () => resetSwipe();

            stage.addEventListener("pointerdown", peDown, { passive: true });
            stage.addEventListener("pointermove", peMove, { passive: false });
            stage.addEventListener("pointerup", peUp, { passive: true });
            stage.addEventListener("pointercancel", peCancel, { passive: true });
        } else {
            teStart = (e) => {
                const t = e.touches && e.touches[0];
                if (!t) return;
                onSwipeStart(t.clientX, t.clientY);
            };
            teMove = (e) => {
                const t = e.touches && e.touches[0];
                if (!t) return;
                onSwipeMove(t.clientX, t.clientY, e);
            };
            teEnd = () => onSwipeEnd();
            teCancel = () => resetSwipe();

            stage.addEventListener("touchstart", teStart, { passive: true });
            stage.addEventListener("touchmove", teMove, { passive: false });
            stage.addEventListener("touchend", teEnd, { passive: true });
            stage.addEventListener("touchcancel", teCancel, { passive: true });
        }

        lb.__lbCleanup = () => {
            document.removeEventListener("click", onDocClick, true);
            window.removeEventListener("keydown", onKey);
            btnNext.onclick = null;
            btnPrev.onclick = null;
            closeEls.forEach((el) => el.onclick = null);

            if (supportsPointer) {
                if (peDown) stage.removeEventListener("pointerdown", peDown);
                if (peMove) stage.removeEventListener("pointermove", peMove);
                if (peUp) stage.removeEventListener("pointerup", peUp);
                if (peCancel) stage.removeEventListener("pointercancel", peCancel);
            } else {
                if (teStart) stage.removeEventListener("touchstart", teStart);
                if (teMove) stage.removeEventListener("touchmove", teMove);
                if (teEnd) stage.removeEventListener("touchend", teEnd);
                if (teCancel) stage.removeEventListener("touchcancel", teCancel);
            }

            lb.__lbCleanup = null;
        };
    }

    window.Lightbox = { mount };
})();