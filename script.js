const weddingDate = new Date("2026-09-27T08:00:00").getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = weddingDate - now;

  const els = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
  };

  if (!els.days) return;

  if (distance <= 0) {
    els.days.textContent = "00";
    els.hours.textContent = "00";
    els.minutes.textContent = "00";
    els.seconds.textContent = "00";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  els.days.textContent = String(days).padStart(2, "0");
  els.hours.textContent = String(hours).padStart(2, "0");
  els.minutes.textContent = String(minutes).padStart(2, "0");
  els.seconds.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

/* ---------- Background music ---------- */

const music = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
let musicAvailable = Boolean(music && musicToggle);

function setMusicState(playing) {
  if (!musicToggle) return;
  musicToggle.setAttribute("aria-pressed", playing ? "true" : "false");
}

/* Nothing to offer if the track file is missing, so the control stays hidden. */
if (music) {
  music.addEventListener("error", () => {
    musicAvailable = false;
    if (musicToggle) musicToggle.hidden = true;
  });
}

function startMusic() {
  if (!musicAvailable || !music) return;

  music.volume = 0.45;
  const attempt = music.play();

  if (attempt && typeof attempt.then === "function") {
    attempt
      .then(() => {
        musicToggle.hidden = false;
        setMusicState(true);
      })
      .catch(() => {
        // Autoplay refused: still offer the control so the guest can start it.
        musicToggle.hidden = false;
        setMusicState(false);
      });
  }
}

if (musicToggle) {
  musicToggle.addEventListener("click", () => {
    if (!music) return;

    if (music.paused) {
      const attempt = music.play();
      if (attempt && typeof attempt.then === "function") {
        attempt.then(() => setMusicState(true)).catch(() => setMusicState(false));
      } else {
        setMusicState(true);
      }
    } else {
      music.pause();
      setMusicState(false);
    }
  });
}

/* ---------- Sealed envelope ---------- */

const overlay = document.getElementById("envelopeOverlay");
const openButton = document.getElementById("openInvite");
const sealPhoto = document.getElementById("sealPhoto");
const sealFace = document.getElementById("sealFace");

/* A photograph of the real stamp takes over from the drawn wax when present */
if (sealPhoto && sealFace) {
  const useSealPhoto = () => {
    sealPhoto.hidden = false;
    sealFace.classList.add("has-photo");
  };

  if (sealPhoto.complete) {
    if (sealPhoto.naturalWidth > 0) useSealPhoto();
  } else {
    sealPhoto.addEventListener("load", useSealPhoto);
  }
}

/* The overlay blocks pointer events and body scroll is locked in CSS, so the
   guest cannot do anything else while the envelope is opening. */
let pageUnlocked = false;

function unlockPage() {
  if (pageUnlocked) return;
  pageUnlocked = true;

  document.body.classList.remove("is-sealed");
  document.body.classList.remove("is-revealing");
  document.body.classList.add("invite-open");

  // The page sets scroll-behavior: smooth, so an animated scroll here would
  // fight the guest's first gesture. Jump instead.
  window.scrollTo({ top: 0, behavior: "instant" });

  const firstSection = document.querySelector(".save-the-date");
  if (firstSection) {
    firstSection.setAttribute("tabindex", "-1");
    firstSection.focus({ preventScroll: true });
  }
}

if (overlay && openButton) {
  document.body.classList.add("is-sealed");

  openButton.addEventListener(
    "click",
    () => {
      openButton.disabled = true;
      // The press is a real user gesture, so audio is allowed to start here.
      startMusic();

      if (prefersReducedMotion) {
        overlay.remove();
        unlockPage();
        return;
      }

      overlay.classList.add("is-opening");
      document.body.classList.add("is-revealing");

      /* Release the moment the last flap actually lands. A padded timeout left
         a gap where the card looked finished but the overlay still swallowed
         the first scroll. The timeout below is only a safety net. */
      const lastFlap = overlay.querySelector(".env-flap-bottom");
      const release = () => {
        overlay.remove();
        unlockPage();
      };

      if (lastFlap) {
        lastFlap.addEventListener("transitionend", release, { once: true });
      }
      window.setTimeout(release, 2200);
    },
    { once: true }
  );
} else {
  document.body.classList.add("invite-open");
}

/* ---------- Dialogs ---------- */

/* One opener for every dialog on the page */
function wireDialog(dialog, opener, closer) {
  if (!dialog) return;

  if (opener) {
    opener.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    });
  }

  if (closer) {
    closer.addEventListener("click", () => dialog.close());
  }

  // Clicking the backdrop area closes it too
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}


const giftDialog = document.getElementById("giftDialog");
const openGift = document.getElementById("openGift");
const closeGift = document.getElementById("closeGift");
const giftQr = document.getElementById("giftQr");
const qrMissing = document.getElementById("qrMissing");

if (giftQr && qrMissing) {
  const showQrFallback = () => {
    giftQr.hidden = true;
    qrMissing.hidden = false;
  };

  giftQr.addEventListener("error", showQrFallback);

  // The image may have already failed before this script ran.
  if (giftQr.complete && giftQr.naturalWidth === 0) {
    showQrFallback();
  }
}

wireDialog(giftDialog, openGift, closeGift);

const rsvpDialog = document.getElementById("rsvpDialog");
const thanksDialog = document.getElementById("thanksDialog");

wireDialog(rsvpDialog, document.getElementById("openRsvp"), document.getElementById("closeRsvp"));
wireDialog(thanksDialog, null, document.getElementById("closeThanks"));

const closeThanksBtn = document.getElementById("closeThanksBtn");
if (closeThanksBtn && thanksDialog) {
  closeThanksBtn.addEventListener("click", () => thanksDialog.close());
}

/* The RSVP form: the guest count only appears for someone who is coming, and
   the submit stays shut until there is both a name and an answer. */
const rsvpForm = document.getElementById("rsvpForm");
const thanksText = document.getElementById("thanksText");
const rsvpName = document.getElementById("rsvpName");
const rsvpSubmit = document.getElementById("rsvpSubmit");
const guestField = document.getElementById("guestField");
const guestCount = document.getElementById("guestCount");
const guestMinus = document.getElementById("guestMinus");
const guestPlus = document.getElementById("guestPlus");

function attendingChoice() {
  return rsvpForm ? rsvpForm.querySelector('input[name="attending"]:checked') : null;
}

function syncRsvpState() {
  if (!rsvpForm) return;

  const choice = attendingChoice();
  const coming = Boolean(choice) && choice.value === "yes";

  // Backs up the :has() styling for browsers that lack it
  rsvpForm.querySelectorAll(".choice-row").forEach((row) => {
    const input = row.querySelector('input[type="radio"]');
    row.classList.toggle("is-selected", Boolean(input && input.checked));
  });

  if (guestField) guestField.hidden = !coming;
  if (rsvpSubmit) {
    rsvpSubmit.disabled = !(rsvpName && rsvpName.value.trim() && choice);
  }
}

function syncStepper() {
  if (!guestCount) return;

  const value = Number(guestCount.value) || 1;
  const min = Number(guestCount.min) || 1;
  const max = Number(guestCount.max) || 20;
  const clamped = Math.min(Math.max(value, min), max);

  if (clamped !== value) guestCount.value = String(clamped);
  if (guestMinus) guestMinus.disabled = clamped <= min;
  if (guestPlus) guestPlus.disabled = clamped >= max;
}

function stepGuests(delta) {
  if (!guestCount) return;
  guestCount.value = String((Number(guestCount.value) || 1) + delta);
  syncStepper();
}

if (rsvpForm) {
  rsvpForm.addEventListener("change", syncRsvpState);
  if (rsvpName) rsvpName.addEventListener("input", syncRsvpState);
  if (guestCount) guestCount.addEventListener("input", syncStepper);
  if (guestMinus) guestMinus.addEventListener("click", () => stepGuests(-1));
  if (guestPlus) guestPlus.addEventListener("click", () => stepGuests(1));

  syncRsvpState();
  syncStepper();

  /* Nowhere to post yet. The form closes and the thank you takes its place. */
  rsvpForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const choice = attendingChoice();
    const coming = Boolean(choice) && choice.value === "yes";

    if (thanksText) {
      thanksText.textContent = coming
        ? "Chúng mình đã nhận được xác nhận của bạn. Rất mong được gặp bạn trong ngày trọng đại!"
        : "Chúng mình đã nhận được phản hồi của bạn. Cảm ơn bạn đã cho chúng mình biết.";
    }

    if (rsvpDialog) rsvpDialog.close();

    if (thanksDialog) {
      if (typeof thanksDialog.showModal === "function") {
        thanksDialog.showModal();
      } else {
        thanksDialog.setAttribute("open", "");
      }
    }
  });
}

const copyBank = document.getElementById("copyBank");
const bankNumber = document.getElementById("bankNumber");

if (copyBank && bankNumber && navigator.clipboard) {
  copyBank.addEventListener("click", () => {
    navigator.clipboard
      .writeText(bankNumber.textContent.trim())
      .then(() => {
        copyBank.textContent = "Đã chép";
        window.setTimeout(() => {
          copyBank.textContent = "Sao chép";
        }, 1800);
      })
      .catch(() => {
        copyBank.textContent = "Không chép được";
        window.setTimeout(() => {
          copyBank.textContent = "Sao chép";
        }, 1800);
      });
  });
} else if (copyBank) {
  copyBank.hidden = true;
}

/* ---------- Scroll reveal ---------- */

const revealEls = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
}
