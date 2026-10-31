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
    { value: "wish-1", text: "Chúc hai bạn trăm năm hạnh phúc, bạc đầu nghĩa phu thê." },
    { value: "wish-2", text: "Chúc tình yêu của hai bạn luôn ngọt ngào và bền lâu." },
    { value: "wish-3", text: "Chúc hai bạn luôn yêu thương, sẻ chia và đồng hành cùng nhau." },
    { value: "wish-4", text: "Chúc gia đình nhỏ của hai bạn luôn ngập tràn tiếng cười." },
    { value: "wish-5", text: "Chúc hai bạn có một cuộc sống hôn nhân viên mãn và hạnh phúc." },
    { value: "wish-6", text: "Mong mỗi ngày bên nhau đều là một ngày thật đáng nhớ." },
    { value: "wish-7", text: "Chúc hai bạn luôn nắm tay nhau vượt qua mọi chặng đường." },
    { value: "wish-8", text: "Chúc tình yêu hôm nay mãi là khởi đầu của những điều tuyệt vời." },
    { value: "wish-9", text: "Chúc hai bạn sớm đón thêm nhiều niềm vui và may mắn." },
    { value: "wish-10", text: "Chúc mừng hạnh phúc! Mong hai bạn mãi là bến đỗ bình yên của nhau." },
    { value: "wish-11", text: "Chúc hai bạn luôn tìm thấy niềm vui trong từng khoảnh khắc bên nhau." },
    { value: "wish-12", text: "Chúc cuộc sống hôn nhân của hai bạn luôn ngập tràn yêu thương." },
    { value: "wish-13", text: "Mong rằng hôm nay sẽ là khởi đầu cho hành trình hạnh phúc dài lâu." },
    { value: "wish-14", text: "Chúc hai bạn mãi giữ được sự chân thành và tin tưởng dành cho nhau." },
    { value: "wish-15", text: "Chúc tổ ấm của hai bạn luôn ấm áp và đầy ắp tiếng cười." },
    { value: "wish-16", text: "Chúc hai bạn luôn đồng lòng xây dựng cuộc sống thật viên mãn." },
    { value: "wish-17", text: "Mong tình yêu của hai bạn ngày càng sâu đậm theo năm tháng." },
    { value: "wish-18", text: "Chúc hai bạn luôn trân trọng và nâng niu hạnh phúc hiện tại." },
    { value: "wish-19", text: "Chúc gia đình nhỏ tương lai của hai bạn luôn bình an, hạnh phúc." },
    { value: "wish-20", text: "Chúc hai bạn có thật nhiều kỷ niệm đẹp trên hành trình chung." },
    { value: "wish-21", text: "Mãi yêu thương, thấu hiểu và sẻ chia cùng nhau nhé." },
    { value: "wish-22", text: "Chúc hai bạn mỗi ngày bên nhau đều trọn vẹn niềm vui." },
    { value: "wish-23", text: "Chúc cuộc sống mới của hai bạn luôn đầy ắp những điều tốt đẹp." },
    { value: "wish-24", text: "Mong hai bạn luôn là điểm tựa vững chắc của nhau." },
    { value: "wish-25", text: "Chúc hai bạn giữ mãi ngọn lửa yêu thương trong tim." },
    { value: "wish-26", text: "Chúc ngày vui hôm nay sẽ mãi là ký ức đẹp nhất." },
    { value: "wish-27", text: "Chúc hai bạn cùng nhau viết nên câu chuyện tình yêu thật đẹp." },
    { value: "wish-28", text: "Mong mọi dự định chung của hai bạn đều thành hiện thực." },
    { value: "wish-29", text: "Chúc hai bạn luôn hạnh phúc và thành công trong cuộc sống." },
    { value: "wish-30", text: "Chúc mái ấm của hai bạn luôn tràn ngập yêu thương." },
    { value: "wish-31", text: "Chúc hai bạn nắm tay nhau đi qua mọi mùa của cuộc đời." },
    { value: "wish-32", text: "Mong tình yêu của hai bạn sẽ ngày càng bền chặt." },
    { value: "wish-33", text: "Chúc hai bạn luôn nhìn về một hướng với thật nhiều hy vọng." },
    { value: "wish-34", text: "Chúc mỗi ngày trôi qua đều mang đến thêm hạnh phúc cho hai bạn." },
    { value: "wish-35", text: "Mừng ngày trọng đại của hai bạn, chúc trăm năm hạnh phúc." },
    { value: "wish-36", text: "Chúc hai bạn mãi là người bạn đồng hành tuyệt vời của nhau." },
    { value: "wish-37", text: "Mong rằng tình yêu sẽ luôn là sức mạnh của hai bạn." },
    { value: "wish-38", text: "Chúc hai bạn có thật nhiều trải nghiệm đáng nhớ cùng nhau." },
    { value: "wish-39", text: "Chúc cuộc hôn nhân của hai bạn luôn ngập tràn tiếng cười và niềm vui." },
    { value: "wish-40", text: "Chúc hai bạn mãi hạnh phúc như ngày đầu yêu nhau." },
    { value: "wish-41", text: "Mong hai bạn luôn tìm thấy sự bình yên trong nhau." },
    { value: "wish-42", text: "Chúc hai bạn luôn biết lắng nghe và thấu hiểu nhau." },
    { value: "wish-43", text: "Chúc hành trình phía trước của hai bạn đầy sắc màu hạnh phúc." },
    { value: "wish-44", text: "Mong những điều tốt đẹp nhất luôn đến với hai bạn." },
    { value: "wish-45", text: "Chúc hai bạn xây dựng được một gia đình hạnh phúc viên mãn." },
    { value: "wish-46", text: "Chúc tình yêu của hai bạn luôn đơm hoa kết trái." },
    { value: "wish-47", text: "Chúc hai bạn mãi bên nhau dù trong bất kỳ hoàn cảnh nào." },
    { value: "wish-48", text: "Mong hai bạn luôn giữ được nụ cười trên môi." },
    { value: "wish-49", text: "Chúc cuộc sống hôn nhân của hai bạn luôn đầy ắp tiếng cười." },
    { value: "wish-50", text: "Chúc hai bạn mãi mãi hạnh phúc và yêu thương nhau." },
    { value: "wish-51", text: "Chúc đôi uyên ương luôn gắn bó và thủy chung son sắt." },
    { value: "wish-52", text: "Mong tình yêu của hai bạn luôn được vun đắp mỗi ngày." },
    { value: "wish-53", text: "Chúc hai bạn luôn gặp nhiều may mắn trong cuộc sống." },
    { value: "wish-54", text: "Chúc mái ấm của hai bạn luôn rộn ràng niềm vui." },
    { value: "wish-55", text: "Mong hai bạn luôn đồng hành và tiếp thêm động lực cho nhau." },
    { value: "wish-56", text: "Chúc tình yêu mãi là sợi dây gắn kết bền chặt giữa hai bạn." },
    { value: "wish-57", text: "Chúc hai bạn cùng nhau tận hưởng một cuộc sống hạnh phúc dài lâu." },
    { value: "wish-58", text: "Mong mỗi năm kỷ niệm ngày cưới đều ngập tràn niềm vui." },
    { value: "wish-59", text: "Chúc hai bạn luôn có những tháng ngày thật ngọt ngào bên nhau." },
    { value: "wish-60", text: "Chúc cuộc sống chung luôn đầy ắp những điều bất ngờ tích cực." },
    { value: "wish-61", text: "Mong rằng mọi khó khăn đều trở nên nhẹ nhàng khi hai bạn ở cạnh nhau." },
    { value: "wish-62", text: "Chúc hai bạn mãi là mảnh ghép hoàn hảo của nhau." },
    { value: "wish-63", text: "Chúc gia đình tương lai luôn khỏe mạnh, bình an và hạnh phúc." },
    { value: "wish-64", text: "Mong hai bạn luôn tìm thấy niềm hạnh phúc trong những điều giản dị." },
    { value: "wish-65", text: "Chúc hai bạn có thật nhiều chuyến đi đáng nhớ cùng nhau." },
    { value: "wish-66", text: "Chúc tình yêu của hai bạn luôn tươi mới theo thời gian." },
    { value: "wish-67", text: "Mong rằng hai bạn sẽ cùng nhau thực hiện mọi ước mơ." },
    { value: "wish-68", text: "Chúc hai bạn mãi mãi là người thương của nhau." },
    { value: "wish-69", text: "Chúc cuộc sống hôn nhân luôn tràn đầy sự thấu cảm và sẻ chia." },
    { value: "wish-70", text: "Mong hạnh phúc sẽ luôn hiện diện trong ngôi nhà của hai bạn." },
    { value: "wish-71", text: "Chúc hai bạn luôn giữ được sự lãng mạn trong tình yêu." },
    { value: "wish-72", text: "Mong rằng mỗi ngày mới đều mang đến niềm vui mới cho hai bạn." },
    { value: "wish-73", text: "Chúc hai bạn mãi đồng lòng và tin tưởng lẫn nhau." },
    { value: "wish-74", text: "Chúc hành trình hôn nhân của hai bạn luôn ngọt ngào như thuở ban đầu." },
    { value: "wish-75", text: "Mong hai bạn luôn hạnh phúc trong mọi khoảnh khắc của cuộc sống." },
    { value: "wish-76", text: "Chúc đôi bạn trẻ mãi yêu thương nhau trọn đời." },
    { value: "wish-77", text: "Chúc hai bạn luôn là nguồn cảm hứng cho nhau mỗi ngày." },
    { value: "wish-78", text: "Mong hai bạn tận hưởng thật nhiều niềm vui trên chặng đường phía trước." },
    { value: "wish-79", text: "Chúc cuộc sống vợ chồng luôn hòa thuận và ấm áp." },
    { value: "wish-80", text: "Chúc hai bạn mãi gìn giữ những cảm xúc đẹp như hôm nay." },
    { value: "wish-81", text: "Mong tình yêu sẽ luôn dẫn lối cho hai bạn vượt qua mọi thử thách." },
    { value: "wish-82", text: "Chúc hai bạn luôn có thật nhiều lý do để mỉm cười." },
    { value: "wish-83", text: "Chúc hạnh phúc của hai bạn ngày càng đong đầy." },
    { value: "wish-84", text: "Mong rằng sự chân thành sẽ luôn hiện hữu trong tình yêu của hai bạn." },
    { value: "wish-85", text: "Chúc hai bạn luôn sống trọn vẹn từng khoảnh khắc bên nhau." },
    { value: "wish-86", text: "Chúc gia đình nhỏ tương lai luôn đủ đầy yêu thương và tiếng cười." },
    { value: "wish-87", text: "Mong hai bạn luôn là chỗ dựa vững vàng của nhau." },
    { value: "wish-88", text: "Chúc đôi vợ chồng trẻ mãi hạnh phúc và bình an." },
    { value: "wish-89", text: "Chúc hai bạn có thật nhiều khoảnh khắc đáng nhớ trong cuộc sống chung." },
    { value: "wish-90", text: "Mong rằng mỗi ngày bên nhau đều là một món quà ý nghĩa." },
    { value: "wish-91", text: "Chúc hai bạn luôn cùng nhau tạo nên những điều tuyệt vời." },
    { value: "wish-92", text: "Chúc tình yêu của hai bạn ngày càng sâu sắc và bền vững." },
    { value: "wish-93", text: "Mong hai bạn luôn cảm nhận được sự may mắn khi có nhau." },
    { value: "wish-94", text: "Chúc hai bạn sống một cuộc đời thật đẹp bên nhau." },
    { value: "wish-95", text: "Chúc ngôi nhà của hai bạn luôn đầy ắp yêu thương và hạnh phúc." },
    { value: "wish-96", text: "Mong rằng hai bạn sẽ cùng nhau già đi trong niềm vui và bình yên." },
    { value: "wish-97", text: "Chúc hai bạn mãi là tri kỷ, bạn đời và người đồng hành của nhau." },
    { value: "wish-98", text: "Chúc hôn nhân của hai bạn luôn bền vững theo năm tháng." },
    { value: "wish-99", text: "Mong mọi điều tốt đẹp nhất sẽ đến với hai bạn từ hôm nay và mãi về sau." },
    { value: "wish-100", text: "Chúc hai bạn luôn ngập tràn hạnh phúc, sức khỏe và thành công." },
    { value: "wish-101", text: "Chúc mừng ngày trọng đại! Mong hai bạn bên nhau trọn đời trong yêu thương và hạnh phúc." },
    { value: "wish-102", text: "Trăm năm tình viên mãn, bạc đầu nghĩa phu thê. Chúc hai bạn thật hạnh phúc." },
    { value: "wish-103", text: "Chúc hai bạn viết tiếp hành trình yêu thương bằng những tháng năm rực rỡ." },
    { value: "wish-104", text: "Mong mỗi sớm mai thức dậy, hai bạn đều thấy biết ơn vì có nhau." },
    { value: "wish-105", text: "Chúc hai bạn luôn nắm tay nhau thật chặt trên mọi chặng đường phía trước." },
    { value: "wish-106", text: "Hạnh phúc hôm nay là khởi đầu cho một cuộc đời viên mãn. Chúc mừng hai bạn!" },
    { value: "wish-107", text: "Chúc tổ ấm của hai bạn luôn đầy tiếng cười, niềm vui và sự yêu thương." },
    { value: "wish-108", text: "Mong hai bạn mãi giữ được ánh mắt hạnh phúc dành cho nhau như ngày hôm nay." },
    { value: "wish-109", text: "Chúc hai bạn luôn bình an, hạnh phúc và thành công trong cuộc sống chung." },
    { value: "wish-110", text: "Chúc tình yêu của hai bạn mãi vững bền, đơm hoa kết trái và ngọt ngào theo năm tháng." }
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
      big.src = `thiep-cuoi-assets/QR-${i + 1}.jpg`;
      big.alt = `Mã QR ${i + 1}`;
      box.classList.add("open");
    });
  });

  // Vòng đu quay dọc
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

  // Kéo bằng chuột (dọc hoặc ngang) hoặc vuốt ngang trên điện thoại
  const stage = wheel.parentElement;
  let drag = null;
  const dragDelta = (e) => {
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (e.pointerType !== "mouse") return -dx;
    return Math.abs(dy) >= Math.abs(dx) ? dy : -dx;
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
