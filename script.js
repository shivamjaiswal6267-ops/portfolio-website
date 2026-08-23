// Unified Global Scroll & Canvas Renderer Engine — Shivam Jaiswal Portfolio
(function() {
  const TOTAL_FRAMES = 240;
  const FRAME_PATH = (index) => `./frames/frame_${String(index).padStart(4, '0')}.jpg`;
  
  // DOM Elements
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d');
  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressDetail = document.getElementById('progress-detail');
  const hudOverlay = document.getElementById('hud-overlay');
  const hudFrame = document.getElementById('hud-frame');
  const hudProgress = document.getElementById('hud-progress');
  const hudFps = document.getElementById('hud-fps');

  // Unified Animation Engine State
  const images = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let isLoaded = false;

  // FPS Telemetry
  let lastTime = performance.now();
  let frameCount = 0;

  // =========================================================================
  // UNIFIED GLOBAL SCROLL CONTROLLER
  // Single source of truth for both page content & background video canvas
  // =========================================================================
  function getGlobalScrollY() {
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function getGlobalMaxScroll() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    return Math.max(1, docHeight - window.innerHeight);
  }

  // Handle High-DPI canvas dimensions
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Re-render current frame immediately on resize
    const renderIdx = Math.round(currentFrame);
    if (images[renderIdx] && images[renderIdx].complete) {
      drawCoverImage(images[renderIdx]);
    }
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Aspect-Ratio COVER Fit Drawing Algorithm
  function drawCoverImage(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  // Preload all 240 frame images asynchronously into memory
  function preloadImages() {
    resizeCanvas();

    // Preloader Safety Net Timeout (unveil after 3.5s max)
    setTimeout(() => {
      if (!isLoaded) {
        onLoadComplete();
      }
    }, 3500);

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);

      img.onload = () => {
        loadedCount++;
        updateProgress();

        // Render Frame 1 immediately as initial visual background preview
        if (i === 1 && !isLoaded) {
          drawCoverImage(img);
        }
      };

      img.onerror = () => {
        loadedCount++;
        updateProgress();
      };

      images.push(img);
    }
  }

  function updateProgress() {
    const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}%`;
    if (progressDetail) progressDetail.textContent = `Loaded frame ${loadedCount} of ${TOTAL_FRAMES}`;

    if (loadedCount >= TOTAL_FRAMES) {
      onLoadComplete();
    }
  }

  function onLoadComplete() {
    if (isLoaded) return;
    isLoaded = true;

    // Fade out Preloader screen & reveal Telemetry HUD
    if (preloader) {
      preloader.classList.add('loaded');
    }
    if (hudOverlay) {
      hudOverlay.classList.remove('hud-hidden');
    }

    // Render initial frame
    drawCoverImage(images[0]);
    startUnifiedRenderLoop();
  }

  // Single Unified Render Loop: Calculates global scroll & syncs canvas video frame
  function startUnifiedRenderLoop() {
    function loop(now) {
      const scrollY = getGlobalScrollY();
      const maxScroll = getGlobalMaxScroll();
      const scrollFraction = Math.max(0, Math.min(1, scrollY / maxScroll));

      targetFrame = scrollFraction * (TOTAL_FRAMES - 1);

      // Smooth LERP physics for zero-jitter frame scrubbing (lerpFactor: 0.15)
      const lerpFactor = 0.15;
      currentFrame += (targetFrame - currentFrame) * lerpFactor;

      // Draw current interpolated frame
      const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrame)));
      drawCoverImage(images[frameIndex]);

      // Update Telemetry HUD
      if (hudFrame) {
        hudFrame.textContent = `FRAME ${String(frameIndex + 1).padStart(3, '0')} / ${TOTAL_FRAMES}`;
      }
      if (hudProgress) {
        hudProgress.textContent = `${(scrollFraction * 100).toFixed(1)}%`;
      }

      // FPS Telemetry Calculation
      frameCount++;
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        if (hudFps) {
          hudFps.textContent = `${fps} FPS`;
        }
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // =========================================================================
  // CONTACT FORM WHATSAPP INTEGRATION
  // =========================================================================
  function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const serviceSelect = document.getElementById('contact-service');
      const messageInput = document.getElementById('contact-message');

      const name = nameInput ? nameInput.value.trim() : '';
      const service = serviceSelect ? serviceSelect.value : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !service || !message) {
        alert('Please fill out all fields and select a service.');
        return;
      }

      const formattedText = `Hi Shivam, my name is ${name}. I need help with: ${service}. Message: ${message}`;
      const whatsappUrl = `https://wa.me/916267031972?text=${encodeURIComponent(formattedText)}`;

      window.open(whatsappUrl, '_blank');
    });
  }

  // =========================================================================
  // 3D AUTO-SLIDING COVERFLOW PROJECTS CAROUSEL
  // =========================================================================
  function initProjectsCarousel() {
    const carousel = document.getElementById('projects-carousel');
    if (!carousel) return;

    const cards = Array.from(carousel.getElementsByClassName('carousel-card'));
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if (cards.length === 0) return;

    let activeIndex = 0;
    let autoSlideTimer = null;

    // Create pagination dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      cards.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
          activeIndex = idx;
          updateCarousel();
          resetAutoSlide();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateCarousel() {
      const total = cards.length;
      cards.forEach((card, idx) => {
        card.classList.remove('pos-active', 'pos-prev', 'pos-next', 'pos-hidden-left', 'pos-hidden-right');
        
        let diff = (idx - activeIndex + total) % total;
        if (diff === 0) {
          card.classList.add('pos-active');
        } else if (diff === 1) {
          card.classList.add('pos-next');
        } else if (diff === total - 1) {
          card.classList.add('pos-prev');
        } else if (diff < total / 2) {
          card.classList.add('pos-hidden-right');
        } else {
          card.classList.add('pos-hidden-left');
        }
      });

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.getElementsByClassName('dot');
        Array.from(dots).forEach((dot, idx) => {
          if (idx === activeIndex) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      }
    }

    function nextSlide() {
      activeIndex = (activeIndex + 1) % cards.length;
      updateCarousel();
    }

    function prevSlide() {
      activeIndex = (activeIndex - 1 + cards.length) % cards.length;
      updateCarousel();
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideTimer = setInterval(nextSlide, 3000);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) clearInterval(autoSlideTimer);
    }

    function resetAutoSlide() {
      stopAutoSlide();
      startAutoSlide();
    }

    // Attach event listeners
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide();
      });
    }

    cards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (idx !== activeIndex) {
          activeIndex = idx;
          updateCarousel();
          resetAutoSlide();
        }
      });
    });

    // Pause on hover
    carousel.parentElement.addEventListener('mouseenter', stopAutoSlide);
    carousel.parentElement.addEventListener('mouseleave', startAutoSlide);

    // Initial positioning
    updateCarousel();
    startAutoSlide();
  }

  // =========================================================================
  // VIEW ALL PROJECTS MODAL GALLERY ENGINE
  // =========================================================================
  function initProjectsModal() {
    const modal = document.getElementById('all-projects-modal');
    const openBtn = document.getElementById('open-projects-modal-btn');
    const closeBtn = document.getElementById('close-projects-modal-btn');
    if (!modal) return;

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close when clicking outside container
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // ESC key close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Category Filters
    const filterTabs = modal.querySelectorAll('.filter-tab');
    const modalCards = modal.querySelectorAll('.modal-project-card');

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');
        modalCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.classList.remove('hide');
          } else {
            card.classList.add('hide');
          }
        });
      });
    });
  }

  // =========================================================================
  // FAQ ACCORDION MODAL ENGINE
  // =========================================================================
  function initFaqModal() {
    const modal = document.getElementById('faq-modal');
    const openBtn = document.getElementById('open-faq-btn');
    const closeBtn = document.getElementById('close-faq-btn');
    if (!modal) return;

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Accordion expand/collapse
    const faqItems = modal.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const questionBtn = item.querySelector('.faq-question');
      if (questionBtn) {
        questionBtn.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          faqItems.forEach(other => other.classList.remove('open'));
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      }
    });
  }

  // =========================================================================
  // HERO VIEW MY WORK BUTTON REDIRECT
  // =========================================================================
  function initHeroViewWorkBtn() {
    const viewWorkBtn = document.getElementById('hero-view-work-btn');
    const projectsModal = document.getElementById('all-projects-modal');
    if (viewWorkBtn && projectsModal) {
      viewWorkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        projectsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }
  }

  // =========================================================================
  // EXPERIENCE TIMELINE POPUP ENGINE
  // =========================================================================
  function initExperienceModal() {
    const modal = document.getElementById('experience-modal');
    const openBtn = document.getElementById('open-experience-modal-btn');
    const closeBtn = document.getElementById('close-experience-modal-btn');
    const scrollArea = document.getElementById('timeline-scroll-area');
    const trackFill = document.getElementById('timeline-track-fill');
    const items = modal ? modal.querySelectorAll('.timeline-item') : [];

    if (!modal) return;

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(updateTimelineProgress, 200);
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    function updateTimelineProgress() {
      if (!scrollArea || !trackFill) return;
      const scrollTop = scrollArea.scrollTop;
      const maxScroll = Math.max(1, scrollArea.scrollHeight - scrollArea.clientHeight);
      let progress = Math.min(100, Math.max(15, (scrollTop / maxScroll) * 100));

      trackFill.style.height = `${progress}%`;

      items.forEach((item, idx) => {
        const itemTop = item.offsetTop - scrollArea.offsetTop;
        if (scrollTop + scrollArea.clientHeight * 0.75 >= itemTop || idx === 0) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    if (scrollArea) {
      scrollArea.addEventListener('scroll', updateTimelineProgress, { passive: true });
    }
  }

  // Start initialization
  preloadImages();
  function setupFeatures() {
    initContactForm();
    initProjectsCarousel();
    initProjectsModal();
    initFaqModal();
    initHeroViewWorkBtn();
    initExperienceModal();
  }
  document.addEventListener('DOMContentLoaded', setupFeatures);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setupFeatures();
  }
})();
