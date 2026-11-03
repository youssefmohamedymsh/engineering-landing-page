/* Fieldline — main.js
   Edit ONLY the config block. Everything else is wiring. */

const config = {
  // CONFIRM: paste the access key from https://web3forms.com (free) — submissions email to the address you register there
  WEB3FORMS_KEY: "CONFIRM",
  // CONFIRM: international number, digits only, e.g. "2010XXXXXXXX"
  WHATSAPP_NUMBER: "CONFIRM",
  // CONFIRM: display format, e.g. "+20 10 XXXX XXXX"
  PHONE: "CONFIRM",
  // CONFIRM: e.g. "hello@example.com"
  EMAIL: "CONFIRM",
  WHATSAPP_MESSAGE: "Hello Fieldline, I would like a quote for an AI/IoT system.",
};

const isSet = (v) => typeof v === "string" && v.trim() !== "" && v !== "CONFIRM";

/* ---- Contact details from config ------------------------------------- */
function applyConfig() {
  document.querySelectorAll('[data-config="whatsapp"]').forEach((el) => {
    const label = el.querySelector("[data-config-label]");
    if (isSet(config.WHATSAPP_NUMBER)) {
      el.href = `https://wa.me/${config.WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(config.WHATSAPP_MESSAGE)}`;
    } else {
      el.classList.add("is-placeholder");
      el.setAttribute("aria-disabled", "true");
      el.removeAttribute("target");
      el.href = "#contact";
      if (label) label.textContent = "WhatsApp (number pending)";
    }
  });

  document.querySelectorAll('[data-config="email"]').forEach((el) => {
    if (isSet(config.EMAIL)) { el.href = `mailto:${config.EMAIL}`; el.textContent = config.EMAIL; }
    else { el.classList.add("is-placeholder"); el.setAttribute("aria-disabled", "true"); el.textContent = "Email pending"; }
  });

  document.querySelectorAll('[data-config="phone"]').forEach((el) => {
    if (isSet(config.PHONE)) { el.href = `tel:${config.PHONE.replace(/[^\d+]/g, "")}`; el.textContent = config.PHONE; }
    else { el.classList.add("is-placeholder"); el.setAttribute("aria-disabled", "true"); el.textContent = "Phone pending"; }
  });
}

/* ---- Mobile menu (<dialog>) ------------------------------------------- */
function initMenu() {
  const dialog = document.getElementById("menu");
  const toggle = document.querySelector(".menu-toggle");
  const close = dialog?.querySelector(".menu__close");
  if (!dialog || !toggle || typeof dialog.showModal !== "function") return;

  // Mirror the dialog's open state onto body + toggle. Called from every
  // close path (button, link, backdrop, Esc) because Chrome does not reliably
  // fire `close`; `toggle` is the newer, reliable signal.
  const sync = () => {
    document.body.classList.toggle("is-open", dialog.open);
    toggle.setAttribute("aria-expanded", String(dialog.open));
  };
  const open = () => { dialog.showModal(); sync(); };
  const shut = () => { dialog.close(); sync(); };

  toggle.addEventListener("click", open);
  close?.addEventListener("click", shut);
  dialog.addEventListener("close", sync);
  dialog.addEventListener("toggle", sync);
  dialog.querySelectorAll("a[href^='#']").forEach((a) => a.addEventListener("click", shut));
  dialog.addEventListener("click", (e) => { if (e.target === dialog) shut(); });
  window.matchMedia("(min-width: 48rem)").addEventListener("change", (e) => { if (e.matches && dialog.open) shut(); });
}

/* ---- Quote form (Web3Forms) ------------------------------------------- */
function initForm() {
  const form = document.getElementById("quote-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;
  const button = form.querySelector('button[type="submit"]');
  const idleLabel = button.textContent;

  const setStatus = (state, html) => {
    status.dataset.state = state;
    status.innerHTML = html;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.querySelector('[name="botcheck"]')?.checked) return;

    // Native validity with visible marking
    let firstInvalid = null;
    form.querySelectorAll("[required]").forEach((el) => {
      const ok = el.checkValidity();
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) {
      setStatus("error", "Please complete the highlighted fields.");
      firstInvalid.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    delete data.botcheck;
    data.access_key = config.WEB3FORMS_KEY;
    data.subject = `Quote request from ${data.name} (${data.company})`;
    data.from_name = "Fieldline website";

    button.disabled = true;
    button.textContent = "Sending…";
    setStatus("", "");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || `Request failed (${res.status})`);
      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
      setStatus("success", "Thank you, your request was sent. We will reply with next steps.");
    } catch (err) {
      const subject = encodeURIComponent(data.subject);
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name}, ${data.company}\n${data.email} ${data.phone || ""}`);
      const fallback = isSet(config.EMAIL)
        ? ` You can also <a href="mailto:${config.EMAIL}?subject=${subject}&body=${body}">send it by email</a>.`
        : " Please try again, or reach us by phone or WhatsApp.";
      setStatus("error", `Sorry, the request could not be sent.${fallback}`);
      status.setAttribute("role", "alert");
    } finally {
      button.disabled = false;
      button.textContent = idleLabel;
    }
  });
}

/* ---- Scroll reveal (process steps only) ------------------------------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  // Opt into the entrance only when it can actually play: visible document,
  // observer available, motion allowed. Otherwise content is simply visible.
  const canAnimate =
    document.visibilityState === "visible" &&
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canAnimate) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  document.documentElement.classList.add("reveal-on");
  // Anything already on screen (deep link to #process, back-navigation) is
  // shown immediately; the observer only handles what is still below the fold.
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.2 });
  items.forEach((el) => (inView(el) ? el.classList.add("is-in") : io.observe(el)));
}

applyConfig();
initMenu();
initForm();
initReveal();
