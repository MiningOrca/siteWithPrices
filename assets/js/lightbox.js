(() => {
    function initLightbox() {
        const slotImgs = Array.from(document.querySelectorAll('.slot img'))
            .filter(img => img.getAttribute('src'));

        if (!slotImgs.length) return;

        const lb = document.getElementById('lightbox');
        if (!lb) return;

        const lbImg = lb.querySelector('.lightbox__img');
        const caption = document.getElementById('lightboxCaption');
        const btnPrev = lb.querySelector('[data-lb-prev]');
        const btnNext = lb.querySelector('[data-lb-next]');
        const closeEls = lb.querySelectorAll('[data-lb-close]');

        if (!lbImg) return;

        let index = -1;
        let lastFocus = null;

        const preload = (i) => {
            const src = slotImgs[i].currentSrc || slotImgs[i].src;
            const p = new Image();
            p.src = src;
        };

        const updateNav = () => {
            const many = slotImgs.length > 1;
            if (btnPrev) btnPrev.style.display = many ? '' : 'none';
            if (btnNext) btnNext.style.display = many ? '' : 'none';
        };

        const setIndex = (i) => {
            index = (i + slotImgs.length) % slotImgs.length;

            const img = slotImgs[index];
            const src = img.currentSrc || img.src;
            const alt = img.getAttribute('alt') || '';

            preload((index - 1 + slotImgs.length) % slotImgs.length);
            preload((index + 1) % slotImgs.length);

            lbImg.src = src;
            lbImg.alt = alt;

            if (caption) {
                caption.textContent = alt ? alt : `${index + 1} / ${slotImgs.length}`;
            }

            updateNav();
        };

        const openAt = (i) => {
            lastFocus = document.activeElement;

            lb.classList.add('is-open');
            lb.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            setIndex(i);

            const closeBtn = lb.querySelector('[data-lb-close]');
            if (closeBtn && closeBtn.focus) closeBtn.focus();
        };

        const close = () => {
            lb.classList.remove('is-open');
            lb.setAttribute('aria-hidden', 'true');
            lbImg.removeAttribute('src');
            document.body.style.overflow = '';
            index = -1;
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        };

        const next = () => { if (index >= 0) setIndex(index + 1); };
        const prev = () => { if (index >= 0) setIndex(index - 1); };

        document.addEventListener('click', (e) => {
            const img = e.target.closest?.('.slot img');
            if (!img) return;

            const i = slotImgs.indexOf(img);
            if (i === -1) return;

            openAt(i);
        }, true);

        if (btnNext) btnNext.addEventListener('click', (e) => { e.stopPropagation(); next(); });
        if (btnPrev) btnPrev.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
        closeEls.forEach(el =>
            el.addEventListener('click', (e) => { e.stopPropagation(); close(); })
        );

        window.addEventListener('keydown', (e) => {
            if (!lb.classList.contains('is-open')) return;

            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') next();
            else if (e.key === 'ArrowLeft') prev();
        });
    }

    window.addEventListener('load', initLightbox);
})();