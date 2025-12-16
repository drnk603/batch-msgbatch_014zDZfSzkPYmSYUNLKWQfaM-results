(function () {
  'use strict';

  const app = window.__app || {};
  window.__app = app;

  const config = {
    debounceDelay: 250,
    throttleDelay: 100,
    animationDuration: 600,
    headerHeight: 72,
    countUpDuration: 2000,
    scrollOffset: 120,
  };

  const state = {
    isMenuOpen: false,
    isSubmitting: false,
    observers: [],
    activeSection: null,
  };

  const utils = {
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },

    throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },

    isReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    lockScroll() {
      document.body.classList.add('u-no-scroll');
    },

    unlockScroll() {
      document.body.classList.remove('u-no-scroll');
    },

    smoothScrollTo(element, offset = config.headerHeight) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    },
  };

  const validators = {
    name(value) {
      const trimmed = value.trim();
      if (!trimmed) return 'Bitte geben Sie Ihren Namen ein';
      if (trimmed.length < 2) return 'Name muss mindestens 2 Zeichen lang sein';
      if (!/^[a-zA-ZÀ-ÿ\s-']+$/.test(trimmed)) return 'Name enthält ungültige Zeichen';
      return null;
    },

    email(value) {
      const trimmed = value.trim();
      if (!trimmed) return 'Bitte geben Sie Ihre E-Mail-Adresse ein';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      return null;
    },

    phone(value) {
      if (!value) return null;
      const trimmed = value.trim();
      if (!/^[\d\s+()-]{10,20}$/.test(trimmed)) return 'Bitte geben Sie eine gültige Telefonnummer ein';
      return null;
    },

    message(value) {
      const trimmed = value.trim();
      if (!trimmed) return 'Bitte geben Sie eine Nachricht ein';
      if (trimmed.length < 10) return 'Nachricht muss mindestens 10 Zeichen lang sein';
      return null;
    },

    checkbox(checked) {
      return checked ? null : 'Bitte akzeptieren Sie die Datenschutzerklärung';
    },
  };

  const burgerMenu = {
    init() {
      const nav = document.querySelector('.c-nav#main-nav');
      const toggle = document.querySelector('.c-nav__toggle');
      const navList = document.querySelector('.c-nav__list');

      if (!nav || !toggle || !navList) return;

      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle(nav, toggle);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isMenuOpen) {
          this.close(nav, toggle);
          toggle.focus();
        }
      });

      document.addEventListener('click', (e) => {
        if (state.isMenuOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
          this.close(nav, toggle);
        }
      });

      navList.querySelectorAll('.c-nav__link').forEach((link) => {
        link.addEventListener('click', () => this.close(nav, toggle));
      });

      window.addEventListener('resize', utils.debounce(() => {
        if (window.innerWidth >= 1024 && state.isMenuOpen) {
          this.close(nav, toggle);
        }
      }, config.debounceDelay));
    },

    toggle(nav, toggle) {
      state.isMenuOpen ? this.close(nav, toggle) : this.open(nav, toggle);
    },

    open(nav, toggle) {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      utils.lockScroll();
      state.isMenuOpen = true;
    },

    close(nav, toggle) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      utils.unlockScroll();
      state.isMenuOpen = false;
    },
  };

  const scrollEffects = {
    init() {
      this.initIntersectionObserver();
      this.initScrollSpy();
      this.initParallax();
      this.initCountUp();
      this.initImageReveal();
    },

    initIntersectionObserver() {
      const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.triggerAnimation(entry.target);
          }
        });
      }, options);

      document.querySelectorAll('.c-card, .c-feature-card, .c-service-card, .c-testimonial-card, .c-team-card, .c-mission__card, .c-info-card, .c-stat-card, .c-charity__card, .c-contact-info__card').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
      });

      state.observers.push(observer);
    },

    triggerAnimation(element) {
      element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    },

    initScrollSpy() {
      const sections = document.querySelectorAll('[id]');
      const navLinks = document.querySelectorAll('.c-nav__link[href^="#"]');

      if (!sections.length || !navLinks.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            state.activeSection = entry.target.id;
            this.updateActiveLink(navLinks);
          }
        });
      }, {
        threshold: 0.5,
        rootMargin: `-${config.headerHeight}px 0px -50% 0px`,
      });

      sections.forEach((section) => observer.observe(section));
      state.observers.push(observer);
    },

    updateActiveLink(links) {
      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === `#${state.activeSection}`) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    },

    initParallax() {
      const parallaxElements = document.querySelectorAll('.c-hero, .l-hero');
      if (!parallaxElements.length || utils.isReducedMotion()) return;

      const handleScroll = utils.throttle(() => {
        const scrolled = window.pageYOffset;
        parallaxElements.forEach((el) => {
          const speed = 0.5;
          el.style.transform = `translateY(${scrolled * speed}px)`;
        });
      }, config.throttleDelay);

      window.addEventListener('scroll', handleScroll, { passive: true });
    },

    initCountUp() {
      const counters = document.querySelectorAll('.c-countdown__value, .c-stat-card__number, .c-charity__metric-number, .c-rating-summary__number');
      if (!counters.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.dataset.counted) {
            this.animateCounter(entry.target);
            entry.target.dataset.counted = 'true';
          }
        });
      }, { threshold: 0.5 });

      counters.forEach((counter) => observer.observe(counter));
      state.observers.push(observer);
    },

    animateCounter(element) {
      const target = parseFloat(element.textContent.replace(/[^\d.]/g, ''));
      if (isNaN(target)) return;

      const duration = config.countUpDuration;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;
      const suffix = element.textContent.replace(/[\d.]/g, '').trim();

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          element.textContent = target + (suffix ? ' ' + suffix : '');
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(current) + (suffix ? ' ' + suffix : '');
        }
      }, 16);
    },

    initImageReveal() {
      const images = document.querySelectorAll('img[loading="lazy"]');
      if (!images.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.classList.contains('is-loaded')) {
            entry.target.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            entry.target.style.opacity = '1';
            entry.target.classList.add('is-loaded');
          }
        });
      }, { threshold: 0.1 });

      images.forEach((img) => {
        img.style.opacity = '0';
        observer.observe(img);
      });

      state.observers.push(observer);
    },
  };

  const microInteractions = {
    init() {
      this.initButtonRipple();
      this.initCardHover();
      this.initLinkHover();
      this.initFormFocus();
    },

    initButtonRipple() {
      document.querySelectorAll('.c-button').forEach((button) => {
        button.addEventListener('click', (e) => {
          const ripple = document.createElement('span');
          const rect = button.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;

          ripple.style.width = ripple.style.height = `${size}px`;
          ripple.style.left = `${x}px`;
          ripple.style.top = `${y}px`;
          ripple.style.position = 'absolute';
          ripple.style.borderRadius = '50%';
          ripple.style.background = 'rgba(255, 255, 255, 0.6)';
          ripple.style.pointerEvents = 'none';
          ripple.style.transform = 'scale(0)';
          ripple.style.animation = 'ripple-effect 0.6s ease-out';

          button.style.position = 'relative';
          button.style.overflow = 'hidden';
          button.appendChild(ripple);

          setTimeout(() => ripple.remove(), 600);
        });
      });

      const style = document.createElement('style');
      style.textContent = `
        @keyframes ripple-effect {
          to { transform: scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    },

    initCardHover() {
      document.querySelectorAll('.c-card, .c-feature-card, .c-service-card, .c-testimonial-card').forEach((card) => {
        card.addEventListener('mouseenter', function() {
          if (!utils.isReducedMotion()) {
            this.style.transition = 'all 0.3s ease-out';
            this.style.transform = 'translateY(-8px) scale(1.02)';
          }
        });

        card.addEventListener('mouseleave', function() {
          if (!utils.isReducedMotion()) {
            this.style.transform = 'translateY(0) scale(1)';
          }
        });
      });
    },

    initLinkHover() {
      document.querySelectorAll('.c-nav__link, .c-footer__link, .c-link').forEach((link) => {
        link.addEventListener('mouseenter', function() {
          this.style.transition = 'color 0.2s ease-out';
        });
      });
    },

    initFormFocus() {
      document.querySelectorAll('.c-form__input, .c-form__textarea').forEach((input) => {
        input.addEventListener('focus', function() {
          this.parentElement.classList.add('is-focused');
        });

        input.addEventListener('blur', function() {
          this.parentElement.classList.remove('is-focused');
        });
      });
    },
  };

  const formHandler = {
    init() {
      const form = document.getElementById('contact-form');
      if (!form) return;

      form.addEventListener('submit', (e) => this.handleSubmit(e, form));

      form.querySelectorAll('.c-form__input, .c-form__textarea').forEach((input) => {
        input.addEventListener('blur', () => this.validateField(input));
      });
    },

    async handleSubmit(e, form) {
      e.preventDefault();
      e.stopPropagation();

      if (state.isSubmitting) return;

      const isValid = this.validateForm(form);
      if (!isValid) return;

      state.isSubmitting = true;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></span> Wird gesendet...';

      const style = document.createElement('style');
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);

      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      try {
        const response = await fetch('process.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();

        if (result.success) {
          this.showNotification('Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.', 'success');
          setTimeout(() => {
            window.location.href = 'thank_you.html';
          }, 1500);
        } else {
          throw new Error(result.message || 'Ein Fehler ist aufgetreten');
        }
      } catch (error) {
        this.showNotification(error.message || 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.', 'error');
      } finally {
        state.isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        style.remove();
      }
    },

    validateForm(form) {
      let isValid = true;

      const nameInput = form.querySelector('#name');
      const emailInput = form.querySelector('#email');
      const phoneInput = form.querySelector('#phone');
      const messageInput = form.querySelector('#message');
      const privacyCheckbox = form.querySelector('#privacy-consent');

      if (nameInput) {
        const error = validators.name(nameInput.value);
        this.showError(nameInput, error);
        if (error) isValid = false;
      }

      if (emailInput) {
        const error = validators.email(emailInput.value);
        this.showError(emailInput, error);
        if (error) isValid = false;
      }

      if (phoneInput && phoneInput.value) {
        const error = validators.phone(phoneInput.value);
        this.showError(phoneInput, error);
        if (error) isValid = false;
      }

      if (messageInput) {
        const error = validators.message(messageInput.value);
        this.showError(messageInput, error);
        if (error) isValid = false;
      }

      if (privacyCheckbox) {
        const error = validators.checkbox(privacyCheckbox.checked);
        this.showError(privacyCheckbox, error);
        if (error) isValid = false;
      }

      return isValid;
    },

    validateField(input) {
      let error = null;

      if (input.id === 'name') {
        error = validators.name(input.value);
      } else if (input.id === 'email') {
        error = validators.email(input.value);
      } else if (input.id === 'phone' && input.value) {
        error = validators.phone(input.value);
      } else if (input.id === 'message') {
        error = validators.message(input.value);
      } else if (input.id === 'privacy-consent') {
        error = validators.checkbox(input.checked);
      }

      this.showError(input, error);
      return !error;
    },

    showError(input, errorMessage) {
      const errorElement = document.getElementById(`${input.id}-error`);
      if (!errorElement) return;

      if (errorMessage) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
      } else {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
      }
    },

    showNotification(message, type) {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.style.cssText = `
        min-width:300px;
        margin-bottom:10px;
        padding:16px 20px;
        border-radius:8px;
        box-shadow:0 4px 12px rgba(0,0,0,0.15);
        color:#fff;
        font-weight:500;
        background-color:${type === 'success' ? '#059669' : '#dc2626'};
        animation:slideIn 0.3s ease-out;
      `;
      toast.textContent = message;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
          style.remove();
        }, 300);
      }, 5000);
    },
  };

  const smoothScroll = {
    init() {
      document.addEventListener('click', (e) => {
        const target = e.target.closest('a[href^="#"]');
        if (!target) return;

        const href = target.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (!targetElement) return;

        e.preventDefault();
        utils.smoothScrollTo(targetElement);
        
        if (state.isMenuOpen) {
          const nav = document.querySelector('.c-nav#main-nav');
          const toggle = document.querySelector('.c-nav__toggle');
          if (nav && toggle) burgerMenu.close(nav, toggle);
        }
      });
    },
  };

  const scrollToTop = {
    init() {
      const button = this.createButton();
      document.body.appendChild(button);

      window.addEventListener('scroll', utils.throttle(() => {
        if (window.pageYOffset > 300) {
          button.classList.add('is-visible');
        } else {
          button.classList.remove('is-visible');
        }
      }, config.throttleDelay), { passive: true });

      button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    },

    createButton() {
      const button = document.createElement('button');
      button.innerHTML = '↑';
      button.setAttribute('aria-label', 'Nach oben scrollen');
      button.style.cssText = `
        position:fixed;
        bottom:30px;
        right:30px;
        width:50px;
        height:50px;
        border-radius:50%;
        background:#047857;
        color:#fff;
        border:none;
        font-size:24px;
        cursor:pointer;
        box-shadow:0 4px 12px rgba(0,0,0,0.15);
        z-index:1000;
        opacity:0;
        transform:translateY(100px);
        transition:all 0.3s ease-out;
      `;

      const style = document.createElement('style');
      style.textContent = `
        button.is-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        button:hover {
          background: #fb7185 !important;
          transform: translateY(-4px) !important;
        }
      `;
      document.head.appendChild(style);

      return button;
    },
  };

  const countdown = {
    init() {
      const countdownElement = document.querySelector('.c-countdown');
      if (!countdownElement) return;

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);

      this.update(targetDate);
      setInterval(() => this.update(targetDate), 1000);
    },

    update(targetDate) {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        document.querySelectorAll('.c-countdown__value').forEach((el) => el.textContent = '0');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const values = document.querySelectorAll('.c-countdown__value');
      if (values[0]) values[0].textContent = days;
      if (values[1]) values[1].textContent = hours;
      if (values[2]) values[2].textContent = minutes;
      if (values[3]) values[3].textContent = seconds;
    },
  };

  const imageHandler = {
    init() {
      document.querySelectorAll('img').forEach((img) => {
        if (!img.hasAttribute('loading')) {
          const isCritical = img.hasAttribute('data-critical') || img.classList.contains('c-logo__img');
          if (!isCritical) img.setAttribute('loading', 'lazy');
        }

        img.addEventListener('error', function() {
          const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext fill="%23999" font-size="18" x="50%25" y="50%25" text-anchor="middle"%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E';
          this.src = placeholder;
        }, { once: true });
      });
    },
  };

  function init() {
    if (app.initialized) return;

    burgerMenu.init();
    scrollEffects.init();
    microInteractions.init();
    formHandler.init();
    smoothScroll.init();
    scrollToTop.init();
    countdown.init();
    imageHandler.init();

    app.initialized = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();