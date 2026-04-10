const CONFIG = {
    brandName: "Zentro Labs",
    contactEmail: "hello@zentrolabs.com",
    whatsappPrefillText: "Hi Zentro Labs, I want to discuss a project.",
    copyrightYear: new Date().getFullYear()
};

document.addEventListener('DOMContentLoaded', () => {
    const heroVideo = document.querySelector('[data-hero-video]');
    if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.play().catch(() => {
            window.addEventListener('click', () => {
                heroVideo.play().catch(() => {});
            }, { once: true });
        });
    }

    document.querySelectorAll("[data-year]").forEach(el => el.textContent = CONFIG.copyrightYear);

    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    if (toggle && menu) {
        toggle.addEventListener("click", () => {
            const isOpen = menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
        });

        menu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    const header = document.querySelector("[data-header]");
    window.addEventListener("scroll", () => {
        if (header) header.classList.toggle("is-scrolled", window.scrollY > 50);
    }, { passive: true });

    const revealItems = document.querySelectorAll('[data-reveal]');
    const revealObserver = new IntersectionObserver((entries) => {
        let delayCount = 0;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (!el.style.getPropertyValue('--reveal-delay')) {
                    el.style.setProperty('--reveal-delay', `${delayCount * 100}ms`);
                    delayCount++;
                }
                el.classList.add('is-visible');
                revealObserver.unobserve(el);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px"
    });

    revealItems.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('is-visible');
        } else {
            revealObserver.observe(el);
        }
    });

    const showcaseCards = document.querySelectorAll('.showcase-card');
    const showcaseVideos = document.querySelectorAll('.showcase-media video');

    if (showcaseCards.length > 0) {
        showcaseCards[0].classList.add('is-active');
        const firstVideo = showcaseCards[0].querySelector('video');
        if (firstVideo) firstVideo.play().catch(() => { });

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = entry.target;
                const video = card.querySelector('video');

                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    showcaseCards.forEach(c => c.classList.remove('is-active'));
                    card.classList.add('is-active');
                    showcaseVideos.forEach(v => { if (v !== video) v.pause(); });
                    if (video) video.play().catch(() => { });
                } else {
                    card.classList.remove('is-active');
                    if (video) video.pause();
                }
            });
        }, { threshold: 0.5 });

        showcaseCards.forEach(card => videoObserver.observe(card));
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix || '';
                let count = 0;
                const duration = 2000;
                const step = target / (duration / 16);

                const timer = setInterval(() => {
                    count += step;
                    if (count >= target) {
                        el.textContent = prefix + target + suffix;
                        clearInterval(timer);
                    } else {
                        el.textContent = prefix + Math.floor(count) + suffix;
                    }
                }, 16);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

    document.querySelectorAll('details').forEach(detail => {
        detail.addEventListener('toggle', () => {
            if (detail.open) {
                document.querySelectorAll('details').forEach(other => {
                    if (other !== detail) other.open = false;
                });
            }
        });
    });
});
