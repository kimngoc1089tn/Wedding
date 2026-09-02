const weddingDate = new Date("2026-10-12T10:00:00").getTime();

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
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor(
    (distance % (1000 * 60 * 60)) / (1000 * 60)
  );
  const seconds = Math.floor(
    (distance % (1000 * 60)) / 1000
  );

  els.days.textContent = String(days).padStart(2, "0");
  els.hours.textContent = String(hours).padStart(2, "0");
  els.minutes.textContent = String(minutes).padStart(2, "0");
  els.seconds.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}


/* ---------- Background music ---------- */

const music = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
let musicAvailable = Boolean(music && musicToggle);

function setMusicState(playing) {
  if (!musicToggle) return;

  musicToggle.setAttribute(
    "aria-pressed",
    playing ? "true" : "false"
  );
}

if (music) {
  music.addEventListener("error", () => {
    musicAvailable = false;

    if (musicToggle) {
      musicToggle.hidden = true;
    }
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
        attempt
          .then(() => setMusicState(true))
          .catch(() => setMusicState(false));
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

if (sealPhoto && sealFace) {
  const useSealPhoto = () => {
    sealPhoto.hidden = false;
    sealFace.classList.add("has-photo");
  };

  if (sealPhoto.complete) {
    if (sealPhoto.naturalWidth > 0) {
      useSealPhoto();
    }
  } else {
    sealPhoto.addEventListener("load", useSealPhoto);
  }
}

let pageUnlocked = false;

function unlockPage() {
  if (pageUnlocked) return;

  pageUnlocked = true;

  document.body.classList.remove("is-sealed");
  document.body.classList.remove("is-revealing");
  document.body.classList.add("invite-open");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  const firstSection = document.querySelector(".save-the-date");

  if (firstSection) {
    firstSection.setAttribute("tabindex", "-1");

    firstSection.focus({
      preventScroll: true
    });
  }
}

if (overlay && openButton) {
  document.body.classList.add("is-sealed");

  openButton.addEventListener(
    "click",
    () => {
      openButton.disabled = true;

      startMusic();

      if (prefersReducedMotion) {
        overlay.remove();
        unlockPage();
        return;
      }

      overlay.classList.add("is-opening");
      document.body.classList.add("is-revealing");

      const lastFlap = overlay.querySelector(
        ".env-flap-bottom"
      );

      const release = () => {
        overlay.remove();
        unlockPage();
      };

      if (lastFlap) {
        lastFlap.addEventListener(
          "transitionend",
          release,
          { once: true }
        );
      }

      window.setTimeout(release, 2200);
    },
    { once: true }
  );
} else {
  document.body.classList.add("invite-open");
}


/* ---------- Dialogs ---------- */

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
    closer.addEventListener("click", () => {
      dialog.close();
    });
  }

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}


/* ---------- Gift dialog ---------- */

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

  if (
    giftQr.complete &&
    giftQr.naturalWidth === 0
  ) {
    showQrFallback();
  }
}

wireDialog(
  giftDialog,
  openGift,
  closeGift
);


/* ---------- RSVP dialog ---------- */

const rsvpDialog = document.getElementById("rsvpDialog");
const thanksDialog = document.getElementById("thanksDialog");

wireDialog(
  rsvpDialog,
  document.getElementById("openRsvp"),
  document.getElementById("closeRsvp")
);

wireDialog(
  thanksDialog,
  null,
  document.getElementById("closeThanks")
);

const closeThanksBtn =
  document.getElementById("closeThanksBtn");

if (closeThanksBtn && thanksDialog) {
  closeThanksBtn.addEventListener("click", () => {
    thanksDialog.close();
  });
}


/* ---------- RSVP form ---------- */

const rsvpForm =
  document.getElementById("rsvpForm");

const thanksText =
  document.getElementById("thanksText");

const rsvpName =
  document.getElementById("rsvpName");

const rsvpSubmit =
  document.getElementById("rsvpSubmit");

const guestField =
  document.getElementById("guestField");

const guestCount =
  document.getElementById("guestCount");

const guestMinus =
  document.getElementById("guestMinus");

const guestPlus =
  document.getElementById("guestPlus");


function attendingChoice() {
  return rsvpForm
    ? rsvpForm.querySelector(
        'input[name="attending"]:checked'
      )
    : null;
}


function syncRsvpState() {
  if (!rsvpForm) return;

  const choice = attendingChoice();

  const coming =
    Boolean(choice) &&
    choice.value === "yes";

  rsvpForm
    .querySelectorAll(".choice-row")
    .forEach((row) => {
      const input =
        row.querySelector(
          'input[type="radio"]'
        );

      row.classList.toggle(
        "is-selected",
        Boolean(input && input.checked)
      );
    });

  if (guestField) {
    guestField.hidden = !coming;
  }

  if (rsvpSubmit) {
    rsvpSubmit.disabled = !(
      rsvpName &&
      rsvpName.value.trim() &&
      choice
    );
  }
}


/* ---------- Guest stepper ---------- */

function syncStepper() {
  if (!guestCount) return;

  const value =
    Number(guestCount.value) || 1;

  const min =
    Number(guestCount.min) || 1;

  const max =
    Number(guestCount.max) || 20;

  const clamped =
    Math.min(
      Math.max(value, min),
      max
    );

  if (clamped !== value) {
    guestCount.value =
      String(clamped);
  }

  if (guestMinus) {
    guestMinus.disabled =
      clamped <= min;
  }

  if (guestPlus) {
    guestPlus.disabled =
      clamped >= max;
  }
}


function stepGuests(delta) {
  if (!guestCount) return;

  guestCount.value = String(
    (Number(guestCount.value) || 1) +
    delta
  );

  syncStepper();
}


/* ---------- GOOGLE SHEETS ---------- */

/*
 * URL Web App Google Apps Script
 * Đã gắn sẵn URL.
 */

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbznUy_WCw6urT_cvnjqpatIxYgJkzx2gcQnTaedjmfw8l-t6_eSjco60dlu3qsSEQ_a/exec";


/* ---------- RSVP events ---------- */

if (rsvpForm) {

  rsvpForm.addEventListener(
    "change",
    syncRsvpState
  );

  if (rsvpName) {
    rsvpName.addEventListener(
      "input",
      syncRsvpState
    );
  }

  if (guestCount) {
    guestCount.addEventListener(
      "input",
      syncStepper
    );
  }

  if (guestMinus) {
    guestMinus.addEventListener(
      "click",
      () => stepGuests(-1)
    );
  }

  if (guestPlus) {
    guestPlus.addEventListener(
      "click",
      () => stepGuests(1)
    );
  }

  syncRsvpState();
  syncStepper();


  /* ---------- Submit RSVP ---------- */

  rsvpForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const choice =
        attendingChoice();

      const coming =
        Boolean(choice) &&
        choice.value === "yes";

      if (
        !rsvpName ||
        !rsvpName.value.trim() ||
        !choice
      ) {
        syncRsvpState();
        return;
      }


      /* Lấy dữ liệu form */

      const data =
        new URLSearchParams();

      data.append(
        "fullname",
        rsvpName.value.trim()
      );

      data.append(
        "attending",
        choice.value
      );

      data.append(
        "guests",
        coming && guestCount
          ? (
              guestCount.value ||
              "1"
            )
          : "0"
      );


      /* Khóa nút trong lúc gửi */

      if (rsvpSubmit) {
        rsvpSubmit.disabled = true;
        rsvpSubmit.textContent =
          "ĐANG GỬI...";
      }


      try {

        await fetch(
          GOOGLE_SCRIPT_URL,
          {
            method: "POST",

            mode: "no-cors",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8"
            },

            body: data.toString()
          }
        );


        /* Nội dung cảm ơn */

        if (thanksText) {

          thanksText.textContent =
            coming
              ? "Chúng mình đã nhận được xác nhận của bạn. Rất mong được gặp bạn trong ngày trọng đại!"
              : "Chúng mình đã nhận được phản hồi của bạn. Cảm ơn bạn đã cho chúng mình biết.";

        }


        /* Đóng RSVP */

        if (rsvpDialog) {
          rsvpDialog.close();
        }


        /* Mở thông báo cảm ơn */

        if (thanksDialog) {

          if (
            typeof thanksDialog.showModal ===
            "function"
          ) {

            thanksDialog.showModal();

          } else {

            thanksDialog.setAttribute(
              "open",
              ""
            );

          }

        }


        /* Reset form */

        rsvpForm.reset();

        if (guestCount) {
          guestCount.value = "1";
        }

        if (guestField) {
          guestField.hidden = true;
        }

        syncRsvpState();
        syncStepper();


      } catch (error) {

        console.error(
          "Lỗi gửi RSVP:",
          error
        );

        alert(
          "Không thể gửi xác nhận lúc này. Vui lòng thử lại sau."
        );

      } finally {

        if (rsvpSubmit) {

          rsvpSubmit.textContent =
            "GỬI XÁC NHẬN";

          syncRsvpState();

        }

      }

    }
  );

}


/* ---------- Copy bank number ---------- */

const copyBank =
  document.getElementById("copyBank");

const bankNumber =
  document.getElementById("bankNumber");

if (
  copyBank &&
  bankNumber &&
  navigator.clipboard
) {

  copyBank.addEventListener(
    "click",
    () => {

      navigator.clipboard
        .writeText(
          bankNumber.textContent.trim()
        )
        .then(() => {

          copyBank.textContent =
            "Đã chép";

          window.setTimeout(
            () => {
              copyBank.textContent =
                "Sao chép";
            },
            1800
          );

        })
        .catch(() => {

          copyBank.textContent =
            "Không chép được";

          window.setTimeout(
            () => {
              copyBank.textContent =
                "Sao chép";
            },
            1800
          );

        });

    }
  );

} else if (copyBank) {

  copyBank.hidden = true;

}


/* ---------- Scroll reveal ---------- */

const revealEls =
  document.querySelectorAll(
    ".reveal"
  );

if (
  prefersReducedMotion ||
  !("IntersectionObserver" in window)
) {

  revealEls.forEach((el) => {
    el.classList.add(
      "is-visible"
    );
  });

} else {

  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "is-visible"
              );

              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold: 0.15
      }
    );

  revealEls.forEach((el) => {
    observer.observe(el);
  });

}
