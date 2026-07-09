try {
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('productNav')
    const placeholder = document.getElementById('productNavPlaceholder')
    const navContainer = document.getElementById('productNavContainer')
    if (!nav || !placeholder || !navContainer) return
    const navItems = Array.from(nav.querySelectorAll('.product-nav__item'))

    const targetSections = [
      'wd-product-anchor-overview',

      'wd-product-anchor-specs',

      'wd-product-anchor-compares',

      'wd-product-anchor-reviews',

      'wd-product-anchor-faqs',
    ]

    const sectionEls = targetSections.map((cls) =>
      cls ? document.querySelector('.' + cls) : null,
    )

    const state = {
      activeIndex: 0,
      isAutoScrolling: false,
      ticking: false,
    }

    function setActiveItem(index) {
      if (state.activeIndex === index) return
      navItems.forEach((item, i) => {
        item.classList.toggle('nav-item-active', i === index)
      })
      state.activeIndex = index
      scrollNavIntoView(index)
    }

    function scrollNavIntoView(index) {
      const item = navItems[index]
      if (!item) return

      const itemLeft = item.offsetLeft
      const itemRight = itemLeft + item.offsetWidth
      const containerLeft = navContainer.scrollLeft
      const containerRight = containerLeft + navContainer.clientWidth

      if (itemLeft < containerLeft) {
        navContainer.scrollTo({ left: itemLeft, behavior: 'smooth' })
      } else if (itemRight > containerRight) {
        navContainer.scrollTo({
          left: itemRight - navContainer.clientWidth,
          behavior: 'smooth',
        })
      }
    }

    navItems.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        e.preventDefault()

        const target = sectionEls[index]
        if (!target) return

        state.isAutoScrolling = true
        setActiveItem(index)

        const offset = nav.classList.contains('product-nav-fixed')
          ? nav.offsetHeight
          : 0

        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth',
        })

        setTimeout(() => (state.isAutoScrolling = false), 600)
      })
    })

    function handleFixed() {
      const rect = placeholder.getBoundingClientRect()
      const shouldFix = rect.top <= 0

      if (shouldFix) {
        nav.classList.add('product-nav-fixed')
        placeholder.style.height = nav.offsetHeight + 'px'
      } else {
        nav.classList.remove('product-nav-fixed')
        placeholder.style.height = '0px'
      }
    }

    function handleActive(scrollY) {
      if (state.isAutoScrolling) return

      const navHeight = nav.classList.contains('product-nav-fixed')
        ? nav.offsetHeight
        : 0

      const checkpoint = scrollY + navHeight + 100
      let current = 0

      for (let i = 1; i < sectionEls.length; i++) {
        const el = sectionEls[i]
        if (el && checkpoint >= el.offsetTop) {
          current = i
        } else {
          break
        }
      }

      setActiveItem(current)
    }

    function onScroll() {
      if (state.ticking) return
      state.ticking = true

      requestAnimationFrame(() => {
        handleFixed()
        handleActive(window.scrollY)
        state.ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    window.addEventListener('resize', () => {
      if (nav.classList.contains('product-nav-fixed')) {
        placeholder.style.height = nav.offsetHeight + 'px'
      }
    })

    onScroll()
  })
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 16: shopify-section-template--16398653784144__select_guide_Y6F9Db */
try {
  if (typeof window.handleSelectGuideTrackClick !== 'function') {
    window.handleSelectGuideTrackClick = function handleSelectGuideTrackClick(
      eventName,
    ) {
      if (typeof window.WDSendEvent !== 'function') return
      window.WDSendEvent(eventName)
    }
  }

  class SelectGuide extends HTMLElement {
    connectedCallback() {
      this.createObserver()
      window.addEventListener('resize', this.handleResize)
    }

    disconnectedCallback() {
      this.observer?.disconnect()
      window.removeEventListener('resize', this.handleResize)
    }

    handleResize = () => {
      const isMobileNow = window.innerWidth < 768
      if (isMobileNow !== this.isMobile) {
        this.createObserver()
      }
    }

    createObserver() {
      this.observer?.disconnect()

      this.isMobile = window.innerWidth < 768
      const offset = this.isMobile ? 200 : 400

      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.classList.toggle('select-guide-active', entry.isIntersecting)
        },
        {
          root: null,
          rootMargin: `0px 0px -${offset}px 0px`,
          threshold: 0,
        },
      )

      this.observer.observe(this)
    }
  }

  if (!customElements.get('select-guide')) {
    customElements.define('select-guide', SelectGuide)
  }
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 5: shopify-section-template--16398653784144__product_waterdrop_animation_gYFahm */
try {
  ;(() => {
    'use strict'

    if (window.innerWidth <= 1024) {
      return
    }

    const container = document.querySelector(
      '#template--16398653784144__product_waterdrop_animation_gYFahm .product-waterdrop-animation__container',
    )
    if (!container) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target)
            initWaterDropSection()
          }
        })
      },
      {
        root: null,
        rootMargin: '1000px',
        threshold: 0,
      },
    )

    observer.observe(container)

    function initWaterDropSection() {
      const loadGsapScript = (src, id) => {
        return new Promise((resolve, reject) => {
          if (document.getElementById(id)) {
            resolve()
            return
          }
          const script = document.createElement('script')
          script.id = id
          script.src = src
          script.onload = resolve
          script.onerror = () => reject(new Error(`Failed to load: ${src}`))
          document.body.appendChild(script)
        })
      }

      const initAnimation = () => {
        try {
          if (
            typeof gsap === 'undefined' ||
            typeof ScrollTrigger === 'undefined'
          ) {
            console.warn('GSAP libraries not loaded')
            return
          }

          gsap.registerPlugin(ScrollTrigger)
          ScrollTrigger.config({ ignoreMobileResize: true })

          const productNav = document.querySelector('.product-nav')
          if (productNav) {
            container.style.top = productNav.offsetHeight + 'px'
          }

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger:
                '#template--16398653784144__product_waterdrop_animation_gYFahm',
              start: 'top top',
              end: 'bottom bottom',
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })

          const waterdropImg = container.querySelector(
            '#template--16398653784144__product_waterdrop_animation_gYFahm .product-waterdrop-animation__wd-image',
          )
          const width = window.innerWidth * 1.4
          if (waterdropImg) {
            timeline.to(waterdropImg, {
              width: `${width}px`,
              opacity: 1,
              duration: 3,
              ease: 'power2.inOut',
            })
          }

          const content = container.querySelector(
            '#template--16398653784144__product_waterdrop_animation_gYFahm .product-waterdrop-animation__content',
          )
          if (content) {
            timeline.to(
              content,
              {
                height: 'auto',
                opacity: 1,
                duration: 1,
                ease: 'power2.inOut',
              },
              '<0.3',
            )
          }
        } catch (error) {
          console.error('Animation initialization failed:', error)
        }
      }

      Promise.all([
        loadGsapScript(
          'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
          'gsap-lib',
        ),
        loadGsapScript(
          'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
          'gsap-scrolltrigger',
        ),
      ])
        .then(initAnimation)
        .catch((error) =>
          console.error('Failed to load GSAP libraries:', error),
        )
    }
  })()
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 7: shopify-section-template--16398653784144__product_waterdrop_animation_VCpKMm */
try {
  ;(() => {
    'use strict'

    if (window.innerWidth <= 1024) {
      return
    }

    const container = document.querySelector(
      '#template--16398653784144__product_waterdrop_animation_VCpKMm .product-waterdrop-animation__container',
    )
    if (!container) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target)
            initWaterDropSection()
          }
        })
      },
      {
        root: null,
        rootMargin: '1000px',
        threshold: 0,
      },
    )

    observer.observe(container)

    function initWaterDropSection() {
      const loadGsapScript = (src, id) => {
        return new Promise((resolve, reject) => {
          if (document.getElementById(id)) {
            resolve()
            return
          }
          const script = document.createElement('script')
          script.id = id
          script.src = src
          script.onload = resolve
          script.onerror = () => reject(new Error(`Failed to load: ${src}`))
          document.body.appendChild(script)
        })
      }

      const initAnimation = () => {
        try {
          if (
            typeof gsap === 'undefined' ||
            typeof ScrollTrigger === 'undefined'
          ) {
            console.warn('GSAP libraries not loaded')
            return
          }

          gsap.registerPlugin(ScrollTrigger)
          ScrollTrigger.config({ ignoreMobileResize: true })

          const productNav = document.querySelector('.product-nav')
          if (productNav) {
            container.style.top = productNav.offsetHeight + 'px'
          }

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger:
                '#template--16398653784144__product_waterdrop_animation_VCpKMm',
              start: 'top top',
              end: 'bottom bottom',
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })

          const waterdropImg = container.querySelector(
            '#template--16398653784144__product_waterdrop_animation_VCpKMm .product-waterdrop-animation__wd-image',
          )
          const width = window.innerWidth * 1.4
          if (waterdropImg) {
            timeline.to(waterdropImg, {
              width: `${width}px`,
              opacity: 1,
              duration: 3,
              ease: 'power2.inOut',
            })
          }

          const content = container.querySelector(
            '#template--16398653784144__product_waterdrop_animation_VCpKMm .product-waterdrop-animation__content',
          )
          if (content) {
            timeline.to(
              content,
              {
                height: 'auto',
                opacity: 1,
                duration: 1,
                ease: 'power2.inOut',
              },
              '<0.3',
            )
          }
        } catch (error) {
          console.error('Animation initialization failed:', error)
        }
      }

      Promise.all([
        loadGsapScript(
          'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
          'gsap-lib',
        ),
        loadGsapScript(
          'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
          'gsap-scrolltrigger',
        ),
      ])
        .then(initAnimation)
        .catch((error) =>
          console.error('Failed to load GSAP libraries:', error),
        )
    }
  })()
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 11: shopify-section-template--16398653784144__product_overview_gallery_GgTagt */
try {
  ;(function () {
    let roots = document.querySelectorAll('.wd-product-splide')
    if (!roots.length) return

    roots.forEach(function (root) {
      let sliderEl = root.querySelector('splide-slider')
      if (!sliderEl) return

      sliderEl.addEventListener('splide:loaded', function (event) {
        let slider = event.detail && event.detail.slider
        if (!slider) return

        let splideRoot = slider.root || sliderEl

        //  （with_text_swiper）run
        let paginationBox = root.querySelector('.wd-with-text-pagination-box')
        if (!paginationBox) return

        let imgs = splideRoot.querySelectorAll('.splide__slide img')
        let buttons = splideRoot.querySelectorAll('.splide__pagination__page')

        if (imgs.length && buttons.length) {
          buttons.forEach(function (button, index) {
            let img = imgs[index]
            if (!img) return

            let alt = img.getAttribute('alt') || ''

            if (alt) {
              button.textContent = alt
              button.setAttribute('aria-label', alt)
            } else {
              let pageNum = index + 1
              button.textContent = String(pageNum)
              button.setAttribute('aria-label', 'Go to slide ' + pageNum)
            }
          })
        }

        function scrollActiveIntoView() {
          let activeBtn = paginationBox.querySelector(
            '.splide__pagination__page.is-active',
          )
          if (!activeBtn) return

          let boxRect = paginationBox.getBoundingClientRect()
          let btnRect = activeBtn.getBoundingClientRect()

          if (btnRect.left >= boxRect.left && btnRect.right <= boxRect.right) {
            return
          }

          let paddingLeft = 8
          let targetLeft = activeBtn.offsetLeft - paddingLeft

          paginationBox.scrollTo({
            left: targetLeft,
            behavior: 'smooth',
          })
        }

        scrollActiveIntoView()

        if (typeof slider.on === 'function') {
          slider.on('moved', function () {
            scrollActiveIntoView()
          })
          slider.on('updated', function () {
            scrollActiveIntoView()
          })
        }
      })
    })
  })()
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 12: shopify-section-template--16398653784144__product_influencer_video_iFjKDw */
try {
  class ProductInfluencerVideoSlider extends HTMLElement {
    constructor() {
      super()
      this.slider = null
      this.videos = []
      this.resizeFrame = 0
      this.layoutRefreshFrame = 0
      this.videoReadyCleanups = []
      this.handleResize = this.handleResize.bind(this)
      this.handleDomReady = this.handleDomReady.bind(this)
      this.handleWindowLoad = this.handleWindowLoad.bind(this)
      this.requestLayoutRefresh = this.requestLayoutRefresh.bind(this)
    }

    connectedCallback() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this.handleDomReady, {
          once: true,
        })
      } else {
        this.initSlider()
      }

      window.addEventListener('resize', this.handleResize, { passive: true })
    }

    disconnectedCallback() {
      document.removeEventListener('DOMContentLoaded', this.handleDomReady)
      window.removeEventListener('resize', this.handleResize)

      if (this.resizeFrame) {
        cancelAnimationFrame(this.resizeFrame)
        this.resizeFrame = 0
      }

      if (this.layoutRefreshFrame) {
        cancelAnimationFrame(this.layoutRefreshFrame)
        this.layoutRefreshFrame = 0
      }

      this.videoReadyCleanups.forEach((cleanup) => cleanup())
      this.videoReadyCleanups = []
      window.removeEventListener('load', this.handleWindowLoad)
    }

    handleDomReady() {
      this.initSlider()
    }

    async initSlider() {
      const sliderEl = this.querySelector(
        'splide-slider.product-influencer-video-splide',
      )
      if (!sliderEl) return

      if (sliderEl.slider) {
        this.slider = sliderEl.slider
        this.onSliderLoaded()
      } else {
        sliderEl.addEventListener('splide:loaded', (e) => {
          this.slider = e.detail.slider
          this.onSliderLoaded()
        })
      }
    }

    onSliderLoaded() {
      if (!this.slider) return

      this.videos = Array.from(this.querySelectorAll('component-video'))
      this.bindVideoReadyEvents()
      this.syncSliderLayout()
      this.requestLayoutRefresh()
      window.addEventListener('load', this.handleWindowLoad, { once: true })

      this.slider.on('move', () => {
        this.pauseAllVideos()
      })

      this.slider.on('updated', () => {
        this.syncSliderLayout()
      })

      this.slider.on('resized', () => {
        this.syncSliderLayout()
      })
    }

    handleWindowLoad() {
      this.requestLayoutRefresh()
    }

    handleResize() {
      if (!this.slider) return

      if (this.resizeFrame) {
        cancelAnimationFrame(this.resizeFrame)
      }

      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = 0
        this.syncSliderLayout(true)
      })
    }

    bindVideoReadyEvents() {
      this.videoReadyCleanups.forEach((cleanup) => cleanup())
      this.videoReadyCleanups = []

      this.videos.forEach((videoComponent) => {
        const video = videoComponent.querySelector('video')
        if (!video) return

        const handleReady = () => {
          this.requestLayoutRefresh()
        }

        video.addEventListener('loadedmetadata', handleReady)
        video.addEventListener('loadeddata', handleReady)
        video.addEventListener('canplay', handleReady)

        this.videoReadyCleanups.push(() => {
          video.removeEventListener('loadedmetadata', handleReady)
          video.removeEventListener('loadeddata', handleReady)
          video.removeEventListener('canplay', handleReady)
        })

        if (video.readyState >= 1) {
          this.requestLayoutRefresh()
        }
      })
    }

    requestLayoutRefresh() {
      if (!this.slider) return

      if (this.layoutRefreshFrame) {
        cancelAnimationFrame(this.layoutRefreshFrame)
      }

      this.layoutRefreshFrame = requestAnimationFrame(() => {
        this.layoutRefreshFrame = 0
        this.syncSliderLayout(true)
      })
    }

    syncSliderLayout(shouldRefresh = false) {
      const sliderEl = this.querySelector(
        'splide-slider.product-influencer-video-splide',
      )
      const track = sliderEl?.querySelector('.splide__track')
      const list = sliderEl?.querySelector('.splide__list')
      const slides = sliderEl?.querySelectorAll('.splide__slide') || []
      if (!sliderEl || !track || !list || !slides.length) return

      sliderEl.style.width = '100%'
      sliderEl.style.maxWidth = '100%'
      track.style.removeProperty('width')
      list.style.removeProperty('width')
      list.style.removeProperty('max-width')

      slides.forEach((slide) => {
        slide.style.removeProperty('max-width')
      })

      if (shouldRefresh && typeof this.slider.refresh === 'function') {
        const activeIndex =
          typeof this.slider.index === 'number' ? this.slider.index : 0
        this.slider.refresh()
        this.slider.go(activeIndex)
      }
    }

    pauseAllVideos() {
      this.videos.forEach((videoComponent) => {
        const iframe = videoComponent.querySelector('iframe.js-youtube')
        const video = videoComponent.querySelector('video')

        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'pauseVideo',
                args: '',
              }),
              '*',
            )
          } catch (e) {
            console.error('Failed to pause YouTube video:', e)
          }
        } else if (video) {
          video.pause()
        } else if (videoComponent.playing) {
          videoComponent.pause()
        }
      })
    }
  }

  if (!customElements.get('product-influencer-video-slider')) {
    customElements.define(
      'product-influencer-video-slider',
      ProductInfluencerVideoSlider,
    )
  }
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 15: shopify-section-template--16398653784144__product_compare_4QRyy3 */
try {
  ;(() => {
    const section = document.querySelector(
      '#shopify-section-template--16398653784144__product_compare_4QRyy3',
    )
    if (!section) return

    const content = section.querySelector('[data-compare-content]')
    const stickyBar = section.querySelector('[data-compare-sticky-bar]')
    const stickyScroller = section.querySelector(
      '[data-compare-sticky-scroller]',
    )
    const productName = section.querySelector(
      '.wd-product-compare__product-name',
    )
    if (!content || !stickyBar || !stickyScroller || !productName) return

    let stickyActive = false
    let isScrollSyncing = false
    let scrollTicking = false
    const mobileMq = window.matchMedia('(max-width: 767px)')

    const getNavOffset = () => {
      const productNav = document.getElementById('productNav')
      if (!productNav || !productNav.classList.contains('product-nav-fixed'))
        return 0
      return productNav.offsetHeight
    }

    const syncScrollFromContent = () => {
      if (!mobileMq.matches || isScrollSyncing) return
      isScrollSyncing = true
      stickyScroller.scrollLeft = content.scrollLeft
      isScrollSyncing = false
    }

    const syncScrollFromSticky = () => {
      if (!mobileMq.matches || isScrollSyncing) return
      isScrollSyncing = true
      content.scrollLeft = stickyScroller.scrollLeft
      isScrollSyncing = false
    }

    const setStickyActive = (show) => {
      stickyBar.classList.toggle('is-visible', show)
      stickyBar.setAttribute('aria-hidden', show ? 'false' : 'true')
      document.body.classList.toggle('wd-compare-sticky-active', show)
      stickyActive = show
    }

    const updateStickyBar = () => {
      if (!mobileMq.matches) {
        if (stickyActive) setStickyActive(false)
        return
      }

      const contentRect = content.getBoundingClientRect()
      const nameRect = productName.getBoundingClientRect()
      const navOffset = getNavOffset()
      const sectionVisible =
        contentRect.bottom > 0 && contentRect.top < window.innerHeight

      let show = stickyActive
      if (!sectionVisible) {
        show = false
      } else if (stickyActive) {
        show = nameRect.top < navOffset
      } else {
        show = nameRect.bottom <= navOffset
      }

      if (stickyActive !== show) {
        setStickyActive(show)
      }
    }

    const onScroll = () => {
      if (scrollTicking) return
      scrollTicking = true
      requestAnimationFrame(() => {
        requestAnimationFrame(updateStickyBar)
        scrollTicking = false
      })
    }

    content.addEventListener('scroll', syncScrollFromContent, { passive: true })
    stickyScroller.addEventListener('scroll', syncScrollFromSticky, {
      passive: true,
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    mobileMq.addEventListener('change', () => {
      syncScrollFromContent()
      updateStickyBar()
    })
    window.addEventListener('resize', () => {
      syncScrollFromContent()
      updateStickyBar()
    })

    syncScrollFromContent()
    updateStickyBar()
  })()
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 17: shopify-section-template--16398653784144__product_reviews_detailed_fi9wWH */
try {
  document.addEventListener('DOMContentLoaded', function () {
    let container = document.getElementById('review-content')
    if (!container) return

    let tabs = container.querySelectorAll('.wd-reviews-tab')
    let panes = container.querySelectorAll('.wd-reviews-pane')

    if (tabs.length <= 1 || panes.length <= 1) return

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        if (tab.classList.contains('wd-reviews-tab-active')) return

        tabs.forEach(function (t) {
          t.classList.remove('wd-reviews-tab-active')
        })
        panes.forEach(function (p) {
          p.classList.remove('wd-reviews-pane-active')
        })

        tab.classList.add('wd-reviews-tab-active')
        if (panes[index]) {
          panes[index].classList.add('wd-reviews-pane-active')
        }
      })
    })
  })
} catch (error) {
  console.warn('Original section script skipped:', error)
}

/* ORIGINAL UI SCRIPT FROM SECTION 18: shopify-section-template--16398653784144__product_faq_Dqgdny */
try {
  document.addEventListener('DOMContentLoaded', function () {
    const root = document.querySelector('.wd-faq-inner')
    if (!root) return
    if (root.matches('[data-faq-managed="template"]')) return

    const items = Array.from(root.querySelectorAll('details.wd-faq-item'))
    if (!items.length) return

    const DURATION = 300

    function getParts(item) {
      const body = item.querySelector('.wd-faq-item-body')
      const inner = item.querySelector('.wd-faq-item-body-inner')
      return { body, inner }
    }

    function openItem(item) {
      const { body, inner } = getParts(item)
      if (!body || !inner) return

      item.setAttribute('open', '')
      item.classList.add('wd-faq-item-active')

      body.style.maxHeight = '0px'
      requestAnimationFrame(() => {
        body.style.maxHeight = inner.scrollHeight + 'px'
      })
    }

    function closeItem(item) {
      const { body, inner } = getParts(item)
      if (!body || !inner) return

      const current = inner.scrollHeight
      body.style.maxHeight = current + 'px'

      requestAnimationFrame(() => {
        body.style.maxHeight = '0px'
      })

      item.classList.remove('wd-faq-item-active')

      window.setTimeout(() => {
        item.removeAttribute('open')
      }, DURATION)
    }

    function closeAll(except) {
      items.forEach((it) => {
        if (except && it === except) return
        if (
          it.classList.contains('wd-faq-item-active') ||
          it.hasAttribute('open')
        ) {
          closeItem(it)
        }
      })
    }

    items.forEach((item) => {
      const { body, inner } = getParts(item)
      if (!body || !inner) return

      const isOpen =
        item.hasAttribute('open') ||
        item.classList.contains('wd-faq-item-active')
      if (isOpen) {
        item.classList.add('wd-faq-item-active')
        body.style.maxHeight = inner.scrollHeight + 'px'
      } else {
        item.classList.remove('wd-faq-item-active')
        body.style.maxHeight = '0px'
      }
    })

    items.forEach((item) => {
      const summary = item.querySelector('summary.wd-faq-item-header')
      if (!summary) return

      summary.addEventListener('click', (e) => {
        e.preventDefault()

        const isOpen = item.classList.contains('wd-faq-item-active')

        closeAll(item)

        if (isOpen) {
          closeItem(item)
        } else {
          openItem(item)
        }
      })
    })

    // OPEN/CLOSE more
    const faqList = root.querySelector('.wd-faq-list')
    const toggleMoreBtn = root.querySelector('.wd-faq-toggle-more')

    function closeExtraOpenedItems() {
      if (!faqList) return
      const extraItems = Array.from(
        faqList.querySelectorAll('details.wd-faq-item.wd-faq-item--extra'),
      )
      extraItems.forEach((it) => {
        if (
          it.classList.contains('wd-faq-item-active') ||
          it.hasAttribute('open')
        ) {
          closeItem(it)
        }
      })
    }

    if (faqList && toggleMoreBtn) {
      toggleMoreBtn.addEventListener('click', function () {
        const expanded = faqList.classList.toggle('wd-faq-list--expanded')
        toggleMoreBtn.classList.toggle('wd-faq-toggle-more--expanded', expanded)

        const labelEl = toggleMoreBtn.querySelector('.wd-faq-toggle-more-label')
        if (labelEl) labelEl.textContent = expanded ? 'Less' : 'More'

        if (!expanded) {
          closeExtraOpenedItems()
        }
      })
    }

    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (!item.classList.contains('wd-faq-item-active')) return
        const { body, inner } = getParts(item)
        if (!body || !inner) return
        body.style.maxHeight = inner.scrollHeight + 'px'
      })
    })
  })
} catch (error) {
  console.warn('Original section script skipped:', error)
}
