// ---  LOGIKA STRONY GŁÓWNEJ (PROJEKTU) ---
const mainContainer = document.getElementById('mainContainer');

if (mainContainer) {
    const sliders = [];
    const rollSound = document.getElementById('rollSound');
    const hornSound = document.getElementById('hornSound');
    const shockSound = document.getElementById('shockSound');
    const clickSound = document.getElementById('clickSound');
    const resetSound = document.getElementById('resetSound');

    const image1 = 'images/1.png';
    const image2 = 'images/2.png';
    const initialScale = 0.45;

    let rollCount;
    let resizeTimeout;

    function getRollCount() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (width > height) return 8;
        if (width < 540) return 3;
        if (width < 640) return 4;
        if (width < 740) return 5;
        if (width < 840) return 6;
        if (width < 950) return 7;
        return 8;
    }

    function waitForImagesLoad(callback) {
        const images = document.querySelectorAll('.windows img');
        let loaded = 0;
        const total = images.length;
        if (!total) return callback();
        images.forEach(img => {
            if (img.complete) {
                if (++loaded === total) callback();
            } else {
                img.onload = img.onerror = () => {
                    if (++loaded === total) callback();
                };
            }
        });
    }

    function setScrollInstantly(el, left, top) {
        el.style.scrollBehavior = 'auto';
        el.scrollLeft = left;
        el.scrollTop = top;
        requestAnimationFrame(() => {
            el.style.scrollBehavior = '';
        });
    }

    function setInitialScrollPositions() {
        if (!rollCount) return;
        const roll4ScrollLeft = (3 * 100 + 1000) % 2000;
        const baseScrollIndex5 = (5 * 100 + 1000) % 2000;
        const ujednoliconyScrollLeft = (baseScrollIndex5 + 30) % 2000;

        sliders.forEach((slider, index) => {
            const segmentHeight = slider.container.scrollHeight / rollCount;
            let scrollLeft, scrollTop;

            if (index === 3) {
                scrollTop = segmentHeight * index;
            } else if (index <= 2) {
                scrollTop = segmentHeight * 3;
            } else if (index >= 5 && index <= 7) {
                scrollTop = segmentHeight * (index === 7 ? 6 : index);
            } else {
                scrollTop = segmentHeight * index;
            }

            if (rollCount >= 6) {
                if (index === 3 || index <= 2) scrollLeft = roll4ScrollLeft;
                else if (index >= 5 && index <= 7) scrollLeft = ujednoliconyScrollLeft;
                else scrollLeft = (index * 100 + 1000) % 2000;
            } else {
                const isLast = (index === rollCount - 1);
                const isPenultimate = (index === rollCount - 2);
                if (isLast) scrollLeft = 1560;
                else if (isPenultimate) scrollLeft = 430;
                else {
                    if (index === 3 || index <= 2) scrollLeft = roll4ScrollLeft;
                    else scrollLeft = (index * 100 + 1000) % 2000;
                }
            }
            setScrollInstantly(slider.container, scrollLeft, scrollTop);
        });
    }

    function zoom(container, factor) {
        container.querySelectorAll('.img-wrapper').forEach(wrapper => {
            let scale = parseFloat(wrapper.dataset.scale || initialScale);
            scale *= factor;
            scale = Math.min(Math.max(scale, 0.1), 2);
            wrapper.dataset.scale = scale;
            wrapper.style.transform = `scale(${scale})`;
        });
    }

    function createSliders() {
        rollCount = getRollCount();
        mainContainer.innerHTML = '';
        sliders.length = 0;

        for (let i = 0; i < rollCount; i++) {
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

            windows.addEventListener('click', e => {
                e.preventDefault();
                shockSound.currentTime = 0;
                shockSound.play().catch(() => {});
                const flash = document.querySelector('.flash');
                if(flash) {
                    flash.style.animation = 'none';
                    flash.offsetHeight;
                    flash.style.animation = 'flashEffect 0.4s ease-out';
                }
                windows.querySelectorAll('img').forEach(img => {
                    img.src = img.src.includes(image1) ? image2 : image1;
                });
            });

            for (let j = 0; j < 3; j++) {
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'img-wrapper';
                imgWrapper.dataset.scale = initialScale;
                imgWrapper.style.transform = `scale(${initialScale})`;
                const img = document.createElement('img');
                img.src = image1;
                imgWrapper.appendChild(img);
                windows.appendChild(imgWrapper);
            }

            wrapper.appendChild(windows);
            container.appendChild(wrapper);

            const zoomDiv = document.createElement('div');
            zoomDiv.className = 'zoom-buttons';
            const zoomIn = document.createElement('button');
            zoomIn.textContent = '+';
            zoomIn.onclick = () => { zoom(windows, 1.1); clickSound.currentTime = 0; clickSound.play().catch(() => {}); };
            const zoomOut = document.createElement('button');
            zoomOut.textContent = '−';
            zoomOut.onclick = () => { zoom(windows, 0.9); clickSound.currentTime = 0; clickSound.play().catch(() => {}); };

            zoomDiv.appendChild(zoomIn);
            zoomDiv.appendChild(zoomOut);
            container.appendChild(zoomDiv);
            mainContainer.appendChild(container);
            sliders.push({ container: windows });
        }
        waitForImagesLoad(setInitialScrollPositions);
    }

    let scrollSpeed = 15;
    let scrollDirection = 0;
    let scrolling = false;
    let hornPlayed = false;

    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');

    function triggerAlarm(button) {
        if (hornPlayed) return;
        hornPlayed = true;
        rollSound.pause();
        rollSound.currentTime = 0;
        hornSound.currentTime = 0;
        hornSound.play().catch(() => {});
        if(leftBtn) leftBtn.classList.remove('active');
        if(rightBtn) rightBtn.classList.remove('active');
        if(button) button.classList.add('active');
        stopScrolling();
    }

    function scrollStep() {
        if (!scrolling) return;
        sliders.forEach(({ container }) => {
            container.scrollLeft += scrollDirection * scrollSpeed;
            const tolerance = 5; 
            const atStart = container.scrollLeft <= tolerance;
            const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - tolerance;
            if (scrollDirection === -1 && atStart) triggerAlarm(leftBtn);
            if (scrollDirection === 1 && atEnd) triggerAlarm(rightBtn);
        });
        requestAnimationFrame(scrollStep);
    }

    function startScrolling(direction) {
        scrollDirection = direction;
        scrolling = true;
        hornPlayed = false;
        if(leftBtn) leftBtn.classList.remove('active');
        if(rightBtn) rightBtn.classList.remove('active');
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

    // --- POPRAWKA DLA CHROME: GLOBALNE ZATRZYMYWANIE ---
    if(leftBtn && rightBtn) {
        const handleStart = (dir, e) => {
            if (e.cancelable) e.preventDefault();
            startScrolling(dir);
        };

        leftBtn.addEventListener('mousedown', (e) => handleStart(-1, e));
        rightBtn.addEventListener('mousedown', (e) => handleStart(1, e));
        leftBtn.addEventListener('touchstart', (e) => handleStart(-1, e), { passive: false });
        rightBtn.addEventListener('touchstart', (e) => handleStart(1, e), { passive: false });

        window.addEventListener('mouseup', stopScrolling);
        window.addEventListener('touchend', stopScrolling);
        window.addEventListener('touchcancel', stopScrolling);
    }

    const resetBtn = document.getElementById('resetBtn');
    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetSound.currentTime = 0;
            resetSound.play().catch(() => {});
            setTimeout(() => location.reload(), 200);
        });
    }

    const startScreen = document.getElementById('startScreen');
    if(startScreen) {
        startScreen.addEventListener('click', () => {
            startScreen.style.display = 'none';
            [rollSound, hornSound, shockSound, clickSound, resetSound].forEach(a => {
                a.play().catch(() => {}).then(() => {
                    a.pause();
                    a.currentTime = 0;
                });
            });
            createSliders();
        });
    }

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (rollCount !== getRollCount()) {
                if(resetBtn) resetBtn.click();
                else location.reload();
            }
        }, 300);
    });
}

// --- OBSŁUGA KLAWIATURY ---
document.addEventListener('keydown', e => {
    if (mainContainer) {
        if (e.key === 'ArrowLeft' && !scrolling) startScrolling(-1);
        if (e.key === 'ArrowRight' && !scrolling) startScrolling(1);
        if (e.key === '+' || e.key === '=') sliders.forEach(s => zoom(s.container, 1.1));
        if (e.key === '-' || e.key === '_') sliders.forEach(s => zoom(s.container, 0.9));
        if (e.key === 'Enter') {
            stopScrolling();
            hornSound.currentTime = 0;
            hornSound.play().catch(() => {});
        }
    }
    if (e.key === 'Alt' || e.key === 'Option') {
        const rb = document.getElementById('resetBtn');
        if(rb) rb.click();
    }
});
document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') stopScrolling();
});

// ---  SEKCJA ANIMACJI INTERFEJSU (Z OPTYMALIZACJĄ DLA CHROME) ---
document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('h2');
    const hrs = document.querySelectorAll('hr');

    if (headers.length > 0 || hrs.length > 0) {
        headers.forEach((h2) => {
            if (!h2.querySelector('span')) {
                const text = h2.textContent;
                h2.textContent = '';
                const span = document.createElement('span');
                span.textContent = text;
                h2.appendChild(span);
            }
        });

        // Niższy threshold dla pewności w Chrome
        const headerObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add('is-visible');
            });
        }, { threshold: 0.05 });

        headers.forEach((h2) => headerObserver.observe(h2));

        const hrObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
                else entry.target.classList.remove('visible');
            });
        }, { threshold: 0.1 });

        hrs.forEach((hr) => hrObserver.observe(hr));

        // Wymuszenie sprawdzenia na starcie
        setTimeout(() => {
            headers.forEach(h => {
                if (h.getBoundingClientRect().top < window.innerHeight) h.classList.add('is-visible');
            });
        }, 100);
    }
});