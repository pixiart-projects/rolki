const mainContainer = document.getElementById('mainContainer');
const sliders = [];
const rollSound = document.getElementById('rollSound');
const hornSound = document.getElementById('hornSound');
const shockSound = document.getElementById('shockSound');
const clickSound = document.getElementById('clickSound');
const resetSound = document.getElementById('resetSound');

const image1 = 'images/1.png';
const image2 = 'images/2.png';
const initialScale = 0.45;

let rollCount; // Zmienna, która przechowa docelową liczbę rolek

function getRollCount() {
  const width = window.innerWidth;
  if (width < 480) {
    return 3; // Wersja 4: Smartfon (3 rolki)
  } else if (width < 650) {
    return 4; // Wersja 3: Smartfon Horyzontalnie (4 rolki)
  } else if (width < 900) {
    return 6; // Wersja 2: Mniejszy Tablet (6 rolek)
  } else {
    return 8; // Domyślnie: Desktop/Laptop (8 rolek)
  }
}

function waitForImagesLoad(callback) {
  const images = document.querySelectorAll('.windows img');
  let loadedCount = 0;
  const total = images.length;
  if (total === 0) return callback();
  images.forEach((img) => {
    if (img.complete) loadedCount++;
    else img.onload = img.onerror = () => ++loadedCount === total && callback();
  });
}

function setScrollInstantly(element, left, top) {
  const prev = element.style.scrollBehavior;
  element.style.scrollBehavior = 'auto';
  element.scrollLeft = left;
  element.scrollTop = top;
  element.style.scrollBehavior = prev;
}

/**
 * Ustawia początkowe pozycje przewijania (scroll) dla rolek.
 * Wdrożono logikę klonowania pozycji:
 * - Rolki 1, 2, 3 (indeksy 0, 1, 2) przyjmują pozycję Rolki 4 (indeks 3).
 * - Rolka 8 (indeks 7) przyjmuje pozycję Rolki 7 (indeks 6).
 */
function setInitialScrollPositions() {
  if (!rollCount) return;

  sliders.forEach((slider, index) => {
    // Pozycja pozioma (bez zmian)
    const scrollLeftValue = (index * 100 + 1000) % 2000;
    let scrollTopValue = 0;

    // Zmienna dla obliczenia bazowej wysokości jednego segmentu
    const segmentHeight = slider.container.scrollHeight / rollCount;

    // 1. Pozycja dla rolek 1, 2, 3 (indeksy 0, 1, 2)
    if (index === 0 || index === 1 || index === 2) {
      // Pozycja Rolki 4 (indeks 3)
      scrollTopValue = segmentHeight * 3;
    }

    // 2. Pozycja dla Rolki 4 (indeks 3) - oryginalna
    else if (index === 3) {
      scrollTopValue = segmentHeight * index;
    }

    // 3. Pozycja dla Rolki 8 (indeks 7)
    else if (index === 7) {
      // Pozycja Rolki 7 (indeks 6)
      scrollTopValue = segmentHeight * 6;
    }

    // 4. Pozycja dla Rolki 7 (indeks 6) - oryginalna
    else if (index === 6) {
      scrollTopValue = segmentHeight * index;
    }

    // 5. Pozycja dla pozostałych rolek (5 i 6, czyli indeksy 4 i 5) - oryginalna
    else {
      scrollTopValue = segmentHeight * index;
    }

    setScrollInstantly(slider.container, scrollLeftValue, scrollTopValue);
  });
}

function zoom(container, factor) {
  const wrappers = container.querySelectorAll('.img-wrapper');
  wrappers.forEach((wrapper) => {
    const style = window.getComputedStyle(wrapper); // Użycie WebKitCSSMatrix
    const matrix = new WebKitCSSMatrix(style.transform);
    let currentScale = matrix.a;
    let newScale = currentScale * factor;

    wrapper.style.transform = `scale(${Math.min(
      Math.max(newScale, 0.1),
      2.0
    )})`;
  });
}

function createSliders() {
  // KLUCZOWA ZMIANA: Ustawienie dynamicznej liczby rolek
  rollCount = getRollCount();

  mainContainer.innerHTML = '';
  sliders.length = 0;
  const indices = Array.from({ length: rollCount }, (_, i) => i);

  indices.forEach((_, i) => {
    const container = document.createElement('div');
    container.className = 'rolka-container';
    container.style.animationDelay = `${i * 0.1}s`;

    container.addEventListener('animationstart', () => {
      resetSound.currentTime = 0;
      resetSound.play().catch(() => {});
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'rolka-wrapper';
    const windows = document.createElement('div');
    windows.className = 'windows';

    windows.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      shockSound.currentTime = 0;
      shockSound.play().catch(() => {});

      const flash = document.querySelector('.flash');
      flash.style.animation = 'none';
      flash.offsetHeight;
      flash.style.animation = 'flashEffect 0.4s ease-out';

      const images = windows.querySelectorAll('.img-wrapper img');
      images.forEach((img) => {
        img.src = img.src.includes(image1) ? image2 : image1;
      });
    });

    for (let j = 0; j < 3; j++) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'img-wrapper';
      imgWrapper.style.transform = `scale(${initialScale})`;
      const img = document.createElement('img');
      img.src = image1;
      img.alt = `Segment ${i + 1} - Zdjęcie ${j + 1}`;
      imgWrapper.appendChild(img);
      windows.appendChild(imgWrapper);
    }

    wrapper.appendChild(windows);
    container.appendChild(wrapper);

    const zoomDiv = document.createElement('div');
    zoomDiv.className = 'zoom-buttons';
    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.onclick = () => {
      zoom(windows, 1.1);
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    };
    const zoomOut = document.createElement('button');
    zoomOut.textContent = '−';
    zoomOut.onclick = () => {
      zoom(windows, 0.9);
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    };
    zoomDiv.appendChild(zoomIn);
    zoomDiv.appendChild(zoomOut);
    container.appendChild(zoomDiv);

    mainContainer.appendChild(container);
    sliders.push({ container: windows });
  });
  waitForImagesLoad(setInitialScrollPositions);
}

// --- Kontrola Ruchu i Dźwięku ---

let scrollSpeed = 15;
let scrollDirection = 0;
let scrolling = false;
let hornPlayed = false;
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

function scrollStep() {
  if (!scrolling) return;
  sliders.forEach(({ container }) => {
    const prev = container.style.scrollBehavior;
    container.style.scrollBehavior = 'auto';
    container.scrollLeft += scrollDirection * scrollSpeed;
    container.style.scrollBehavior = prev;

    const atStart = container.scrollLeft <= 0;
    const atEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth; // Aktywacja SYGNAŁU GRANICZNEGO (Horn) przy krańcu (Czerwony styl)

    if (
      (scrollDirection === -1 && atStart) ||
      (scrollDirection === 1 && atEnd)
    ) {
      if (!hornPlayed) {
        rollSound.pause();
        rollSound.currentTime = 0;
        hornSound.currentTime = 0;
        hornSound.play().catch(() => {}); // Aktywacja Czerwonego Alarmu na przycisku

        leftBtn.classList.remove('active');
        rightBtn.classList.remove('active');
        if (scrollDirection === 1) leftBtn.classList.add('active');
        else rightBtn.classList.add('active');

        hornPlayed = true;
      }
      stopScrolling();
    }
  });
  requestAnimationFrame(scrollStep);
}

function startScrolling(direction) {
  scrollDirection = direction;
  scrolling = true;
  hornPlayed = false;
  leftBtn.classList.remove('active');
  rightBtn.classList.remove('active');
  rollSound.loop = true;
  rollSound.currentTime = 0;
  rollSound.play().catch(() => {});
  requestAnimationFrame(scrollStep);
}

function stopScrolling() {
  if (!scrolling) return;
  scrolling = false;
  rollSound.pause();
  rollSound.currentTime = 0;
}

// --- Listenery zdarzeń ---

// Mysz: przytrzymanie przycisku strzałki
leftBtn.addEventListener('mousedown', () => startScrolling(1));
rightBtn.addEventListener('mousedown', () => startScrolling(-1));
leftBtn.addEventListener('mouseup', stopScrolling);
rightBtn.addEventListener('mouseup', stopScrolling);
leftBtn.addEventListener('mouseleave', stopScrolling);
rightBtn.addEventListener('mouseleave', stopScrolling);

// Klawiatura: Strzałki Lewo/Prawo
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' && !scrolling) {
    startScrolling(-1);
    e.preventDefault();
  }
  if (e.key === 'ArrowRight' && !scrolling) {
    startScrolling(1);
    e.preventDefault();
  } // Klawiatura: Zoom (+/-)
  if (e.key === '=' || e.key === '+') {
    sliders.forEach((s) => zoom(s.container, 1.1));
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
  if (e.key === '-' || e.key === '_') {
    sliders.forEach((s) => zoom(s.container, 0.9));
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  } // Klawiatura: Enter (BLOKADA/Klakson)
  if (e.key === 'Enter') {
    stopScrolling();
    hornSound.currentTime = 0;
    hornSound.play().catch(() => {});
    leftBtn.classList.remove('active');
    rightBtn.classList.remove('active');
    e.preventDefault();
  } // Klawiatura: ALT/OPTION (RESET)
  if (e.key === 'Alt' || e.key === 'Option') {
    document.getElementById('resetBtn').click();
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') stopScrolling();
});

// Przycisk Reset (ALT/OPTION)
document.getElementById('resetBtn').addEventListener('click', () => {
  resetSound.currentTime = 0;
  resetSound.play().catch(() => {});
  setTimeout(() => {
    location.reload();
  }, 200);
});

// Aktywacja po kliknięciu na ekran startowy
const startScreen = document.getElementById('startScreen');
startScreen.addEventListener('click', () => {
  startScreen.style.display = 'none';
  [rollSound, hornSound, shockSound, clickSound, resetSound].forEach((a) => {
    a.play().catch(() => {});
    a.pause();
    a.currentTime = 0;
  });
  createSliders();
});

//Kursor
(function () {
  const start = document.getElementById('startScreen'); // zabezpieczenie - jeśli element nie istnieje, nic nie rób

  if (!start) return;

  start.addEventListener('click', function onStart(e) {
    // opcjonalnie odtwórz dźwięk, animuj itp.
    // ukryj start screen
    start.style.display = 'none'; // dodaj klasę, która włącza niestandardowy kursor

    document.body.classList.add('custom-cursor'); // usuń listener (opcjonalnie)

    start.removeEventListener('click', onStart);
  });
})();

// --- KOD ODPOWIEDZIALNY ZA RESPONSYWNOŚĆ LICZBY ROLEK ---
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Sprawdź, czy nowa szerokość okna wymaga innej liczby rolek
    if (rollCount !== getRollCount()) {
      // Wymuś reset, aby ponownie utworzyć rolki z nową liczą
      document.getElementById('resetBtn').click();
    }
  }, 300);
});
