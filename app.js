const CONFIG = {
    brandName: "Zentro Labs",
    contactEmail: "",
    copyrightYear: new Date().getFullYear()
};

document.addEventListener('DOMContentLoaded', () => {
    const root = document.body;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const shouldReduceMedia = reducedMotion || saveData;

    document.querySelectorAll("[data-brand]").forEach(el => el.textContent = CONFIG.brandName);
    document.querySelectorAll("[data-email-link]").forEach(el => {
        if (CONFIG.contactEmail) {
            el.setAttribute("href", `mailto:${CONFIG.contactEmail}`);
            if (el.textContent.includes("@")) el.textContent = CONFIG.contactEmail;
        } else {
            el.setAttribute("href", "#contact");
            if (el.textContent.includes("@")) el.textContent = "Contact form";
        }
    });
    const heroVideo = document.querySelector('[data-hero-video]');
    if (heroVideo && !shouldReduceMedia) {
        heroVideo.muted = true;
        heroVideo.play().catch(() => {
            window.addEventListener('click', () => {
                heroVideo.play().catch(() => {});
            }, { once: true });
        });
    } else if (heroVideo) {
        document.documentElement.classList.add("video-fallback");
        heroVideo.pause();
    }

    document.querySelectorAll("[data-year]").forEach(el => el.textContent = CONFIG.copyrightYear);

    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    if (toggle && menu) {
        toggle.addEventListener("click", () => {
            const isOpen = menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
            root.classList.toggle("menu-open", isOpen);
        });

        menu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                root.classList.remove("menu-open");
            });
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                root.classList.remove("menu-open");
            }
        });

        document.addEventListener("click", (event) => {
            const clickedInsideMenu = menu.contains(event.target);
            const clickedToggle = toggle.contains(event.target);
            if (!clickedInsideMenu && !clickedToggle) {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                root.classList.remove("menu-open");
            }
        });
    }

    const header = document.querySelector("[data-header]");
    window.addEventListener("scroll", () => {
        if (header) header.classList.toggle("is-scrolled", window.scrollY > 50);
    }, { passive: true });
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 50);

    // Basic Entrance Reveal
    const revealItems = document.querySelectorAll('[data-reveal]');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px"
    });

    revealItems.forEach(el => revealObserver.observe(el));

    const showcaseCards = document.querySelectorAll('.showcase-card');
    const showcaseVideos = document.querySelectorAll('.showcase-media video');

    if (showcaseCards.length > 0) {
        showcaseCards[0].classList.add('is-active');
        const firstVideo = showcaseCards[0].querySelector('video');
        if (firstVideo && !shouldReduceMedia) firstVideo.play().catch(() => { });

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = entry.target;
                const video = card.querySelector('video');

                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    showcaseCards.forEach(c => c.classList.remove('is-active'));
                    card.classList.add('is-active');
                    showcaseVideos.forEach(v => { if (v !== video) v.pause(); });
                    if (video && !shouldReduceMedia) video.play().catch(() => { });
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

    const form = document.querySelector("[data-contact-form]");
    const formStatus = document.querySelector("#form-status");
    if (form && formStatus) {
        form.addEventListener("submit", () => {
            formStatus.textContent = "Sending your message...";
        });
    }
});
