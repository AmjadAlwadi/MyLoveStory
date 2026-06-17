document.addEventListener('DOMContentLoaded', function () {

    var cfg = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};

    // ── Password Protection ───────────────────────────────────────────────
    async function sha256(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    var passwordOverlay = document.getElementById('password-overlay');
    var mainContent = document.getElementById('main-content');
    var passwordInput = document.getElementById('password-input');
    var passwordSubmit = document.getElementById('password-submit');
    var passwordError = document.getElementById('password-error');

    if (passwordOverlay && passwordSubmit && passwordInput) {
        async function checkPassword() {
            var inputVal = passwordInput.value;
            var hash = await sha256(inputVal);
            if (hash === "8e0693e731391688401c5c1faeed5f170eb9b0f2956c5f5d1ba873c668d87ad9") {
                passwordOverlay.classList.add('opacity-0');
                setTimeout(function() {
                    passwordOverlay.style.display = 'none';
                }, 500);
                
                mainContent.classList.remove('opacity-30', 'blur-sm', 'pointer-events-none');
                document.body.classList.remove('overflow-hidden');
            } else {
                passwordError.classList.remove('hidden');
                passwordInput.classList.add('border-red-500');
                passwordInput.classList.remove('border-pink-200');
            }
        }

        passwordSubmit.addEventListener('click', checkPassword);
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
        
        passwordInput.addEventListener('input', function() {
            passwordError.classList.add('hidden');
            passwordInput.classList.remove('border-red-500');
            passwordInput.classList.add('border-pink-200');
        });
    }

    // ── Helper ────────────────────────────────────────────────────────────
    function setText(id, value) {
        var el = document.getElementById(id);
        if (el && value !== undefined) el.textContent = value;
    }
    function setAttr(id, attr, value) {
        var el = document.getElementById(id);
        if (el && value !== undefined) el.setAttribute(attr, value);
    }

    // ── Page meta ─────────────────────────────────────────────────────────
    if (cfg.pageTitle) document.title = cfg.pageTitle;

    // ── Background Music ──────────────────────────────────────────────────
    if (cfg.backgroundMusic) {
        var bgAudio = new Audio(cfg.backgroundMusic);
        bgAudio.loop = true;
        
        var playMusic = function() {
            var playPromise = bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(function() {
                    // Successfully started playing, we can remove listeners now
                    document.removeEventListener('click', playMusic);
                    document.removeEventListener('touchstart', playMusic);
                    document.removeEventListener('keydown', playMusic);
                }).catch(function(e) {
                    // Still blocked by browser, wait for another interaction
                });
            }
        };

        // Try playing immediately
        var initialPlay = bgAudio.play();
        if (initialPlay !== undefined) {
            initialPlay.catch(function() {
                // Autoplay blocked, wait for a valid user interaction
                document.addEventListener('click', playMusic);
                document.addEventListener('touchstart', playMusic);
                document.addEventListener('keydown', playMusic);
            });
        }
    }

    // ── Hero ──────────────────────────────────────────────────────────────
    var hero = cfg.hero || {};
    setText('hero-title',    hero.title    || '');
    setText('hero-subtitle', hero.subtitle || '');

    // Hero background video
    if (hero.video) {
        var heroSrc = document.getElementById('hero-video-src');
        if (heroSrc) {
            heroSrc.src = hero.video;
            heroSrc.parentElement.load(); // reload the video with new src
        }
    }

    // ── Envelope section heading ──────────────────────────────────────────
    // (inner letter content is handled by envelope.js)
    var env = cfg.envelope || {};
    setText('envelope-section-title', env.sectionTitle || '');

    // ── Timeline ──────────────────────────────────────────────────────────
    var tl = cfg.timeline || {};
    setText('timeline-title', tl.sectionTitle || '');
    (tl.items || []).forEach(function (item, i) {
        setText('tl-title-' + i, item.title || '');
        setText('tl-text-'  + i, item.text  || '');

        var isVideo = item.image && item.image.toLowerCase().endsWith('.mp4');
        var imgEl   = document.getElementById('tl-img-' + i);
        if (!imgEl) return;

        if (isVideo) {
            // Replace the <img> with an auto-playing <video>
            var vid = document.createElement('video');
            vid.autoplay  = true;
            vid.loop      = true;
            vid.muted     = true;
            vid.setAttribute('playsinline', '');
            vid.className = imgEl.className;
            var src = document.createElement('source');
            src.src  = item.image;
            src.type = 'video/mp4';
            vid.appendChild(src);
            imgEl.parentNode.replaceChild(vid, imgEl);
        } else {
            imgEl.src = item.image || '';
            imgEl.alt = item.title || '';
        }
    });

    // ── Hall of Fame ──────────────────────────────────────────────────────
    var hof = cfg.hallOfFame || {};
    setText('hof-title', hof.sectionTitle || '');
    var hofContainer = document.getElementById('hof-cards-container');
    if (hofContainer && Array.isArray(hof.cards) && hof.cards.length) {
        var hofHtml = '';
        hof.cards.forEach(function (card, i) {
            var delay = (i % 6 + 1) * 100;
            var isVideo = card.image && card.image.toLowerCase().endsWith('.mp4');
            var mediaHtml = isVideo 
                ? '<video autoplay loop muted playsinline src="' + card.image + '" class="w-full h-64 object-cover rounded-md mb-4"></video>'
                : '<img src="' + card.image + '" alt="' + (card.title || '') + '" class="w-full h-64 object-cover rounded-md mb-4">';

            hofHtml += 
                '<div class="snap-center flex-shrink-0 w-44 sm:w-52 md:w-64 lg:w-72" data-aos="fade-up" data-aos-delay="' + delay + '">' +
                  '<div class="bg-white p-6 rounded-lg shadow-lg text-center h-full" dir="rtl">' +
                    mediaHtml +
                    '<h3 class="text-2xl font-anime text-sakura">' + (card.title || '') + '</h3>' +
                    '<p class="mt-2">' + (card.caption || '') + '</p>' +
                  '</div>' +
                '</div>';
        });
        hofContainer.innerHTML = hofHtml;
    }

    // ── Gallery (built dynamically from config) ───────────────────────────
    var gal = cfg.gallery || {};
    setText('gallery-title',    gal.sectionTitle || '');
    setText('gallery-subtitle', gal.subtitle     || '');

    var lgEl = document.getElementById('lightgallery');
    if (lgEl && Array.isArray(gal.images) && gal.images.length) {
        var galHtml = '';
        gal.images.forEach(function (img, i) {
            galHtml +=
                '<a href="' + img.image + '" data-src="' + img.image + '" data-aos="zoom-in" data-aos-delay="' + (i * 100) + '" class="block w-full h-48 md:h-64">' +
                  '<img src="' + img.image + '" alt="' + (img.alt || '') + '" class="rounded-lg shadow-lg hover:scale-105 transition-transform duration-300 w-full h-full object-cover border-4 border-white">' +
                '</a>';
        });
        lgEl.innerHTML = galHtml;
    }

    // ── Finale ────────────────────────────────────────────────────────────
    var fin = cfg.finale || {};
    setText('finale-title', fin.title || '');

    // ── Footer ────────────────────────────────────────────────────────────
    var foot = cfg.footer || {};
    setText('footer-line1', foot.line1 || '');
    setText('footer-line2', foot.line2 || '');

    // ── Live Age Counter ──────────────────────────────────────────────────
    var birthDateStr = cfg.birthDate || '2000-01-01';
    var birthDate = new Date(birthDateStr + 'T00:00:00');
    var countdownEl = document.getElementById('countdown');

    function updateAge() {
        var now = new Date();
        var years   = now.getFullYear() - birthDate.getFullYear();
        var months  = now.getMonth()    - birthDate.getMonth();
        var days    = now.getDate()     - birthDate.getDate();
        var hours   = now.getHours()    - birthDate.getHours();
        var minutes = now.getMinutes()  - birthDate.getMinutes();
        var seconds = now.getSeconds()  - birthDate.getSeconds();

        if (seconds < 0) { seconds += 60; minutes--; }
        if (minutes < 0) { minutes += 60; hours--; }
        if (hours   < 0) { hours   += 24; days--; }
        if (days    < 0) {
            var prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
            months--;
        }
        if (months  < 0) { months += 12; years--; }

        countdownEl.innerHTML =
            years + ' سنة ' + months + ' شهر ' + days + ' يوم <br>' +
            hours + ' ساعة ' + minutes + ' دقيقة ' + seconds + ' ثانية';
    }
    setInterval(updateAge, 1000);
    updateAge();

    // ── AOS ───────────────────────────────────────────────────────────────
    AOS.init({ duration: 800, once: true });

    // ── LightGallery (init after gallery is built above) ─────────────────
    if (lgEl) {
        lightGallery(lgEl, { selector: 'a', speed: 500, download: false });
    }

    // ── Hall of Fame Scroller ─────────────────────────────────────────────
    var scroller      = document.getElementById('hall-of-fame-scroller');
    var scrollLeftBtn = document.getElementById('scroll-left-btn');
    var scrollRightBtn= document.getElementById('scroll-right-btn');
    if (scroller && scrollLeftBtn && scrollRightBtn) {
        var firstCard = scroller.querySelector('.snap-center');
        if (firstCard) {
            var cardWidth = firstCard.offsetWidth + parseInt(getComputedStyle(firstCard.parentElement).gap || '0');
            scrollRightBtn.addEventListener('click', function () {
                scroller.scrollBy({ left: cardWidth, behavior: 'smooth' });
            });
            scrollLeftBtn.addEventListener('click', function () {
                scroller.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            });
        }
    }

    // ── Sakura Petal Animation ────────────────────────────────────────────
    var canvas = document.getElementById('sakura-canvas');
    if (canvas) {
        var ctx = canvas.getContext('2d');
        var petals = [];
        var numPetals = 50;

        function resizeCanvas() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function Petal() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height * 2 - canvas.height;
            this.w = 25 + Math.random() * 15;
            this.h = 20 + Math.random() * 10;
            this.opacity   = this.w / 40;
            this.flip      = Math.random();
            this.xSpeed    = 1.5 + Math.random() * 2;
            this.ySpeed    = 1   + Math.random() * 1;
            this.flipSpeed = Math.random() * 0.03;
        }
        Petal.prototype.draw = function () {
            if (this.y > canvas.height || this.x > canvas.width) {
                this.x      = -this.w;
                this.y      = Math.random() * canvas.height * 2 - canvas.height;
                this.xSpeed = 1.5 + Math.random() * 2;
                this.ySpeed = 1   + Math.random() * 1;
                this.flip   = Math.random();
            }
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.bezierCurveTo(this.x + this.w / 2, this.y - this.h / 2, this.x + this.w, this.y, this.x + this.w / 2, this.y + this.h / 2);
            ctx.bezierCurveTo(this.x, this.y + this.h, this.x - this.w / 2, this.y, this.x, this.y);
            ctx.closePath();
            ctx.fillStyle = '#FFB7C5';
            ctx.fill();
        };
        Petal.prototype.update = function () {
            this.x    += this.xSpeed;
            this.y    += this.ySpeed;
            this.flip += this.flipSpeed;
            this.draw();
        };

        for (var i = 0; i < numPetals; i++) { petals.push(new Petal()); }

        (function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            petals.forEach(function (p) { p.update(); });
            requestAnimationFrame(animate);
        }());
    }
});
