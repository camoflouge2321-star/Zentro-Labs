const DEFAULT_SITE_CONFIG = Object.freeze({
    brandName: "Zentro Labs",
    contactEmail: "hello@zentrolabs.com",
    siteUrl: "https://zentrolabs.com/",
    whatsappUrl: "",
    whatsappPhone: "",
    whatsappPrefillText: "Hi Zentro Labs, I want to start a premium project.",
    copyrightYear: 2026
});

const DEFAULT_WORK_ITEMS = Object.freeze([
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

let runtimeSiteConfig = { ...DEFAULT_SITE_CONFIG };
let runtimeWorkItems = [...DEFAULT_WORK_ITEMS];

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

function getSanitizedWhatsAppPhone() {
    const sanitizedPhone = String(runtimeSiteConfig.whatsappPhone || "").replace(/\D/g, "");
    return sanitizedPhone.length >= 8 ? sanitizedPhone : "";
}

function getConfiguredWhatsAppUrl() {
    const configuredUrl = String(runtimeSiteConfig.whatsappUrl || "").trim();
    if (!configuredUrl) {
        return "";
    }

    try {
        const parsed = new URL(configuredUrl);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.toString();
        }
    } catch (error) {
        return "";
    }

    return "";
}

function hasWhatsAppTarget() {
    return Boolean(getConfiguredWhatsAppUrl() || getSanitizedWhatsAppPhone());
}

function getWhatsAppUrl(messageText) {
    const message = encodeURIComponent(String(messageText || runtimeSiteConfig.whatsappPrefillText || "").trim());
    const configuredUrl = getConfiguredWhatsAppUrl();
    if (configuredUrl) {
        const parsed = new URL(configuredUrl);
        parsed.searchParams.set("text", decodeURIComponent(message));
        return parsed.toString();
    }

    const sanitizedPhone = getSanitizedWhatsAppPhone();
    if (sanitizedPhone) {
        return `https://api.whatsapp.com/send?phone=${sanitizedPhone}&text=${message}`;
    }

    return "";
}

function buildWhatsAppBriefFromForm(formElement) {
    const data = new FormData(formElement);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const projectType = String(data.get("projectType") || "General Inquiry").trim();
    const message = String(data.get("message") || "").trim();

    const lines = [
        `Hi ${runtimeSiteConfig.brandName}, I want to discuss a project.`,
        "",
        `Name: ${name || "N/A"}`,
        `Email: ${email || "N/A"}`,
        `Project Type: ${projectType || "N/A"}`,
        "",
        "Message:",
        message || "N/A"
    ];

    return lines.join("\n");
}

function applySiteConfig() {
    document.querySelectorAll("[data-brand]").forEach((node) => {
        node.textContent = runtimeSiteConfig.brandName;
    });

    document.querySelectorAll("[data-year]").forEach((node) => {
        node.textContent = String(runtimeSiteConfig.copyrightYear);
    });

    document.querySelectorAll("[data-email-link]").forEach((link) => {
        link.setAttribute("href", `mailto:${runtimeSiteConfig.contactEmail}`);
        if (!link.dataset.keepText) {
            link.textContent = runtimeSiteConfig.contactEmail;
        }
    });

    const whatsappReady = hasWhatsAppTarget();
    document.querySelectorAll("[data-whatsapp-cta]").forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) {
            return;
        }
        button.disabled = !whatsappReady;
        button.setAttribute("aria-disabled", String(!whatsappReady));
        if (!whatsappReady) {
            button.title = "WhatsApp is not configured yet.";
        } else {
            button.removeAttribute("title");
        }
    });

    const whatsappNote = document.querySelector("[data-whatsapp-note]");
    if (whatsappNote) {
        whatsappNote.textContent = whatsappReady
            ? ""
            : "Add whatsappPhone (or whatsappUrl) in data/site-config.json to enable direct chat.";
    }
}

function renderWorkItems() {
    const grid = document.querySelector("[data-work-grid]");
    if (!grid) {
        return;
    }

    grid.innerHTML = runtimeWorkItems.map((item) => {
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
                // Keep visible if autoplay is blocked; user interaction can still trigger playback.
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
                    // Some browsers still block media despite pointer interaction.
                });
            }
        },
        { once: true, passive: true }
    );
}

function initPortfolioVideo() {
    const videos = Array.from(document.querySelectorAll("[data-portfolio-video]"));
    if (!videos.length) {
        return;
    }

    videos.forEach((video) => {
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
            video.setAttribute("controls", "");
        });
    });
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

function initBrandLink() {
    const brandLink = document.querySelector(".brand");
    const header = document.querySelector("[data-header]");

    if (!brandLink) {
        return;
    }

    brandLink.addEventListener("click", (event) => {
        const href = brandLink.getAttribute("href");
        if (href && href.startsWith("#")) {
            event.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = target.offsetTop - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });
            }
        }
    });
}

function initMenuToggle() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    const header = document.querySelector("[data-header]");

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
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            // Only close menu and handle smooth scroll for anchor links
            if (href && href.startsWith("#")) {
                event.preventDefault();
                closeMenu();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: "smooth"
                    });
                }
            } else {
                closeMenu();
            }
        });
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

    const getHeaderHeight = () => {
        return header ? header.offsetHeight : 0;
    };

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

    // Handle smooth scroll with header offset
    sectionMap.forEach(({ link, section }) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const headerHeight = getHeaderHeight();
            const targetPosition = section.offsetTop - headerHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });
        });
    });

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
}

function initCtaActions() {
    document.querySelectorAll("[data-whatsapp-cta]").forEach((element) => {
        element.addEventListener("click", () => {
            const form = element.closest("form");
            const message = form ? buildWhatsAppBriefFromForm(form) : runtimeSiteConfig.whatsappPrefillText;
            const targetUrl = getWhatsAppUrl(message);

            if (!targetUrl) {
                const status = document.querySelector("#form-status");
                if (status) {
                    status.textContent = "WhatsApp is not configured yet.";
                }
                return;
            }

            window.open(targetUrl, "_blank", "noopener,noreferrer");
        });
    });
}

function createMailtoHref(payload) {
    const subject = `${runtimeSiteConfig.brandName} inquiry from ${payload.name}`;
    const body = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Project Type: ${payload.projectType}`,
        "",
        "Message:",
        payload.message
    ].join("\n");

    return `mailto:${runtimeSiteConfig.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    const status = document.querySelector("#form-status");

    if (!form || !status) {
        return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    const defaultButtonLabel = submitButton ? submitButton.textContent : "Send Message";

    const setLoadingState = (isLoading) => {
        if (!submitButton) {
            return;
        }

        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? "Sending..." : defaultButtonLabel;
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = new FormData(form);
        const payload = {
            name: String(data.get("name") || "").trim(),
            email: String(data.get("email") || "").trim(),
            projectType: String(data.get("projectType") || "General Inquiry").trim(),
            message: String(data.get("message") || "").trim()
        };

        if (!payload.name || !payload.email || !payload.message) {
            status.textContent = "Please complete all required fields before sending.";
            return;
        }

        setLoadingState(true);
        status.textContent = "Submitting your project brief...";

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status >= 500 || response.status === 404) {
                    status.textContent = "Submission service is unavailable. Opening your email app as fallback.";
                    window.location.href = createMailtoHref(payload);
                    return;
                }
                throw new Error(result.error || "Unable to submit right now. Please try again shortly.");
            }

            status.textContent = result.message || "Thanks. Your brief has been received.";
            form.reset();
        } catch (error) {
            if (error instanceof TypeError) {
                status.textContent = "Network issue detected. Opening your email app as fallback.";
                window.location.href = createMailtoHref(payload);
            } else {
                status.textContent = error.message;
            }
        } finally {
            setLoadingState(false);
        }
    });
}

function normalizeSiteConfig(input) {
    if (!input || typeof input !== "object") {
        return null;
    }

    return {
        ...runtimeSiteConfig,
        ...input,
        copyrightYear: Number(input.copyrightYear) || runtimeSiteConfig.copyrightYear
    };
}

function normalizeWorkItems(items) {
    if (!Array.isArray(items) || !items.length) {
        return null;
    }

    return items.map((item, index) => ({
        index: String(item.index || `${index + 1}`).padStart(2, "0"),
        title: String(item.title || "Untitled Project"),
        category: String(item.category || "Digital Experience"),
        description: String(item.description || ""),
        altText: String(item.altText || "Project visual"),
        toneA: String(item.toneA || "#3f5e63"),
        toneB: String(item.toneB || "#6f888f"),
        layout: String(item.layout || "feature")
    }));
}

async function loadBackendData() {
    try {
        const [configResponse, workResponse] = await Promise.all([
            fetch("/api/config", {
                headers: { "Accept": "application/json" },
                cache: "no-store"
            }),
            fetch("/api/work-items", {
                headers: { "Accept": "application/json" },
                cache: "no-store"
            })
        ]);

        if (configResponse.ok) {
            const configJson = await configResponse.json();
            const normalizedConfig = normalizeSiteConfig(configJson);
            if (normalizedConfig) {
                runtimeSiteConfig = normalizedConfig;
            }
        }

        if (workResponse.ok) {
            const workJson = await workResponse.json();
            const normalizedItems = normalizeWorkItems(workJson.items);
            if (normalizedItems) {
                runtimeWorkItems = normalizedItems;
            }
        }
    } catch (error) {
        console.warn("Backend data unavailable; using frontend defaults.", error);
    }
}

async function init() {
    await loadBackendData();
    applySiteConfig();
    renderWorkItems();
    initHeroHeadline();
    initRevealAnimations();
    initMenuToggle();
    initHeaderState();
    initParallax();
    initVideoFallback();
    initPortfolioVideo();
    initMetricCounters();
    initFaqAccordion();
    initBrandLink();
    initCtaActions();
    initContactForm();
}

document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
        console.error("Initialization failed:", error);
        applySiteConfig();
        renderWorkItems();
    });
});
