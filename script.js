const stripContainer = document.getElementById("background-strips");

for (let column = 0; column < 5; column += 1) {
  const strip = document.createElement("div");
  strip.className = "strip";

  for (let frame = 0; frame < 6; frame += 1) {
    const frameEl = document.createElement("div");
    frameEl.className = "strip-frame";
    strip.appendChild(frameEl);
  }

  stripContainer.appendChild(strip);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
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

const updateParallax = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  stripContainer.style.transform = `translate3d(0, ${scrollY * 0.18}px, 0)`;
};

updateParallax();
window.addEventListener("scroll", updateParallax, { passive: true });
