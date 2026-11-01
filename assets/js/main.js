(() => {
  const reduceMotion = matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const envelopeScreen = document.getElementById("envelopeScreen");
  const envelopeOpen = document.getElementById("envelopeOpen");
  const invitation = document.getElementById("invitation");
  let openingTimeout;
  const finishOpening = () => {
    clearTimeout(openingTimeout);
    envelopeScreen.removeEventListener("transitionend", onEnvelopeTransitionEnd);
    envelopeScreen.hidden = true;
    document.body.classList.remove("invitation-locked");
  };
  const onEnvelopeTransitionEnd = (event) => {
    if (event.target !== envelopeScreen || event.propertyName !== "opacity") {
      return;
    }
    finishOpening();
  };
  document.body.classList.add("invitation-locked");
  envelopeOpen.focus({ preventScroll: true });
  envelopeScreen.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    envelopeOpen.focus();
  });
  envelopeOpen.addEventListener("click", () => {
    envelopeOpen.disabled = true;
    envelopeScreen.classList.add("opening");
    envelopeScreen.setAttribute("aria-hidden", "true");
    invitation.inert = false;
    invitation.focus({ preventScroll: true });
    if (reduceMotion) {
      finishOpening();
      return;
    }
    envelopeScreen.addEventListener("transitionend", onEnvelopeTransitionEnd);
    openingTimeout = setTimeout(finishOpening, 2200);
    // scroll to top to avoid the envelope being scrolled out of view during the animation
    scrollTo({ top: 0, behavior: "smooth" });
  });

  // Hiện dần khi cuộn tới
  document.documentElement.classList.add("js");
  const revealTargets = document.querySelectorAll(
    [
      ".intro > *",
      ".family-photo",
      ".family-info",
      ".invite > *",
      ".calendar-frame",
      ".timeline .section-script",
      ".tl-item",
      ".wheel-stage",
      ".rsvp > *",
      ".gifts > *",
      ".gift",
      ".thanks img",
      "footer",
    ].join(","),
  );
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          io.unobserve(en.target);
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    revealTargets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--d", `${(i % 3) * 0.12}s`);
      io.observe(el);
    });
  }

  // Cánh hoa rơi
  const petals = document.getElementById("petals");
  if (!reduceMotion) {
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("i");
      p.className = "petal";
      p.style.cssText =
        `left:${Math.random() * 100}%;` +
        `--s:${8 + Math.random() * 8}px;` +
        `--t:${14 + Math.random() * 12}s;` +
        `--dl:${-Math.random() * 20}s;` +
        `--sway:${(Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 50)}px;` +
        `--o:${0.45 + Math.random() * 0.4}`;
      petals.append(p);
    }
  }

  // Nhạc nền
  const bgm = document.getElementById("bgm");
  const musicBtn = document.getElementById("musicBtn");
  let userToggled = false;
  const syncBtn = () => {
    const on = !bgm.paused;
    musicBtn.classList.toggle("playing", on);
    musicBtn.setAttribute("aria-label", on ? "Tắt nhạc" : "Bật nhạc");
  };
  bgm.addEventListener("play", syncBtn);
  bgm.addEventListener("pause", syncBtn);
  // Một số trình duyệt không phát được file nhạc mở trực tiếp từ ổ đĩa, nên thử nạp lại qua blob
  let triedBlob = false;
  const playMusic = () =>
    bgm.play().catch(async (err) => {
      if (triedBlob || err.name === "NotAllowedError") throw err;
      triedBlob = true;
      const res = await fetch(bgm.src);
      const data = await res.arrayBuffer();
      bgm.src = URL.createObjectURL(
        new Blob([data], { type: "audio/mpeg" }),
      );
      bgm.load();
      await bgm.play();
    });
  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userToggled = true;
    if (!bgm.paused) return bgm.pause();
    playMusic().catch(() =>
      showToast("Không phát được nhạc, vui lòng kiểm tra file trong thư mục music"),
    );
  });
  // Thử tự phát ngay; nếu trình duyệt chặn thì phát ở lần tương tác đầu tiên
  const unlockEvents = ["pointerdown", "touchstart", "keydown", "click"];
  const autoStart = (e) => {
    if (userToggled || !bgm.paused || musicBtn.contains(e?.target)) return;
    unlockEvents.forEach((ev) => removeEventListener(ev, autoStart, true));
    playMusic()
      .catch(() =>
        showToast("Không phát được nhạc, vui lòng kiểm tra file trong thư mục music"),
      );
  };
  unlockEvents.forEach((ev) => addEventListener(ev, autoStart, true));

  const YEAR = 2026;
  const MONTH = 11; // tháng 12 (chỉ số bắt đầu từ 0)
  const EVENT_DAY = 6;

  // Lịch bắt đầu từ thứ Hai
  const cal = document.getElementById("calendar");
  const offset = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  for (let i = 0; i < offset; i++) {
    cal.append(document.createElement("span"));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const e = document.createElement("span");
    e.textContent = d;
    if (d === EVENT_DAY) e.className = "wedding-day";
    cal.append(e);
  }

  const target = new Date("2026-12-06T10:00:00+07:00").getTime();
  const counters = document.querySelectorAll("#countdown strong");
  function tick() {
    const gap = Math.max(0, target - Date.now());
    const vals = [
      Math.floor(gap / 86400000),
      Math.floor(gap / 3600000) % 24,
      Math.floor(gap / 60000) % 60,
      Math.floor(gap / 1000) % 60,
    ];
    counters.forEach(
      (el, i) => (el.textContent = String(vals[i]).padStart(2, "0")),
    );
  }
  tick();
  setInterval(tick, 1000);

  const toast = document.getElementById("toast");
  let timer;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), 2600);
  };

  const wishes = [
    { value: "wish-1", text: "Chúc tình yêu của dâu rể luôn ngọt ngào và bền lâu." },
    { value: "wish-2", text: "Chúc dâu rể luôn yêu thương, sẻ chia và đồng hành cùng nhau." },
    { value: "wish-3", text: "Chúc mừng hạnh phúc! Mong dâu rể mãi là bến đỗ bình yên của nhau." },
    { value: "wish-4", text: "Chúc dâu rể mãi giữ được sự chân thành và tin tưởng dành cho nhau." },
    { value: "wish-5", text: "Chúc tổ ấm của dâu rể luôn ấm áp và đầy ắp tiếng cười." },
    { value: "wish-6", text: "Mong tình yêu của dâu rể ngày càng sâu đậm theo năm tháng." },
    { value: "wish-7", text: "Chúc dâu rể có thật nhiều kỷ niệm đẹp trên hành trình chung." },
    { value: "wish-8", text: "Mãi yêu thương, thấu hiểu và sẻ chia cùng nhau nhé." },
    { value: "wish-9", text: "Mong dâu rể luôn là điểm tựa vững chắc của nhau." },
    { value: "wish-10", text: "Chúc dâu rể giữ mãi ngọn lửa yêu thương trong tim." },
    { value: "wish-11", text: "Chúc dâu rể cùng nhau viết nên câu chuyện tình yêu thật đẹp." },
    { value: "wish-12", text: "Chúc dâu rể nắm tay nhau đi qua mọi mùa của cuộc đời." },
    { value: "wish-13", text: "Chúc dâu rể mãi hạnh phúc như ngày đầu yêu nhau." },
    { value: "wish-14", text: "Mong dâu rể luôn tìm thấy sự bình yên trong nhau." },
    { value: "wish-15", text: "Chúc đôi uyên ương luôn gắn bó và thủy chung son sắt." },
    { value: "wish-16", text: "Chúc tình yêu mãi là sợi dây gắn kết bền chặt giữa dâu rể." },
    { value: "wish-17", text: "Mong rằng mọi khó khăn đều trở nên nhẹ nhàng khi dâu rể ở cạnh nhau." },
    { value: "wish-18", text: "Chúc dâu rể mãi là mảnh ghép hoàn hảo của nhau." },
    { value: "wish-19", text: "Mong dâu rể luôn tìm thấy niềm hạnh phúc trong những điều giản dị." },
    { value: "wish-20", text: "Chúc dâu rể luôn giữ được sự lãng mạn trong tình yêu." },
    { value: "wish-21", text: "Mong rằng mỗi ngày bên nhau đều là một món quà ý nghĩa." },
    { value: "wish-22", text: "Mong rằng dâu rể sẽ cùng nhau già đi trong niềm vui và bình yên." },
    { value: "wish-23", text: "Chúc dâu rể mãi là tri kỷ, bạn đời và người đồng hành của nhau." },
    { value: "wish-24", text: "Chúc mừng ngày trọng đại! Mong dâu rể bên nhau trọn đời trong yêu thương và hạnh phúc." },
    { value: "wish-25", text: "Trăm năm tình viên mãn, bạc đầu nghĩa phu thê. Chúc dâu rể thật hạnh phúc." },
    { value: "wish-26", text: "Chúc dâu rể viết tiếp hành trình yêu thương bằng những tháng năm rực rỡ." },
    { value: "wish-27", text: "Mong mỗi sớm mai thức dậy, dâu rể đều thấy biết ơn vì có nhau." },
    { value: "wish-28", text: "Hạnh phúc hôm nay là khởi đầu cho một cuộc đời viên mãn. Chúc mừng dâu rể!" },
    { value: "wish-29", text: "Mong dâu rể mãi giữ được ánh mắt hạnh phúc dành cho nhau như ngày hôm nay." },
    { value: "wish-30", text: "Chúc tình yêu của dâu rể mãi vững bền, đơm hoa kết trái và ngọt ngào theo năm tháng." }
  ];
  const wishSearch = document.getElementById("wishSearch");
  const wishCombobox = document.getElementById("wishCombobox");
  const wishValue = document.getElementById("weddingWish");
  const wishOptions = document.getElementById("wishOptions");
  const wishResults = document.getElementById("wishResults");
  let matches = [];
  let activeIndex = -1;
  const normalizeWish = (text) =>
    text
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .trim();
  const closeWishOptions = () => {
    wishOptions.hidden = true;
    wishSearch.setAttribute("aria-expanded", "false");
    wishSearch.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  };
  const setActiveWish = (index) => {
    activeIndex = index;
    wishOptions.querySelectorAll(".wish-option").forEach((option, i) => {
      option.classList.toggle("active", i === activeIndex);
    });
    const activeOption = wishOptions.children[activeIndex];
    if (!activeOption) {
      wishSearch.removeAttribute("aria-activedescendant");
      return;
    }
    wishSearch.setAttribute("aria-activedescendant", activeOption.id);
    activeOption.scrollIntoView({ block: "nearest" });
  };
  const renderWishOptions = () => {
    const query = normalizeWish(wishSearch.value);
    matches = wishes.filter((wish) => normalizeWish(wish.text).includes(query));
    activeIndex = -1;
    wishSearch.removeAttribute("aria-activedescendant");
    wishOptions.replaceChildren();
    matches.forEach((wish, index) => {
      const option = document.createElement("div");
      option.className = "wish-option";
      option.id = `wish-option-${index}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(wish.value === wishValue.value));
      option.textContent = wish.text;
      option.addEventListener("click", () => {
        wishSearch.value = wish.text;
        wishValue.value = wish.value;
        closeWishOptions();
      });
      wishOptions.append(option);
    });
    wishResults.textContent = query
      ? matches.length
        ? `Tìm thấy ${matches.length} lời chúc.`
        : "Không tìm thấy lời chúc phù hợp."
      : `Có ${wishes.length} mẫu lời chúc.`;
  };
  const openWishOptions = () => {
    renderWishOptions();
    wishOptions.hidden = false;
    wishSearch.setAttribute("aria-expanded", "true");
  };
  wishSearch.addEventListener("focus", openWishOptions);
  wishSearch.addEventListener("input", () => {
    wishValue.value = "";
    openWishOptions();
  });
  wishSearch.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (wishOptions.hidden) openWishOptions();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        activeIndex === -1
          ? direction === 1
            ? 0
            : matches.length - 1
          : (activeIndex + direction + matches.length) % matches.length;
      if (matches.length) setActiveWish(nextIndex);
    } else if (event.key === "Enter" && !wishOptions.hidden && activeIndex >= 0) {
      event.preventDefault();
      wishOptions.children[activeIndex].click();
    } else if (event.key === "Escape") {
      closeWishOptions();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!wishCombobox.contains(event.target)) closeWishOptions();
  });

  document
    .getElementById("rsvpBtn")
    .addEventListener("click", () =>
      showToast("Cảm ơn bạn! Hẹn gặp bạn trong ngày vui."),
    );

  const box = document.getElementById("lightbox");
  const big = box.querySelector("img");
  const closeBox = () => box.classList.remove("open");
  document.querySelectorAll(".gift-icon").forEach((icon, i) => {
    icon.addEventListener("click", () => {
      big.src = icon.dataset.qr;
      big.alt = `Mã QR ${i + 1}`;
      box.classList.add("open");
    });
  });

  // Carousel xoay ngang
  const wheel = document.getElementById("wheel");
  const slides = [...wheel.querySelectorAll(".wheel-slide")];
  const dotsWrap = document.getElementById("wheelDots");
  const STEP = 360 / slides.length;
  wheel.style.setProperty("--step-angle", `${STEP}deg`);
  // step tăng/giảm liên tục để bánh xe luôn quay cùng chiều khi vòng lại
  let step = 0;
  const current = () =>
    ((step % slides.length) + slides.length) % slides.length;
  const dots = slides.map((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", `Ảnh ${i + 1}`);
    d.addEventListener("click", () => goTo(i));
    dotsWrap.append(d);
    return d;
  });
  const render = (dragDeg = 0) => {
    wheel.style.setProperty("--rot", `${-step * STEP + dragDeg}deg`);
    const idx = current();
    slides.forEach((s, i) => s.classList.toggle("active", i === idx));
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  };
  const move = (delta) => {
    step += delta;
    render();
  };
  const goTo = (i) => {
    let diff = i - current();
    if (diff > slides.length / 2) diff -= slides.length;
    if (diff < -slides.length / 2) diff += slides.length;
    move(diff);
  };
  document.getElementById("wheelPrev").addEventListener("click", () => {
    move(-1);
    startAuto();
  });
  document.getElementById("wheelNext").addEventListener("click", () => {
    move(1);
    startAuto();
  });
  let dragged = false;
  slides.forEach((s, i) => {
    s.draggable = false;
    s.addEventListener("click", () => {
      if (dragged) return;
      if (i !== current()) return goTo(i);
      big.src = s.src;
      big.alt = s.alt;
      box.classList.add("open");
    });
  });

  // Kéo bằng chuột hoặc vuốt ngang trên điện thoại
  const stage = wheel.parentElement;
  let drag = null;
  const dragDelta = (e) => {
    return e.clientX - drag.x;
  };
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragged = false;
    clearInterval(autoplay);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = dragDelta(e);
    if (!dragged && Math.abs(d) > 6) {
      dragged = true;
      wheel.classList.add("dragging");
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {}
    }
    if (dragged) render(d * 0.25);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = dragged ? dragDelta(e) : 0;
    drag = null;
    wheel.classList.remove("dragging");
    // cứ ~1 ảnh cho mỗi 140px kéo, tối thiểu 1 ảnh nếu kéo đủ xa
    const n = Math.abs(d) > 40 ? Math.max(1, Math.round(Math.abs(d) / 140)) : 0;
    step += d < 0 ? n : -n;
    render();
    startAuto();
    // giữ cờ dragged tới sau sự kiện click để không mở lightbox
    setTimeout(() => (dragged = false), 0);
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  let autoplay;
  // thời gian quay (khớp transition 2s trong CSS) + 1.5s dừng ở mỗi ảnh
  const SPIN_MS = 2000;
  const HOLD_MS = 1500;
  const startAuto = () => {
    if (reduceMotion) return;
    clearInterval(autoplay);
    autoplay = setInterval(() => move(1), SPIN_MS + HOLD_MS);
  };
  render();
  startAuto();

  box.addEventListener("click", (e) => {
    if (e.target === box || e.target.tagName === "BUTTON") closeBox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBox();
  });
})();
