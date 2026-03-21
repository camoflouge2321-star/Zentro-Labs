const SITE_CONFIG = Object.freeze({
    brandName: "Zentro Labs",
    contactEmail: "hello@zentrolabs.com",
    siteUrl: "https://zentrolabs.com/",
    whatsappPhone: "",
    whatsappPrefillText: "Hi Zentro Labs, I want to start a premium project.",
    copyrightYear: 2026
});

const WORK_ITEMS = Object.freeze([
    {
        index: "01",
        title: "Monoform Collective",
        category: "E-Commerce / Identity",
        description: "A conversion-focused commerce experience engineered to feel gallery-grade while preserving fast checkout flow.",
        altText: "Abstract editorial composition in deep slate and blue tones.",
        toneA: "#3f5e63",
        toneB: "#6f888f",
        layout: "feature"
    },
    {
        index: "02",
        title: "Nexus Sync",
        category: "SaaS / Product Narrative",
        description: "A modular marketing platform balancing investor-level clarity with onboarding simplicity for enterprise buyers.",
        altText: "Soft beige editorial panel with minimal geometric accents.",
        toneA: "#d6c4ad",
        toneB: "#efe6db",
        layout: "tall"
    },
    {
        index: "03",
        title: "Haus & Bauhaus",
        category: "Real Estate / Experience",
        description: "An architectural showcase site where immersive storytelling and lead qualification coexist without friction.",
        altText: "Muted ivory gradient with layered circular overlays.",
        toneA: "#ddd6c6",
        toneB: "#f4eee2",
        layout: "offset"
    },
    {
        index: "04",
        title: "Orbit Ledger",
        category: "FinTech / Web App",
        description: "A premium product landing ecosystem that increased demo intent and reduced drop-off in core decision paths.",
        altText: "Editorial steel-blue gradient with atmospheric highlights.",
        toneA: "#3b4d57",
        toneB: "#8ea3ad",
        layout: "balanced"
    }
]);

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
        switch (char) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "\"":
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return char;
        }
    });
}

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getWhatsAppUrl() {
    const sanitizedPhone = String(SITE_CONFIG.whatsappPhone || "").replace(/\D/g, "");
    const message = encodeURIComponent(SITE_CONFIG.whatsappPrefillText);

    if (sanitizedPhone.length >= 8) {
        return `https://wa.me/${sanitizedPhone}?text=${message}`;
    }

    return `https://wa.me/?text=${message}`;
}

function applySiteConfig() {
    document.querySelectorAll("[data-brand]").forEach((node) => {
        node.textContent = SITE_CONFIG.brandName;
    });

    document.querySelectorAll("[data-year]").forEach((node) => {
        node.textContent = String(SITE_CONFIG.copyrightYear);
    });

    document.querySelectorAll("[data-email-link]").forEach((link) => {
        link.setAttribute("href", `mailto:${SITE_CONFIG.contactEmail}`);
        if (!link.dataset.keepText) {
            link.textContent = SITE_CONFIG.contactEmail;
        }
    });

    const whatsappNote = document.querySelector("[data-whatsapp-note]");
    if (!whatsappNote) {
        return;
    }

    const sanitizedPhone = String(SITE_CONFIG.whatsappPhone || "").replace(/\D/g, "");
    if (sanitizedPhone.length >= 8) {
        whatsappNote.textContent = "";
        return;
    }

    whatsappNote.textContent = "Add your WhatsApp number in app.js -> SITE_CONFIG.whatsappPhone (include country code).";
}

function renderWorkItems() {
    const grid = document.querySelector("[data-work-grid]");
    if (!grid) {
        return;
    }

    grid.innerHTML = WORK_ITEMS.map((item) => {
        const layoutClass = `work-card--${escapeHtml(item.layout)}`;
        return `
            <article class="work-card ${layoutClass}" data-reveal style="--tone-a:${escapeHtml(item.toneA)}; --tone-b:${escapeHtml(item.toneB)};">
                <div class="work-media" role="img" aria-label="${escapeHtml(item.altText)}"></div>
                <div class="work-content">
                    <p class="work-type">${escapeHtml(item.category)}</p>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description)}</p>
                </div>
                <span class="work-index" aria-hidden="true">${escapeHtml(item.index)}</span>
            </article>
        `;
    }).join("");
}

function initHeroHeadline() {
    const heading = document.querySelector("[data-hero-headline]");
    if (!heading) {
        return;
    }

    const rawText = heading.textContent.replace(/\s+/g, " ").trim();
    heading.setAttribute("aria-label", rawText);

    const words = rawText.split(" ");
    heading.innerHTML = words
        .map((word, index) => {
            const delay = index * 90;
            return `<span class="hero-word" style="--delay:${delay}ms">${escapeHtml(word)}</span>`;
        })
        .join(" ");
}

function initRevealAnimations() {
    const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!revealItems.length) {
        return;
    }

    if (prefersReducedMotion()) {
        revealItems.forEach((item) => {
            item.style.setProperty("--reveal-delay", "0ms");
            item.classList.add("is-visible");
        });
        return;
    }

    document.body.classList.add("motion-ready");

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target);
            });
        },
        {
            threshold: 0.14,
            rootMargin: "0px 0px -6% 0px"
        }
    );

    revealItems.forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${(index % 6) * 70}ms`);
        observer.observe(item);
    });
}

function initParallax() {
    if (prefersReducedMotion()) {
        return;
    }

    const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
    if (!parallaxItems.length) {
        return;
    }

    const update = () => {
        const viewportHeight = window.innerHeight || 1;

        parallaxItems.forEach((item) => {
            const speed = Number(item.dataset.parallax) || 12;
            const rect = item.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const normalized = (midpoint - viewportHeight / 2) / viewportHeight;
            const y = Math.max(-speed, Math.min(speed, -normalized * speed));
            item.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
        });
    };

    let raf = 0;
    const onScroll = () => {
        if (raf) {
            return;
        }
        raf = window.requestAnimationFrame(() => {
            update();
            raf = 0;
        });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
}

function initVideoFallback() {
    const video = document.querySelector("[data-hero-video]");
    if (!video) {
        return;
    }

    const enableFallback = () => {
        document.documentElement.classList.add("video-fallback");
    };

    video.addEventListener("error", enableFallback);

    const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                // Keep the video visible even if autoplay is blocked.
                // A user interaction can still start playback.
            });
        }
    };

    if (video.readyState >= 2) {
        attemptPlay();
    } else {
        video.addEventListener("canplay", attemptPlay, { once: true });
    }

    window.addEventListener(
        "pointerdown",
        () => {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {
                    // No-op: some environments still block media despite interaction.
                });
            }
        },
        { once: true, passive: true }
    );
}


function initContactVideo() {
    const video = document.querySelector("[data-contact-video]");
    if (!video) {
        return;
    }

    const fallbackSrc = video.getAttribute("data-contact-fallback");
    let fallbackApplied = false;

    const applyFallback = () => {
        if (fallbackApplied || !fallbackSrc) {
            return;
        }

        fallbackApplied = true;
        video.pause();
        video.setAttribute("controls", "");
        video.innerHTML = `<source src="${fallbackSrc}" type="video/mp4" />`;
        video.load();
    };

    if (prefersReducedMotion()) {
        video.pause();
        video.removeAttribute("autoplay");
        video.setAttribute("controls", "");
        return;
    }

    const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                video.setAttribute("controls", "");
            });
        }
    };

    if (video.readyState >= 2) {
        attemptPlay();
    } else {
        video.addEventListener("canplay", attemptPlay, { once: true });
    }

    video.addEventListener("error", () => {
        applyFallback();
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                video.setAttribute("controls", "");
            });
        }
    });

    window.addEventListener(
        "pointerdown",
        () => {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {
                    video.setAttribute("controls", "");
                });
            }
        },
        { once: true, passive: true }
    );
}
function initMetricCounters() {
    const counters = Array.from(document.querySelectorAll("[data-counter]"));
    if (!counters.length) {
        return;
    }

    const setFinalValue = (counter) => {
        const target = Number(counter.dataset.target) || 0;
        const prefix = counter.dataset.prefix || "";
        const suffix = counter.dataset.suffix || "";
        counter.textContent = `${prefix}${target}${suffix}`;
    };

    if (prefersReducedMotion()) {
        counters.forEach(setFinalValue);
        return;
    }

    const animateCounter = (counter) => {
        const target = Number(counter.dataset.target) || 0;
        const prefix = counter.dataset.prefix || "";
        const suffix = counter.dataset.suffix || "";
        const startTime = performance.now();
        const duration = 1200;

        const frame = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            counter.textContent = `${prefix}${value}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(frame);
            }
        };

        window.requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                animateCounter(entry.target);
                obs.unobserve(entry.target);
            });
        },
        {
            threshold: 0.45
        }
    );

    counters.forEach((counter) => observer.observe(counter));
}

function initFaqAccordion() {
    const wrapper = document.querySelector("[data-faq]");
    if (!wrapper) {
        return;
    }

    const items = Array.from(wrapper.querySelectorAll("details"));
    items.forEach((item) => {
        item.addEventListener("toggle", () => {
            if (!item.open) {
                return;
            }
            items.forEach((other) => {
                if (other !== item) {
                    other.removeAttribute("open");
                }
            });
        });
    });
}

function initMenuToggle() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");

    if (!toggle || !menu) {
        return;
    }

    const closeMenu = () => {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) {
            closeMenu();
        }
    });
}

function initHeaderState() {
    const header = document.querySelector("[data-header]");
    const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));

    if (!header && !navLinks.length) {
        return;
    }

    const sectionMap = navLinks
        .map((link) => {
            const target = link.getAttribute("href");
            if (!target || !target.startsWith("#")) {
                return null;
            }

            const section = document.querySelector(target);
            if (!section) {
                return null;
            }

            return { link, section };
        })
        .filter(Boolean);

    const updateHeader = () => {
        if (!header) {
            return;
        }
        header.classList.toggle("is-scrolled", window.scrollY > 18);
    };

    const updateActiveLink = () => {
        if (!sectionMap.length) {
            return;
        }

        const marker = window.scrollY + window.innerHeight * 0.28;
        let activeEntry = sectionMap[0];

        sectionMap.forEach((entry) => {
            if (entry.section.offsetTop <= marker) {
                activeEntry = entry;
            }
        });

        sectionMap.forEach((entry) => {
            entry.link.classList.toggle("is-active", entry.link === activeEntry.link);
        });
    };

    const handleScroll = () => {
        updateHeader();
        updateActiveLink();
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
}

function initCtaActions() {
    const whatsappUrl = getWhatsAppUrl();

    const openWhatsApp = () => {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    };

    document.querySelectorAll("[data-whatsapp-cta]").forEach((element) => {
        element.addEventListener("click", openWhatsApp);
    });
}

function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    const status = document.querySelector("#form-status");

    if (!form || !status) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const data = new FormData(form);
        const name = String(data.get("name") || "").trim();
        const email = String(data.get("email") || "").trim();
        const projectType = String(data.get("projectType") || "General Inquiry").trim();
        const message = String(data.get("message") || "").trim();

        if (!name || !email || !message) {
            status.textContent = "Please complete all required fields before sending.";
            return;
        }

        const subject = `${SITE_CONFIG.brandName} inquiry from ${name}`;
        const body = [
            `Name: ${name}`,
            `Email: ${email}`,
            `Project Type: ${projectType}`,
            "",
            "Message:",
            message
        ].join("\n");

        const href = `mailto:${SITE_CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = href;

        status.textContent = "Opening your email app with a pre-filled brief.";
        form.reset();
    });
}

function init() {
    applySiteConfig();
    renderWorkItems();
    initHeroHeadline();
    initRevealAnimations();
    initHeaderState();
    initParallax();
    initVideoFallback();
    initContactVideo();
    initMetricCounters();
    initFaqAccordion();
    initMenuToggle();
    initCtaActions();
    initContactForm();
}

document.addEventListener("DOMContentLoaded", init);



