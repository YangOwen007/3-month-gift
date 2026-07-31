const stripContainer = document.getElementById("background-strips");
const mobileBreakpoint = window.matchMedia("(max-width: 560px)");
const tabletBreakpoint = window.matchMedia("(max-width: 860px)");
const PARALLAX_FACTOR = 0.08;
const BACKGROUND_BUFFER = 192;

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
  const frameHeight = stripWidth * (4 / 3) + gap;
  const pageHeight = document.documentElement.scrollHeight;
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
      const frameEl = document.createElement("div");
      frameEl.className = "strip-frame";
      strip.appendChild(frameEl);
    }

    stripFragment.appendChild(strip);
  }

  stripContainer.replaceChildren(stripFragment);
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
    requestParallaxUpdate();
  }, 80);
};

buildBackgroundStrips();
requestParallaxUpdate();

window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
window.addEventListener("resize", rebuildBackground);
window.addEventListener("load", rebuildBackground);
