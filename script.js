// ===== GLOBAL STATE =====
const state = {
  theme: localStorage.getItem('theme') || 'light',
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  products: [],
  isLoading: false,
  currentPage: 1,
  productsPerPage: 6
};

// ===== DOM ELEMENTS =====
const elements = {
  loadingScreen: document.getElementById('loading-screen'),
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
  navMenu: document.getElementById('nav-menu'),
  cartCount: document.getElementById('cart-count'),
  productsGrid: document.getElementById('products-grid'),
  loadMoreBtn: document.getElementById('load-more'),
  contactForm: document.getElementById('contact-form'),
  toastContainer: document.getElementById('toast-container')
};

// ===== UTILITY FUNCTIONS =====
const utils = {
  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Smooth scroll to element
  scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// ===== THEME MANAGEMENT =====
const themeManager = {
  init() {
    this.setTheme(state.theme);
    this.bindEvents();
  },

  setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme icon
    if (elements.themeIcon) {
      elements.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    
    // Add animation class for smooth transition
    document.body.classList.add('theme-transitioning');
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  },

  bindEvents() {
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
        this.showToast('Theme changed', 'success');
      });
    }
  },

  showToast(message, type = 'info') {
    const toast = this.createToast(message, type);
    elements.toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  },

  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-title">${this.getToastTitle(type)}</span>
        <button class="toast-close" aria-label="Close notification">&times;</button>
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    // Add close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
    
    return toast;
  },

  getToastTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };
    return titles[type] || 'Notification';
  }
};

// ===== NAVIGATION MANAGEMENT =====
const navigation = {
  init() {
    this.bindEvents();
    this.updateActiveLink();
  },

  bindEvents() {
    // Mobile menu toggle
    if (elements.mobileMenuToggle) {
      elements.mobileMenuToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          utils.scrollToElement(targetElement, 80);
          this.closeMobileMenu();
        }
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!elements.navMenu.contains(e.target) && 
          !elements.mobileMenuToggle.contains(e.target) &&
          elements.navMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });

    // Update active link on scroll
    window.addEventListener('scroll', utils.throttle(() => {
      this.updateActiveLink();
    }, 100));
  },

  toggleMobileMenu() {
    const isActive = elements.navMenu.classList.contains('active');
    
    if (isActive) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },

  openMobileMenu() {
    elements.navMenu.classList.add('active');
    elements.mobileMenuToggle.classList.add('active');
    elements.mobileMenuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  },

  closeMobileMenu() {
    elements.navMenu.classList.remove('active');
    elements.mobileMenuToggle.classList.remove('active');
    elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let currentSection = '';
    
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const sectionHeight = section.offsetHeight;
      
      if (sectionTop <= 100 && sectionTop + sectionHeight > 100) {
        currentSection = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
};

// ===== PRODUCT MANAGEMENT =====
const productManager = {
  init() {
    this.loadProducts();
    this.bindEvents();
  },

  async loadProducts() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    this.showLoadingState();
    
    try {
      // Simulate API call with mock data
      const products = await this.fetchProducts();
      state.products = [...state.products, ...products];
      this.renderProducts(products);
      this.updateLoadMoreButton();
    } catch (error) {
      console.error('Error loading products:', error);
      themeManager.showToast('Failed to load products. Please try again.', 'error');
    } finally {
      state.isLoading = false;
      this.hideLoadingState();
    }
  },

  async fetchProducts() {
    // Mock product data - in a real app, this would be an API call
    const mockProducts = [
      {
        id: utils.generateId(),
        name: 'Nox Runner Pro',
        description: 'Premium running shoes with advanced cushioning technology.',
        price: 149.99,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
        badge: 'New',
        category: 'running'
      },
      {
        id: utils.generateId(),
        name: 'Nox Urban Walker',
        description: 'Stylish casual shoes perfect for city exploration.',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop&crop=center',
        badge: 'Popular',
        category: 'casual'
      },
      {
        id: utils.generateId(),
        name: 'Nox Trail Master',
        description: 'Rugged hiking boots for outdoor adventures.',
        price: 179.99,
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop&crop=center',
        badge: 'Best Seller',
        category: 'hiking'
      },
      {
        id: utils.generateId(),
        name: 'Nox Classic Oxford',
        description: 'Elegant dress shoes for formal occasions.',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=400&h=400&fit=crop&crop=center',
        badge: 'Premium',
        category: 'dress'
      },
      {
        id: utils.generateId(),
        name: 'Nox Sport Max',
        description: 'High-performance athletic shoes for all sports.',
        price: 159.99,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center',
        badge: 'Limited',
        category: 'sports'
      },
      {
        id: utils.generateId(),
        name: 'Nox Comfort Plus',
        description: 'All-day comfort shoes with memory foam insoles.',
        price: 119.99,
        image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop&crop=center',
        badge: 'Comfort',
        category: 'casual'
      }
    ];
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockProducts;
  },

  renderProducts(products) {
    const fragment = document.createDocumentFragment();
    
    products.forEach(product => {
      const productCard = this.createProductCard(product);
      fragment.appendChild(productCard);
    });
    
    elements.productsGrid.appendChild(fragment);
    
    // Add intersection observer for animations
    this.observeProductCards();
  },

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
      </div>
      <div class="product-content">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <span class="product-price">${utils.formatCurrency(product.price)}</span>
          <div class="product-actions">
            <button class="btn btn-icon" aria-label="Add to favorites" type="button">
              ♥
            </button>
            <button class="btn btn-primary btn-icon" aria-label="Add to cart" type="button">
              +
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    const addToCartBtn = card.querySelector('.btn-primary');
    const favoriteBtn = card.querySelector('.btn-icon:first-child');
    
    addToCartBtn.addEventListener('click', () => {
      this.addToCart(product);
    });
    
    favoriteBtn.addEventListener('click', () => {
      this.toggleFavorite(product.id, favoriteBtn);
    });
    
    return card;
  },

  observeProductCards() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    const cards = elements.productsGrid.querySelectorAll('.product-card');
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  },

  addToCart(product) {
    const existingItem = state.cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      state.cart.push({
        ...product,
        quantity: 1
      });
    }
    
    this.updateCartCount();
    this.saveCart();
    themeManager.showToast(`${product.name} added to cart`, 'success');
    
    // Add visual feedback
    const addBtn = document.querySelector(`[data-product-id="${product.id}"] .btn-primary`);
    addBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      addBtn.style.transform = '';
    }, 150);
  },

  toggleFavorite(productId, button) {
    const isFavorited = button.classList.contains('favorited');
    
    if (isFavorited) {
      button.classList.remove('favorited');
      button.textContent = '♥';
      themeManager.showToast('Removed from favorites', 'info');
    } else {
      button.classList.add('favorited');
      button.textContent = '❤️';
      themeManager.showToast('Added to favorites', 'success');
    }
  },

  updateCartCount() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    
    // Add animation
    elements.cartCount.style.transform = 'scale(1.2)';
    setTimeout(() => {
      elements.cartCount.style.transform = '';
    }, 200);
  },

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
  },

  showLoadingState() {
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.disabled = true;
      elements.loadMoreBtn.textContent = 'Loading...';
    }
  },

  hideLoadingState() {
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.disabled = false;
      elements.loadMoreBtn.textContent = 'Load More Products';
    }
  },

  updateLoadMoreButton() {
    // In a real app, you'd check if there are more products to load
    // For demo purposes, we'll hide it after loading products twice
    if (state.currentPage >= 2) {
      elements.loadMoreBtn.style.display = 'none';
    }
  },

  bindEvents() {
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.addEventListener('click', () => {
        state.currentPage += 1;
        this.loadProducts();
      });
    }
  }
};

// ===== FORM MANAGEMENT =====
const formManager = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    if (elements.contactForm) {
      elements.contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
      
      // Real-time validation
      const inputs = elements.contactForm.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.validateField(input);
        });
        
        input.addEventListener('input', utils.debounce(() => {
          this.clearFieldError(input);
        }, 300));
      });
    }
  },

  handleFormSubmit() {
    const formData = new FormData(elements.contactForm);
    const data = Object.fromEntries(formData);
    
    // Validate all fields
    const isValid = this.validateForm();
    
    if (isValid) {
      this.submitForm(data);
    } else {
      themeManager.showToast('Please fix the errors and try again.', 'error');
    }
  },

  validateForm() {
    const inputs = elements.contactForm.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  },

  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = `${this.getFieldLabel(fieldName)} is required.`;
    }
    
    // Email validation
    if (fieldName === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address.';
      }
    }
    
    // Name validation
    if (fieldName === 'name' && value && value.length < 2) {
      isValid = false;
      errorMessage = 'Name must be at least 2 characters long.';
    }
    
    // Message validation
    if (fieldName === 'message' && value && value.length < 10) {
      isValid = false;
      errorMessage = 'Message must be at least 10 characters long.';
    }
    
    this.showFieldError(field, errorMessage);
    return isValid;
  },

  showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    
    if (message) {
      field.classList.add('error');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
      }
    } else {
      this.clearFieldError(field);
    }
  },

  clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
      errorElement.classList.remove('show');
    }
  },

  getFieldLabel(fieldName) {
    const labels = {
      name: 'Name',
      email: 'Email',
      message: 'Message'
    };
    return labels[fieldName] || fieldName;
  },

  async submitForm(data) {
    const submitBtn = elements.contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success
      themeManager.showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
      elements.contactForm.reset();
      
    } catch (error) {
      console.error('Form submission error:', error);
      themeManager.showToast('Failed to send message. Please try again.', 'error');
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
};

// ===== LOADING SCREEN =====
const loadingScreen = {
  init() {
    // Simulate loading time
    setTimeout(() => {
      this.hide();
    }, 2000);
  },

  hide() {
    if (elements.loadingScreen) {
      elements.loadingScreen.classList.add('hidden');
      setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
      }, 300);
    }
  }
};

// ===== ACCESSIBILITY ENHANCEMENTS =====
const accessibility = {
  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupAriaLabels();
    this.setupReducedMotion();
  },

  setupKeyboardNavigation() {
    // Escape key to close modals/menus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        navigation.closeMobileMenu();
      }
    });
    
    // Tab navigation for custom elements
    const customButtons = document.querySelectorAll('.btn, .theme-toggle, .cart-button');
    customButtons.forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  },

  setupFocusManagement() {
    // Focus management for mobile menu
    const mobileMenuLinks = document.querySelectorAll('.nav-link');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && e.shiftKey) {
          // Shift+Tab from first link closes menu
          if (link === mobileMenuLinks[0]) {
            navigation.closeMobileMenu();
            elements.mobileMenuToggle.focus();
          }
        }
      });
    });
  },

  setupAriaLabels() {
    // Add aria-labels to interactive elements
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', `Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`);
    }
  },

  setupReducedMotion() {
    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--transition-fast', '0ms');
      document.documentElement.style.setProperty('--transition-normal', '0ms');
      document.documentElement.style.setProperty('--transition-slow', '0ms');
    }
  }
};

// ===== PERFORMANCE OPTIMIZATIONS =====
const performance = {
  init() {
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.setupScrollOptimization();
  },

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  },

  setupImageOptimization() {
    // Add loading states for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      });
      
      img.addEventListener('error', () => {
        img.classList.add('error');
        img.alt = 'Image failed to load';
      });
    });
  },

  setupScrollOptimization() {
    // Optimize scroll events
    let ticking = false;
    
    const updateScrollElements = () => {
      // Update any scroll-dependent elements here
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollElements);
        ticking = true;
      }
    });
  }
};

// ===== ERROR HANDLING =====
const errorHandler = {
  init() {
    this.setupGlobalErrorHandling();
    this.setupUnhandledRejections();
  },

  setupGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      themeManager.showToast('Something went wrong. Please refresh the page.', 'error');
    });
  },

  setupUnhandledRejections() {
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      themeManager.showToast('A network error occurred. Please check your connection.', 'error');
    });
  }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  themeManager.init();
  navigation.init();
  productManager.init();
  formManager.init();
  accessibility.init();
  performance.init();
  errorHandler.init();
  loadingScreen.init();
  
  // Update cart count on load
  productManager.updateCartCount();
  
  // Add loaded class to body for CSS animations
  document.body.classList.add('loaded');
  
  console.log('Nox website initialized successfully!');
});

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
