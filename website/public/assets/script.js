// OSSA Documentation Site JavaScript

document.addEventListener('DOMContentLoaded', function () {
  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  // Add active state to navigation based on scroll position
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    let current = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      const scrollPosition = window.pageYOffset + 100;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  // Throttled scroll listener
  let scrollTimeout;
  window.addEventListener('scroll', function () {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateActiveNav, 10);
  });

  // Copy code blocks functionality
  function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre code');

    codeBlocks.forEach((codeBlock, index) => {
      const pre = codeBlock.parentElement;
      const copyButton = document.createElement('button');

      copyButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            `;

      copyButton.className = 'copy-button';
      copyButton.title = 'Copy code';

      copyButton.addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent);

          // Visual feedback
          this.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    `;
          this.style.color = '#10b981';

          setTimeout(() => {
            this.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        `;
            this.style.color = '';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      });

      pre.style.position = 'relative';
      pre.appendChild(copyButton);
    });
  }

  // Add copy button styles
  const copyButtonStyles = `
        .copy-button {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px;
            color: #e2e8f0;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }
        
        .copy-button:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .copy-button:active {
            transform: scale(0.95);
        }
        
        .nav-link.active {
            color: var(--color-primary);
            background-color: var(--bg-secondary);
        }
    `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = copyButtonStyles;
  document.head.appendChild(styleSheet);

  // Initialize copy buttons
  addCopyButtons();

  // Mobile menu toggle (if needed)
  function createMobileMenu() {
    const nav = document.querySelector('.nav');
    const header = document.querySelector('.header-content');

    if (window.innerWidth <= 768) {
      const menuButton = document.createElement('button');
      menuButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            `;
      menuButton.className = 'mobile-menu-button';
      menuButton.style.cssText = `
                display: block;
                background: none;
                border: none;
                color: var(--text-primary);
                cursor: pointer;
                padding: 8px;
                margin-left: auto;
            `;

      nav.style.display = 'none';
      header.appendChild(menuButton);

      menuButton.addEventListener('click', function () {
        const isVisible = nav.style.display !== 'none';
        nav.style.display = isVisible ? 'none' : 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = 'var(--bg-primary)';
        nav.style.border = '1px solid var(--border-color)';
        nav.style.borderTop = 'none';
        nav.style.padding = 'var(--spacing-md)';
        nav.style.gap = 'var(--spacing-sm)';
      });
    }
  }

  // Handle window resize
  window.addEventListener('resize', function () {
    createMobileMenu();
  });

  // Initialize mobile menu
  createMobileMenu();

  // Lazy loading for images (if any are added later)
  function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach((img) => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
      });
    }
  }

  setupLazyLoading();

  // Add animation on scroll
  function setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe elements that should animate
    const animateElements = document.querySelectorAll(
      '.feature-card, .quickstart-step, .docs-category'
    );
    animateElements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  setupScrollAnimations();

  // Performance monitoring
  if ('performance' in window) {
    window.addEventListener('load', function () {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log(
          'Page load time:',
          perfData.loadEventEnd - perfData.loadEventStart,
          'ms'
        );
      }, 0);
    });
  }
});

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
