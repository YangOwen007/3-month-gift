const stripContainer = document.getElementById("background-strips");
const stickerSlots = Array.from(document.querySelectorAll(".sticker-slot"));
const pageShell = document.querySelector(".page-shell");
const storyColumn = document.querySelector(".story-column");
const mobileBreakpoint = window.matchMedia("(max-width: 560px)");
const tabletBreakpoint = window.matchMedia("(max-width: 860px)");
const BACKGROUND_IMAGES = [
  "./assets/background/IMG_2996.JPEG",
  "./assets/background/IMG_2997.JPEG",
  "./assets/background/IMG_2998.JPEG",
  "./assets/background/IMG_2999.JPEG",
];
const PARALLAX_FACTOR = 0.08;
const BACKGROUND_BUFFER = 192;
let lastMeasuredHeight = 0;

const getMeasuredPageHeight = () => {
  const lastStoryBlock = storyColumn?.lastElementChild;
  const shellHeight = pageShell?.scrollHeight ?? 0;
  const documentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );

  if (!storyColumn || !lastStoryBlock) {
    return Math.max(shellHeight, documentHeight);
  }

  const storyStyles = window.getComputedStyle(storyColumn);
  const storyBottomPadding = Number.parseFloat(storyStyles.paddingBottom || "0");
  const storyContentBottom =
    storyColumn.offsetTop + lastStoryBlock.offsetTop + lastStoryBlock.offsetHeight;

  return Math.max(
    documentHeight,
    shellHeight,
    Math.ceil(storyContentBottom + storyBottomPadding)
  );
};

const getColumnCount = () => {
  if (mobileBreakpoint.matches) {
    return 2;
  }

  if (tabletBreakpoint.matches) {
    return 3;
  }

  return 5;
};

const buildBackgroundStrips = () => {
  const columnCount = getColumnCount();
  const gridStyles = window.getComputedStyle(stripContainer);
  const gap = Number.parseFloat(gridStyles.columnGap || gridStyles.gap || "32");
  const containerWidth = stripContainer.clientWidth || window.innerWidth;
  const stripWidth =
    (containerWidth - gap * (columnCount - 1)) / Math.max(columnCount, 1);
  const stripPadding = Math.max(10, stripWidth * 0.08);
  const frameHeight = stripWidth * (2 / 3) + stripPadding * 2 + gap;
  const pageHeight = getMeasuredPageHeight();
  const viewportHeight = window.innerHeight;
  const scrollRange = Math.max(0, pageHeight - viewportHeight);
  const parallaxOverscan =
    Math.ceil(scrollRange * PARALLAX_FACTOR) + BACKGROUND_BUFFER;
  const requiredHeight = pageHeight + parallaxOverscan * 2;
  const frameCount = Math.max(
    10,
    Math.ceil(requiredHeight / Math.max(frameHeight, 1)) + 1
  );

  // Extend the background above and below the page so the slower parallax
  // motion never exposes an empty edge near the end of the scroll.
  stripContainer.style.top = `${-parallaxOverscan}px`;
  stripContainer.style.height = `${requiredHeight}px`;

  const stripFragment = document.createDocumentFragment();

  for (let column = 0; column < columnCount; column += 1) {
    const strip = document.createElement("div");
    strip.className = "strip";

    for (let frame = 0; frame < frameCount; frame += 1) {
      const photoFrame = document.createElement("figure");
      photoFrame.className = "strip-frame";

      // Repeating the real photo set keeps the background faithful to the
      // reference strip while still filling the whole page height.
      const image = document.createElement("img");
      image.className = "strip-photo";
      image.src =
        BACKGROUND_IMAGES[(frame + column) % BACKGROUND_IMAGES.length];
      image.alt = "";
      image.loading = frame < 8 ? "eager" : "lazy";
      image.decoding = "async";

      photoFrame.appendChild(image);
      strip.appendChild(photoFrame);
    }

    stripFragment.appendChild(strip);
  }

  stripContainer.replaceChildren(stripFragment);
};

const buildStickerLayout = () => {
  if (tabletBreakpoint.matches || stickerSlots.length === 0) {
    return;
  }

  const pageHeight = getMeasuredPageHeight();
  const topPadding = 224;
  const bottomPadding = 240;
  const usableHeight = Math.max(0, pageHeight - topPadding - bottomPadding);
  const step = usableHeight / Math.max(stickerSlots.length - 1, 1);

  lastMeasuredHeight = pageHeight;

  stickerSlots.forEach((slot, index) => {
    const top = topPadding + step * index;
    slot.style.top = `${top}px`;
  });
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2,
    rootMargin: "0px 0px -10% 0px",
  }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

let latestScrollY = 0;
let rafScheduled = false;
let resizeTimeout;

const updateParallax = () => {
  stripContainer.style.transform = `translate3d(0, ${latestScrollY * PARALLAX_FACTOR}px, 0)`;
  rafScheduled = false;
};

const requestParallaxUpdate = () => {
  latestScrollY = window.scrollY || window.pageYOffset;

  const measuredHeight = getMeasuredPageHeight();
  if (Math.abs(measuredHeight - lastMeasuredHeight) > 24) {
    buildBackgroundStrips();
    buildStickerLayout();
  }

  if (rafScheduled) {
    return;
  }

  rafScheduled = true;
  window.requestAnimationFrame(updateParallax);
};

const rebuildBackground = () => {
  window.clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    buildBackgroundStrips();
    buildStickerLayout();
    requestParallaxUpdate();
  }, 80);
};

buildBackgroundStrips();
buildStickerLayout();
requestParallaxUpdate();

window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
window.addEventListener("resize", rebuildBackground);
window.addEventListener("load", rebuildBackground);
