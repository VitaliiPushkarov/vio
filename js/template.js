/* Clean template UI logic. No analytics, no Shopify checkout, no tracking. */
;(function () {
  'use strict'

  const $ = (selector, root = document) => root.querySelector(selector)
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector))

  function onReady(fn) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn)
    else fn()
  }

  function initSplideSliders() {
    if (customElements.get('splide-slider')) return

    class SplideSlider extends HTMLElement {
      constructor() {
        super()
        this.slider = null
        this.observer = null
        this.initialized = false
        this.idleId = null
      }

      connectedCallback() {
        try {
          this.options = JSON.parse(this.dataset.splideOptions || '{}')
        } catch (error) {
          console.warn('Failed to parse Splide options:', error)
          this.options = {}
        }

        const { lazyLoad } = this.dataset
        if (lazyLoad === 'true' || lazyLoad === undefined) {
          this.initObserver()
          this.initOnIdle()
        } else {
          this.init()
        }
      }

      disconnectedCallback() {
        if (this.slider) this.slider.destroy()
        if (this.observer) this.observer.disconnect()
        if (this.idleId && 'cancelIdleCallback' in window)
          cancelIdleCallback(this.idleId)
      }

      initObserver() {
        if (!('IntersectionObserver' in window)) {
          this.init()
          return
        }

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) this.init()
            })
          },
          { rootMargin: '200px' },
        )

        this.observer.observe(this)
      }

      initOnIdle() {
        if ('requestIdleCallback' in window) {
          this.idleId = requestIdleCallback(() => {
            this.init()
          })
        }
      }

      loadViaScript(moduleUrl) {
        return new Promise((resolve, reject) => {
          const fallbackUrl = moduleUrl.replace('.esm', '')
          const existingScript = document.querySelector(
            `script[src="${fallbackUrl}"]`,
          )

          if (existingScript) {
            existingScript.addEventListener('load', resolve, { once: true })
            existingScript.addEventListener('error', reject, { once: true })
            return
          }

          const script = document.createElement('script')
          script.src = fallbackUrl
          script.defer = true
          script.crossOrigin = 'anonymous'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      async init() {
        if (this.initialized) return
        this.initialized = true

        if (this.observer) {
          this.observer.disconnect()
          this.observer = null
        }

        if (this.idleId && 'cancelIdleCallback' in window) {
          cancelIdleCallback(this.idleId)
          this.idleId = null
        }

        try {
          const { splideUrl, splideGridUrl } = this.dataset
          if (!splideUrl) {
            console.error('Splide URL not provided to splide-slider component')
            return
          }

          let Splide = null
          let Grid = null

          try {
            const splideModule = await import(splideUrl)
            Splide = splideModule.default || splideModule.Splide

            if (
              splideGridUrl &&
              window.matchMedia('(max-width: 767px)').matches
            ) {
              try {
                const gridModule = await import(splideGridUrl)
                Grid = (gridModule.default || gridModule).Grid
              } catch (error) {
                console.warn(
                  'Failed to load Splide Grid extension via import():',
                  error,
                )
              }
            }
          } catch (importError) {
            console.warn(
              'Splide import() failed, falling back to script tag:',
              importError,
            )

            if (!window.Splide) await this.loadViaScript(splideUrl)
            Splide = window.Splide || window.splide?.default

            if (
              splideGridUrl &&
              window.matchMedia('(max-width: 767px)').matches
            ) {
              try {
                await this.loadViaScript(splideGridUrl)
                Grid = window.splide?.Extensions?.Grid || {}
              } catch (error) {
                console.warn(
                  'Failed to load Splide Grid extension via script:',
                  error,
                )
              }
            }
          }

          if (!Splide) throw new Error('Unable to load Splide library')

          this.slider = new Splide(this, this.options)
          if (Grid) {
            this.slider.mount({ Grid })
          } else {
            this.slider.mount()
          }

          this.classList.add('is-initialized')
          this.dispatchEvent(
            new CustomEvent('splide:loaded', {
              detail: { slider: this.slider },
            }),
          )
        } catch (error) {
          console.error('Error initializing Splide:', error)
        }
      }
    }

    customElements.define('splide-slider', SplideSlider)
  }

  function componentWantsAutoplay(component, video = null) {
    if (component.hasAttribute('autoplay')) return true
    if (video?.hasAttribute('autoplay')) return true

    const template = $('template', component)
    const templateVideo = template?.content?.querySelector('video')
    return !!templateVideo?.hasAttribute('autoplay')
  }

  function hydrateComponentVideo(component) {
    const existingVideo = $('video', component)
    if (component.dataset.videoHydrated === 'true' && existingVideo) {
      return existingVideo
    }

    let video = existingVideo

    if (!video) {
      const template = $('template', component)
      if (!template) return null

      const fragment = template.content.cloneNode(true)
      video = $('video', fragment)
      if (!video) return null

      component.insertBefore(fragment, template)
      template.remove()
    }

    const wantsAutoplay = componentWantsAutoplay(component, video)

    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.playsInline = true

    if (wantsAutoplay) {
      video.autoplay = true
      video.defaultMuted = true
      video.muted = true
      video.setAttribute('autoplay', 'autoplay')
      video.setAttribute('muted', 'muted')
      video.dataset.autoplayManaged = 'true'
    }

    if (component.querySelector(':scope > img')) {
      component.classList.add('has-preview')
    }

    component.dataset.videoHydrated = 'true'

    return video
  }

  function isComponentVideoRenderable(component) {
    if (!(component instanceof HTMLElement)) return false

    const styles = window.getComputedStyle(component)
    if (styles.display === 'none' || styles.visibility === 'hidden') {
      return false
    }

    return component.getClientRects().length > 0
  }

  function initHeroGallery() {
    $$('.template-hero__gallery[data-template-gallery]').forEach((gallery) => {
      if (gallery.dataset.galleryReady === 'true') return

      const tabs = $$('[data-media-tab]', gallery)
      const panes = $$('[data-media-pane]', gallery)
      const main = $('[data-gallery-main]', gallery)
      const thumbs = $$('.template-hero__thumb', gallery)
      const counter = $('[data-gallery-counter]', gallery)
      const prevImage = $('[data-gallery-prev]', gallery)
      const nextImage = $('[data-gallery-next]', gallery)
      const zoomTrigger = $('[data-gallery-zoom]', gallery)
      const videoFrame = $('.template-hero__main-video', gallery)
      const lightbox = $('[data-gallery-lightbox]', gallery)
      const lightboxDialog = $('.template-hero__lightbox-dialog', gallery)
      const lightboxImage = $('[data-lightbox-image]', gallery)
      const lightboxPrev = $('[data-lightbox-prev]', gallery)
      const lightboxNext = $('[data-lightbox-next]', gallery)
      const lightboxCloseControls = $$('[data-lightbox-close]', gallery)
      const video = $('[data-gallery-video]', gallery)
      const videoSource = $('[data-gallery-video-source]', gallery)
      const videoItems = $$('.template-hero__video-item', gallery)
      const prevVideo = $('[data-video-prev]', gallery)
      const nextVideo = $('[data-video-next]', gallery)

      if (!main || !thumbs.length) return

      if (lightbox && lightbox.parentElement !== document.body) {
        document.body.appendChild(lightbox)
      }

      gallery.dataset.galleryReady = 'true'

      let currentImageIndex = Math.max(
        thumbs.findIndex((thumb) => thumb.classList.contains('is-active')),
        0,
      )
      let currentVideoIndex = Math.max(
        videoItems.findIndex((item) => item.classList.contains('is-active')),
        0,
      )
      let isLightboxOpen = false
      let lastFocusedElement = null
      let suppressZoomClick = false
      const imagePreloadTasks = new Map()
      let mainImageRequestId = 0
      let lightboxImageRequestId = 0

      const normalizeIndex = (index, length) => {
        if (!length) return 0
        return (index + length) % length
      }

      const isMobileViewport = () =>
        window.matchMedia('(max-width: 767px)').matches

      const syncCounter = () => {
        if (!counter) return
        counter.textContent = `${currentImageIndex + 1}/${thumbs.length}`
      }

      const getThumbSources = (thumb) => ({
        displaySrc: thumb?.dataset.gallerySrc || '',
        fullSrc: thumb?.dataset.galleryFullSrc || thumb?.dataset.gallerySrc || '',
      })

      const preloadImage = (src) => {
        if (!src) return Promise.resolve()
        if (imagePreloadTasks.has(src)) return imagePreloadTasks.get(src)

        const task = new Promise((resolve) => {
          const probe = new Image()
          let settled = false
          const done = () => {
            if (settled) return
            settled = true
            resolve()
          }

          probe.decoding = 'async'
          probe.onload = done
          probe.onerror = done
          probe.src = src

          if (probe.complete) done()
        })

        imagePreloadTasks.set(src, task)
        return task
      }

      const queueImageUpdate = (imageEl, src, alt, target = 'main') => {
        if (!imageEl || !src) return

        if (imageEl.getAttribute('src') === src) {
          if (alt) imageEl.alt = alt
          return
        }

        const requestId =
          target === 'lightbox'
            ? ++lightboxImageRequestId
            : ++mainImageRequestId

        preloadImage(src).finally(() => {
          const currentRequestId =
            target === 'lightbox' ? lightboxImageRequestId : mainImageRequestId
          if (requestId !== currentRequestId) return

          imageEl.src = src
          if (alt) imageEl.alt = alt
        })
      }

      const scheduleIdleWork = (callback) => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(callback, { timeout: 900 })
        } else {
          window.setTimeout(callback, 180)
        }
      }

      const warmAdjacentImages = () => {
        if (thumbs.length < 2) return

        const nextThumb = thumbs[normalizeIndex(currentImageIndex + 1, thumbs.length)]
        const prevThumb = thumbs[normalizeIndex(currentImageIndex - 1, thumbs.length)]

        ;[nextThumb, prevThumb].forEach((thumb) => {
          const src = getThumbSources(thumb).displaySrc
          if (!src) return

          scheduleIdleWork(() => {
            preloadImage(src)
          })
        })
      }

      const warmCurrentLightboxImage = () => {
        const activeThumb = thumbs[currentImageIndex]
        if (!activeThumb) return

        preloadImage(getThumbSources(activeThumb).fullSrc)
      }

      const markSwipeHandled = () => {
        suppressZoomClick = true
        window.setTimeout(() => {
          suppressZoomClick = false
        }, 280)
      }

      const bindSwipe = (element, onPrev, onNext, onSwipe) => {
        if (!element) return

        let touchActive = false
        let horizontalSwipe = false
        let startX = 0
        let startY = 0
        let deltaX = 0
        let deltaY = 0

        const resetTouch = () => {
          touchActive = false
          horizontalSwipe = false
          startX = 0
          startY = 0
          deltaX = 0
          deltaY = 0
        }

        element.addEventListener(
          'touchstart',
          (event) => {
            if (!isMobileViewport() || event.touches.length !== 1) return

            const touch = event.touches[0]
            touchActive = true
            horizontalSwipe = false
            startX = touch.clientX
            startY = touch.clientY
            deltaX = 0
            deltaY = 0
          },
          { passive: true },
        )

        element.addEventListener(
          'touchmove',
          (event) => {
            if (
              !touchActive ||
              !isMobileViewport() ||
              event.touches.length !== 1
            )
              return

            const touch = event.touches[0]
            deltaX = touch.clientX - startX
            deltaY = touch.clientY - startY

            if (
              Math.abs(deltaX) > 12 &&
              Math.abs(deltaX) > Math.abs(deltaY) + 6
            ) {
              horizontalSwipe = true
              event.preventDefault()
            }
          },
          { passive: false },
        )

        element.addEventListener(
          'touchend',
          () => {
            if (!touchActive || !isMobileViewport()) {
              resetTouch()
              return
            }

            const passedThreshold =
              horizontalSwipe && Math.abs(deltaX) >= 48 && Math.abs(deltaY) < 72

            if (passedThreshold) {
              if (deltaX > 0) onPrev()
              else onNext()
              if (typeof onSwipe === 'function') onSwipe()
            }

            resetTouch()
          },
          { passive: true },
        )

        element.addEventListener('touchcancel', resetTouch, { passive: true })
      }

      const syncTabs = (key) => {
        tabs.forEach((tab) => {
          const active = tab.dataset.mediaTab === key
          tab.classList.toggle('is-active', active)
          tab.setAttribute('aria-selected', active ? 'true' : 'false')
          tab.setAttribute('tabindex', active ? '0' : '-1')
        })

        panes.forEach((pane) => {
          const active = pane.dataset.mediaPane === key
          pane.classList.toggle('is-active', active)
          pane.hidden = !active
          pane.setAttribute('aria-hidden', active ? 'false' : 'true')
        })
      }

      const setActiveImage = (index) => {
        currentImageIndex = normalizeIndex(index, thumbs.length)

        thumbs.forEach((thumb, thumbIndex) => {
          const active = thumbIndex === currentImageIndex
          thumb.classList.toggle('is-active', active)
          thumb.setAttribute('aria-current', active ? 'true' : 'false')
        })

        const activeThumb = thumbs[currentImageIndex]
        const thumbImage = $('img', activeThumb)
        const { displaySrc, fullSrc } = getThumbSources(activeThumb)
        const alt = thumbImage?.alt || main.alt || ''

        queueImageUpdate(main, displaySrc, alt)
        if (isLightboxOpen) {
          queueImageUpdate(lightboxImage, fullSrc, alt, 'lightbox')
        }

        syncCounter()
        warmAdjacentImages()
      }

      const setActiveVideo = (index, options = {}) => {
        if (!video || !videoSource || !videoItems.length) return

        const { autoplay = false, load = true } = options
        currentVideoIndex = normalizeIndex(index, videoItems.length)

        videoItems.forEach((item, itemIndex) => {
          const active = itemIndex === currentVideoIndex
          item.classList.toggle('is-active', active)
          item.setAttribute('aria-current', active ? 'true' : 'false')
        })

        const activeVideo = videoItems[currentVideoIndex]
        const src = activeVideo?.dataset.videoSrc
        const poster = activeVideo?.dataset.videoPoster
        const label =
          activeVideo?.dataset.videoLabel || `Video ${currentVideoIndex + 1}`

        if (!src) return

        if (poster) video.poster = poster
        video.setAttribute('aria-label', label)

        if (!load) return

        const sourceChanged = videoSource.getAttribute('src') !== src
        if (sourceChanged && videoFrame) {
          videoFrame.classList.remove('is-playing')
        }
        video.pause()

        if (sourceChanged) {
          videoSource.setAttribute('src', src)
          video.load()
        }

        if (autoplay) {
          const playVideo = () => {
            video.play().catch(() => {})
          }

          if (sourceChanged) {
            video.addEventListener('loadeddata', playVideo, { once: true })
          } else {
            playVideo()
          }
        }
      }

      const syncHeroVideoState = () => {
        if (!videoFrame || !video) return

        if (!video.paused && !video.ended && video.readyState > 2) {
          videoFrame.classList.add('is-playing')
        }
      }

      const setActivePane = (key) => {
        syncTabs(key)
        if (key === 'video') {
          setActiveVideo(currentVideoIndex)
          return
        }

        if (video) video.pause()
      }

      const openLightbox = () => {
        if (!lightbox || !lightboxImage || !lightboxDialog) return

        setActiveImage(currentImageIndex)
        const activeThumb = thumbs[currentImageIndex]
        const thumbImage = $('img', activeThumb)
        const { fullSrc } = getThumbSources(activeThumb)

        isLightboxOpen = true
        lastFocusedElement = document.activeElement
        lightbox.classList.add('is-open')
        lightbox.setAttribute('aria-hidden', 'false')
        document.body.classList.add('template-hero-lightbox-open')
        queueImageUpdate(
          lightboxImage,
          fullSrc,
          thumbImage?.alt || main.alt || '',
          'lightbox',
        )

        lightboxDialog.focus({ preventScroll: true })
      }

      const closeLightbox = () => {
        if (!lightbox) return

        isLightboxOpen = false
        lightbox.classList.remove('is-open')
        lightbox.setAttribute('aria-hidden', 'true')
        document.body.classList.remove('template-hero-lightbox-open')

        if (
          lastFocusedElement &&
          typeof lastFocusedElement.focus === 'function'
        ) {
          lastFocusedElement.focus()
        }
      }

      thumbs.forEach((btn) => {
        btn.addEventListener('click', () => {
          setActiveImage(thumbs.indexOf(btn))
        })
      })

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          setActivePane(tab.dataset.mediaTab || 'image')
        })
      })

      if (prevImage) {
        prevImage.addEventListener('click', () => {
          setActiveImage(currentImageIndex - 1)
        })
      }

      if (nextImage) {
        nextImage.addEventListener('click', () => {
          setActiveImage(currentImageIndex + 1)
        })
      }

      if (zoomTrigger) {
        zoomTrigger.addEventListener('pointerenter', warmCurrentLightboxImage, {
          passive: true,
        })
        zoomTrigger.addEventListener('touchstart', warmCurrentLightboxImage, {
          passive: true,
        })
        zoomTrigger.addEventListener('focus', warmCurrentLightboxImage)

        zoomTrigger.addEventListener('click', (event) => {
          if (suppressZoomClick) {
            event.preventDefault()
            event.stopPropagation()
            suppressZoomClick = false
            return
          }

          openLightbox()
        })
      }

      if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => {
          setActiveImage(currentImageIndex - 1)
        })
      }

      if (lightboxNext) {
        lightboxNext.addEventListener('click', () => {
          setActiveImage(currentImageIndex + 1)
        })
      }

      lightboxCloseControls.forEach((control) => {
        control.addEventListener('click', closeLightbox)
      })

      if (prevVideo) {
        prevVideo.addEventListener('click', () => {
          const autoplay = !!video && !video.paused && !video.ended
          setActiveVideo(currentVideoIndex - 1, { autoplay })
        })
      }

      if (nextVideo) {
        nextVideo.addEventListener('click', () => {
          const autoplay = !!video && !video.paused && !video.ended
          setActiveVideo(currentVideoIndex + 1, { autoplay })
        })
      }

      videoItems.forEach((item) => {
        item.addEventListener('click', () => {
          setActiveVideo(videoItems.indexOf(item))
        })
      })

      if (video) {
        video.addEventListener('play', syncHeroVideoState)
        video.addEventListener('playing', syncHeroVideoState)
      }

      bindSwipe(
        zoomTrigger,
        () => setActiveImage(currentImageIndex - 1),
        () => setActiveImage(currentImageIndex + 1),
        markSwipeHandled,
      )

      bindSwipe(
        lightboxDialog,
        () => setActiveImage(currentImageIndex - 1),
        () => setActiveImage(currentImageIndex + 1),
      )

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isLightboxOpen) {
          closeLightbox()
          return
        }

        if (!isLightboxOpen) return

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          setActiveImage(currentImageIndex - 1)
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault()
          setActiveImage(currentImageIndex + 1)
        }
      })

      const initialPane =
        $('.template-hero__media-tab.is-active', gallery)?.dataset.mediaTab ||
        'image'

      setActiveImage(currentImageIndex)
      setActiveVideo(currentVideoIndex, { load: initialPane === 'video' })
      setActivePane(initialPane)
      syncHeroVideoState()
    })
  }

  function initHeroBenefitsDrawer() {
    const root = $('[data-template-benefits]')
    if (!root) return

    const drawer = $('[data-benefit-drawer]', root)
    const panel = $('.template-benefits__panel', drawer)
    const closeButton = $('.template-benefits__close', drawer)
    const triggers = $$('[data-benefit-open]', root)
    const closeControls = $$('[data-benefit-close]', drawer)
    const items = $$('[data-benefit-item]', drawer)
    if (!drawer || !panel || !triggers.length || !items.length) return

    document.body.appendChild(drawer)
    drawer.classList.remove('is-open')
    drawer.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('template-benefits-drawer-open')

    let lastTrigger = null

    const syncItem = (item, expanded) => {
      const body = $('.template-benefits__item-body', item)
      const inner = $('.template-benefits__item-inner', item)
      const toggle = $('.template-benefits__item-toggle', item)
      if (!body || !inner || !toggle) return

      item.classList.toggle('is-active', expanded)
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false')
      body.style.maxHeight = expanded ? inner.scrollHeight + 'px' : '0px'
    }

    items.forEach((item) => syncItem(item, false))

    const setActiveItem = (key, allowCollapse) => {
      let matched = null
      items.forEach((item) => {
        const isTarget = item.dataset.benefitItem === key
        if (isTarget) matched = item
      })

      items.forEach((item) => {
        if (item !== matched) syncItem(item, false)
      })

      if (!matched) return

      const isActive = matched.classList.contains('is-active')
      syncItem(matched, allowCollapse ? !isActive : true)
    }

    const openDrawer = (key) => {
      drawer.classList.add('is-open')
      drawer.setAttribute('aria-hidden', 'false')
      document.body.classList.add('template-benefits-drawer-open')
      setActiveItem(key || items[0].dataset.benefitItem, false)
      if (closeButton) closeButton.focus()
    }

    const closeDrawer = () => {
      drawer.classList.remove('is-open')
      drawer.setAttribute('aria-hidden', 'true')
      document.body.classList.remove('template-benefits-drawer-open')
      if (lastTrigger) lastTrigger.focus()
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        lastTrigger = trigger
        openDrawer(trigger.dataset.benefitOpen)
      })
    })

    items.forEach((item) => {
      const toggle = $('.template-benefits__item-toggle', item)
      if (!toggle) return

      toggle.addEventListener('click', () => {
        setActiveItem(item.dataset.benefitItem, true)
      })
    })

    closeControls.forEach((control) => {
      control.addEventListener('click', closeDrawer)
    })

    window.addEventListener('resize', () => {
      const active = $('.template-benefits__item.is-active', drawer)
      if (!active) return
      syncItem(active, true)
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer()
      }
    })
  }

  function initMobileMenu() {
    const header = $('.template-topbar')
    const menu = $('[data-mobile-menu]')
    if (!header || !menu) return

    const toggle = $('[data-mobile-menu-toggle]', header)
    const panel = $('.template-mobile-menu__panel', menu)
    const brandSlot = $('[data-mobile-menu-brand]', menu)
    const navSlot = $('[data-mobile-menu-nav]', menu)
    const closeControls = $$('[data-mobile-menu-close]', menu)
    const brandSource =
      $('.template-topbar__brand', header) || $('.template-logo', header)
    const navSource = $('.template-topbar__links', header)

    if (!toggle || !panel || !navSlot || !navSource) return

    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu)
    }

    if (brandSource && brandSlot && !brandSlot.hasChildNodes()) {
      brandSlot.replaceChildren(brandSource.cloneNode(true))
    }

    if (!navSlot.hasChildNodes()) {
      const navClone = navSource.cloneNode(true)
      navClone.classList.remove('template-topbar__links')
      navClone.classList.add('template-mobile-menu__nav-list')
      navClone.removeAttribute('aria-label')
      navSlot.replaceChildren(navClone)
    }

    let lastFocusedElement = null

    const setOpen = (nextOpen, { restoreFocus = true } = {}) => {
      menu.classList.toggle('is-open', nextOpen)
      menu.setAttribute('aria-hidden', nextOpen ? 'false' : 'true')
      toggle.setAttribute('aria-expanded', nextOpen ? 'true' : 'false')
      document.body.classList.toggle('template-mobile-menu-open', nextOpen)

      if (nextOpen) {
        lastFocusedElement = document.activeElement
        panel.focus({ preventScroll: true })
        return
      }

      if (
        restoreFocus &&
        lastFocusedElement &&
        typeof lastFocusedElement.focus === 'function'
      ) {
        lastFocusedElement.focus()
      }
    }

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('is-open')
      setOpen(!isOpen)
    })

    closeControls.forEach((control) => {
      control.addEventListener('click', () => setOpen(false))
    })

    $$('a[href]', menu).forEach((link) => {
      link.addEventListener('click', () =>
        setOpen(false, { restoreFocus: false }),
      )
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false)
      }
    })

    window.addEventListener('resize', () => {
      if (window.innerWidth > 767 && menu.classList.contains('is-open')) {
        setOpen(false, { restoreFocus: false })
      }
    })
  }

  function initSmoothScroll() {
    $$('[data-scroll-target]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault()
        const target = document.querySelector(btn.dataset.scrollTarget)
        if (target)
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })

    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href')
        if (!id || id === '#') return
        const target = document.querySelector(id)
        if (target) {
          event.preventDefault()
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })
  }

  function initVideoHeroHeader() {
    const header = $('.template-topbar')
    const hero = $('.template-video-hero')
    if (!header || !hero) return

    const root = document.documentElement
    let rafId = 0

    const syncHeaderHeight = () => {
      root.style.setProperty(
        '--template-topbar-height',
        `${header.offsetHeight}px`,
      )
    }

    const updateState = () => {
      rafId = 0
      syncHeaderHeight()

      const threshold = header.offsetHeight + 8
      const isOverHero = hero.getBoundingClientRect().bottom > threshold
      header.classList.toggle('is-over-hero', isOverHero)
    }

    const requestUpdate = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(updateState)
    }

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(requestUpdate)
      resizeObserver.observe(header)
    }

    updateState()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    window.addEventListener('load', requestUpdate, { once: true })
  }

  function initDeferredVideoHero() {
    const hero = $('[data-video-hero]')
    const video = $('[data-video-hero-media]', hero || document)
    const source = $('[data-video-hero-source]', hero || document)
    const poster = $('[data-video-hero-poster]', hero || document)
    if (!hero || !video || !source) return

    let videoLoaded = false
    let startQueued = false
    let idleId = 0
    let timeoutId = 0

    const cancelQueuedStart = () => {
      if (idleId && 'cancelIdleCallback' in window) {
        cancelIdleCallback(idleId)
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }

      idleId = 0
      timeoutId = 0
      startQueued = false
    }

    const loadVideo = () => {
      if (videoLoaded) return

      const src = source.dataset.src
      if (!src) return

      source.src = src
      videoLoaded = true
      video.preload = 'metadata'

      try {
        video.load()
      } catch (_) {}
    }

    const playVideo = () => {
      loadVideo()
      video.defaultMuted = true
      video.muted = true

      const playAttempt = video.play()
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {})
      }
    }

    const queueStart = () => {
      if (startQueued || document.hidden) return

      startQueued = true

      const startPlayback = () => {
        idleId = 0
        timeoutId = 0
        startQueued = false
        playVideo()
      }

      if ('requestIdleCallback' in window) {
        idleId = requestIdleCallback(startPlayback, { timeout: 1200 })
      } else {
        timeoutId = window.setTimeout(startPlayback, 400)
      }
    }

    const startImmediately = () => {
      cancelQueuedStart()
      if (!document.hidden) playVideo()
    }

    const revealVideo = () => {
      hero.classList.add('is-video-ready')
      if (poster) poster.setAttribute('aria-hidden', 'true')
    }

    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.playsInline = true
    video.defaultMuted = true
    video.muted = true

    video.addEventListener('playing', revealVideo)
    video.addEventListener('canplay', () => {
      if (document.hidden || !video.paused) return
      playVideo()
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelQueuedStart()
        video.pause()
        return
      }

      if (hero.getBoundingClientRect().bottom > 0) {
        if (videoLoaded) playVideo()
        else queueStart()
      }
    })

    ;['pointerdown', 'touchstart', 'focusin'].forEach((eventName) => {
      hero.addEventListener(eventName, startImmediately, {
        once: true,
        passive: eventName === 'touchstart',
      })
    })

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              cancelQueuedStart()
              video.pause()
              return
            }

            if (videoLoaded) playVideo()
            else queueStart()
          })
        },
        { threshold: 0.2, rootMargin: '160px 0px' },
      )

      observer.observe(hero)
    } else {
      queueStart()
    }
  }

  function initStickyPurchaseBar() {
    const hero = $('#template-hero')
    const bar = $('[data-sticky-purchase]')
    if (!hero || !bar) return

    const priceSource = $('.template-hero__price', hero)
    const ctaRow = $('.template-hero__cta-row', hero)
    const buySource = $(
      '.template-hero__cta-row .template-button--primary',
      hero,
    )
    const detailsSource = $(
      '.template-hero__cta-row .template-button--secondary',
      hero,
    )
    const priceTarget = $('[data-sticky-price]', bar)
    const buyTarget = $('[data-sticky-buy]', bar)
    const detailsTarget = $('[data-sticky-details]', bar)
    const topbar = $('.template-topbar')
    const mobileViewport = window.matchMedia('(max-width: 767px)')

    const syncLink = (source, target) => {
      if (!source || !target) return

      target.innerHTML = source.innerHTML

      const href = source.getAttribute('href')
      if (href !== null) target.setAttribute('href', href)
    }

    if (priceSource && priceTarget) {
      priceTarget.innerHTML = priceSource.innerHTML
    }

    syncLink(detailsSource, detailsTarget)
    syncLink(buySource, buyTarget)

    let isVisible = false
    let rafId = 0

    const setVisible = (nextVisible) => {
      if (isVisible === nextVisible) return

      isVisible = nextVisible
      bar.classList.toggle('is-visible', nextVisible)
      bar.setAttribute('aria-hidden', nextVisible ? 'false' : 'true')
      document.body.classList.toggle(
        'template-sticky-purchase-active',
        nextVisible,
      )
    }

    const updateVisibility = () => {
      rafId = 0

      const offsetTop = (topbar?.offsetHeight || 0) + 12
      const triggerElement = mobileViewport.matches && ctaRow ? ctaRow : hero
      const triggerBottom = triggerElement.getBoundingClientRect().bottom
      setVisible(triggerBottom <= offsetTop)
    }

    const requestUpdate = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    window.addEventListener('load', requestUpdate, { once: true })
    if (mobileViewport.addEventListener) {
      mobileViewport.addEventListener('change', requestUpdate)
    } else if (mobileViewport.addListener) {
      mobileViewport.addListener(requestUpdate)
    }
  }

  function initComponentVideos() {
    const autoplayObserver =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const video = entry.target
                if (!(video instanceof HTMLVideoElement)) return
                if (video.offsetParent === null) return

                if (entry.isIntersecting) {
                  if (video.preload === 'none') {
                    video.preload = 'metadata'
                    try {
                      video.load()
                    } catch (_) {}
                  }
                  if (video.dataset.userPaused === 'true') return
                  video.defaultMuted = true
                  video.muted = true
                  const playAttempt = video.play()
                  if (playAttempt && typeof playAttempt.catch === 'function') {
                    playAttempt.catch(() => {})
                  }
                } else {
                  video.pause()
                }
              })
            },
            { threshold: 0.35, rootMargin: '120px 0px' },
          )
        : null

    const setupComponentVideo = (component) => {
      if (component.dataset.videoSetup === 'true') {
        return $('video', component)
      }

      const video = hydrateComponentVideo(component)
      if (!video) return null

      const previewImage = $(':scope > img', component)
      const playButton = $('.deferred-play-btn', component)
      const wantsAutoplay = componentWantsAutoplay(component, video)

      const syncState = (playing) => {
        component.classList.toggle('is-playing', playing)
        if (playButton) {
          playButton.setAttribute(
            'aria-label',
            playing ? 'Pause video' : 'Play video',
          )
          playButton.setAttribute('aria-pressed', playing ? 'true' : 'false')
        }
      }

      const revealVideo = () => {
        component.classList.add('is-video-ready')
        if (previewImage) previewImage.setAttribute('aria-hidden', 'true')
      }

      component.dataset.videoSetup = 'true'
      video.preload = 'none'
      video.addEventListener('play', () => syncState(true))
      video.addEventListener('pause', () => syncState(false))
      video.addEventListener('ended', () => syncState(false))
      video.addEventListener('loadeddata', () => {
        if (wantsAutoplay) revealVideo()
      })
      video.addEventListener('canplay', () => {
        if (wantsAutoplay) revealVideo()
      })
      video.addEventListener('playing', () => {
        syncState(true)
        revealVideo()
      })
      syncState(!video.paused && !video.ended)

      if (playButton) {
        video.addEventListener('click', () => {
          if (!video.paused && !video.ended) video.pause()
        })
      }

      if (wantsAutoplay) {
        if (autoplayObserver) autoplayObserver.observe(video)
        else {
          if (video.preload === 'none') {
            video.preload = 'metadata'
            try {
              video.load()
            } catch (_) {}
          }
          video.defaultMuted = true
          video.muted = true
          video.play().catch(() => {})
        }
      }

      return video
    }

    const hydrateAndMaybePlay = (component, shouldPlay = false) => {
      const video = setupComponentVideo(component)
      if (!video) return null

      if (!shouldPlay) return video

      if (video.preload === 'none') {
        video.preload = 'metadata'
        try {
          video.load()
        } catch (_) {}
      }

      video.dataset.userPaused = 'false'
      video.defaultMuted = true
      video.muted = true
      video.play().catch(() => {})

      return video
    }

    const hydrationObserver =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return
                const component = entry.target
                if (!(component instanceof HTMLElement)) return
                if (!isComponentVideoRenderable(component)) return

                setupComponentVideo(component)
                hydrationObserver.unobserve(component)
              })
            },
            { threshold: 0.01, rootMargin: '120px 0px' },
          )
        : null

    $$('component-video').forEach((component) => {
      const playButton = $('.deferred-play-btn', component)
      const previewImage = $(':scope > img', component)
      const wantsAutoplay = componentWantsAutoplay(component)

      if (playButton) {
        playButton.addEventListener('click', (event) => {
          event.preventDefault()
          const video = hydrateAndMaybePlay(component)
          if (!video) return

          if (video.paused || video.ended) {
            video.dataset.userPaused = 'false'
            video.defaultMuted = true
            video.muted = true
            video.play().catch(() => {})
          } else {
            video.dataset.userPaused = 'true'
            video.pause()
          }
        })
      } else if (previewImage && !wantsAutoplay) {
        previewImage.addEventListener('click', () => {
          hydrateAndMaybePlay(component, true)
        })
      }

      if (previewImage && !wantsAutoplay) {
        const warmVideo = () => {
          const video = setupComponentVideo(component)
          if (!video || video.preload !== 'none') return

          video.preload = 'metadata'
          try {
            video.load()
          } catch (_) {}
        }

        previewImage.addEventListener('pointerenter', warmVideo, {
          once: true,
        })
        previewImage.addEventListener('touchstart', warmVideo, {
          once: true,
          passive: true,
        })
      }

      if (!hydrationObserver) {
        setupComponentVideo(component)
      } else {
        hydrationObserver.observe(component)

        if (wantsAutoplay && isComponentVideoRenderable(component)) {
          const rect = component.getBoundingClientRect()
          const viewportHeight =
            window.innerHeight || document.documentElement.clientHeight || 0

          if (rect.top < viewportHeight && rect.bottom > 0) {
            setupComponentVideo(component)
            hydrationObserver.unobserve(component)
          }
        }
      }
    })
  }

  function getYouTubeVideoId(url) {
    const value = String(url || '').trim()
    if (!value) return ''

    try {
      const parsed = new URL(value, window.location.origin)

      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.replace(/^\/+/, '').split('/')[0] || ''
      }

      if (parsed.searchParams.get('v')) {
        return parsed.searchParams.get('v') || ''
      }

      const pathMatch = parsed.pathname.match(
        /\/(?:embed|shorts|live)\/([^/?#]+)/,
      )
      if (pathMatch) return pathMatch[1] || ''
    } catch (_) {
      const directMatch = value.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^&?/]+)/,
      )
      if (directMatch) return directMatch[1] || ''
    }

    return ''
  }

  function initProductInfluencerYouTube() {
    const section = $('.product-influencer-video')
    if (!section) return

    const cards = $$('.youtube-review-card', section)
    if (!cards.length) return

    const pauseCard = (card) => {
      const iframe = $('iframe.js-youtube', card)

      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'pauseVideo',
              args: '',
            }),
            '*',
          )
        } catch (_) {}
      }
    }

    const buildYouTubeIframe = (videoId, title) => {
      const iframe = document.createElement('iframe')
      const params = new URLSearchParams({
        autoplay: '0',
        playsinline: '1',
        rel: '0',
        modestbranding: '1',
        enablejsapi: '1',
      })

      if (/^https?:$/.test(window.location.protocol)) {
        params.set('origin', window.location.origin)
      }

      iframe.className = 'js-youtube youtube-review-card__iframe'
      iframe.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`
      iframe.title = title || 'YouTube video player'
      iframe.loading = 'lazy'
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      iframe.allowFullscreen = true
      iframe.referrerPolicy = 'strict-origin-when-cross-origin'

      return iframe
    }

    cards.forEach((card) => {
      const player = $('.youtube-review-card__player', card)
      if (!player) return

      const title = card.dataset.videoTitle || 'YouTube review'
      const videoId = getYouTubeVideoId(card.dataset.youtubeUrl)
      if (!videoId) {
        card.classList.add('is-empty')
        player.innerHTML =
          '<div class="youtube-review-card__empty">Add YouTube URL</div>'
        return
      }

      player.replaceChildren(buildYouTubeIframe(videoId, title))
      card.classList.add('is-ready')
    })

    const sliderEl = $('splide-slider.product-influencer-video-splide', section)
    const bindSliderPause = (slider) => {
      if (!slider || slider.__youtubeReviewBound === true) return
      slider.__youtubeReviewBound = true

      slider.on('move', () => {
        cards.forEach((card) => {
          pauseCard(card)
        })
      })
    }

    if (sliderEl?.slider) {
      bindSliderPause(sliderEl.slider)
    } else {
      sliderEl?.addEventListener('splide:loaded', (event) => {
        bindSliderPause(event.detail.slider)
      })
    }
  }

  function initLazyVideos() {
    $$('video').forEach((video) => {
      if (video.dataset.loadStrategy === 'manual') return
      if (video.dataset.src && !video.src) {
        video.src = video.dataset.src
      }
      $$('source', video).forEach((source) => {
        if (source.dataset.src && !source.src) source.src = source.dataset.src
      })
    })
  }

  function initVideoButtons() {
    $$(
      '.vis-overview-sale-item-video, .vis-overview-sale-item-second, .selling-points-card, .wd-video-change, .component-video',
    ).forEach((container) => {
      const video = $('video', container)
      const play = $('.vis-overview-sale-item-video-play-btn', container)
      const stop = $('.vis-overview-sale-item-video-stop-btn', container)
      if (!video || (!play && !stop)) return

      const setState = (playing) => {
        container.classList.toggle(
          'vis-overview-sale-item-video-active',
          playing,
        )
        if (play) play.style.display = playing ? 'none' : ''
        if (stop) stop.style.display = playing ? '' : 'none'
      }

      if (play) {
        play.addEventListener('click', () => {
          video.play().catch(() => {})
          setState(true)
        })
      }
      if (stop) {
        stop.addEventListener('click', () => {
          video.pause()
          setState(false)
        })
      }
    })
  }

  function initProductNav() {
    const nav = $('#productNav')
    const placeholder = $('#productNavPlaceholder')
    if (!nav || !placeholder) return

    const items = $$('.product-nav__item', nav)
    const targets = [
      '.wd-product-anchor-overview',
      '.wd-product-anchor-specs',
      '.wd-product-anchor-compares',
      '.wd-product-anchor-reviews',
      '.wd-product-anchor-faqs',
    ]
      .map((sel) => $(sel))
      .filter(Boolean)

    const setActive = (index) => {
      items.forEach((item, i) =>
        item.classList.toggle('nav-item-active', i === index),
      )
    }

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        const target = targets[index]
        if (!target) return
        const offset = nav.classList.contains('product-nav-fixed')
          ? nav.offsetHeight
          : 0
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset - 12
        window.scrollTo({ top, behavior: 'smooth' })
      })
    })

    const updateFixed = () => {
      const shouldFix = placeholder.getBoundingClientRect().top <= 0
      nav.classList.toggle('product-nav-fixed', shouldFix)
      placeholder.style.height = shouldFix ? nav.offsetHeight + 'px' : '0px'

      let active = 0
      targets.forEach((target, index) => {
        if (target.getBoundingClientRect().top <= nav.offsetHeight + 80)
          active = index
      })
      setActive(active)
    }

    updateFixed()
    window.addEventListener('scroll', updateFixed, { passive: true })
    window.addEventListener('resize', updateFixed)
  }

  function initBeforeAfterTabs() {
    $$('.product-before-vs-after').forEach((section) => {
      const tabs = $$('.product-before-vs-after__tabs-item', section)
      const slides = $$('.product-before-vs-after__slide', section)
      const copies = $$('[data-pbva-copy]', section)
      if (!tabs.length || !slides.length) return

      const setActiveTab = (key) => {
        if (!key) return

        tabs.forEach((tab) => {
          tab.classList.toggle('is-active', tab.dataset.pbvaTab === key)
        })

        slides.forEach((slide) => {
          slide.classList.toggle('is-active', slide.dataset.pbvaSlide === key)
        })

        copies.forEach((copy) => {
          const active = copy.dataset.pbvaCopy === key
          copy.classList.toggle('is-active', active)
          copy.hidden = !active
          copy.setAttribute('aria-hidden', active ? 'false' : 'true')
        })
      }

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          setActiveTab(tab.dataset.pbvaTab || '')
        })
      })

      const initialKey =
        $('.product-before-vs-after__tabs-item.is-active', section)?.dataset
          .pbvaTab ||
        tabs[0]?.dataset.pbvaTab ||
        slides[0]?.dataset.pbvaSlide ||
        ''

      setActiveTab(initialKey)
    })
  }

  function initRevealAnimations() {
    const targets = $$(
      [
        '.template-hero__gallery',
        '.template-hero__content',
        '.selling-points-card',
        '.product-media-switch__media',
        '.product-media-switch__content',
        '.product-waterdrop-animation__media',
        '.product-waterdrop-animation__content',
        '.media-with-text__media',
        '.media-with-text__content',
        '.product-card-splide_slide',
        '.product-certification-splide .splide__slide',
        '.wd-product-splide .splide__slide',
        '.product-influencer-video__text',
        '.product-influencer-video__content',
        '.wd-product-compare__table-wrapper',
        '.wd-product-inbox-splide',
      ].join(', '),
    )

    if (!targets.length) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    targets.forEach((target, index) => {
      if (target.dataset.reveal === 'ready') return
      target.dataset.reveal = 'ready'
      target.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`)
    })

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -12% 0px',
      },
    )

    targets.forEach((target) => observer.observe(target))
  }

  function initCompareSliders() {
    const wrappers = $$(
      '.product-before-vs-after__comparison, .image-slider-wrapper',
    )
    wrappers.forEach((wrapper) => {
      const before = $(
        '.product-before-vs-after__image--before, .image-slider-wrapper-img2',
        wrapper,
      )
      const handle = $(
        '.product-before-vs-after__handle, .slider-handle',
        wrapper,
      )
      if (!before || !handle) return

      const readInitialPercent = () => {
        const clipPath =
          before.style.clipPath ||
          window.getComputedStyle(before).clipPath ||
          ''
        const match = clipPath.match(
          /inset\(0(?:px)?\s+([0-9.]+)%\s+0(?:px)?\s+0(?:px)?\)/,
        )
        if (match) return Math.max(0, Math.min(100, 100 - parseFloat(match[1])))

        const handleLeft =
          handle.style.left || window.getComputedStyle(handle).left
        if (handleLeft && handleLeft.includes('%')) {
          return Math.max(0, Math.min(100, parseFloat(handleLeft)))
        }

        return 71.43
      }

      const setPosition = (clientX) => {
        const rect = wrapper.getBoundingClientRect()
        const percent = Math.min(
          100,
          Math.max(0, ((clientX - rect.left) / rect.width) * 100),
        )
        before.style.clipPath = `inset(0 ${100 - percent}% 0 0)`
        handle.style.left = percent + '%'
      }

      const setPositionByPercent = (percent) => {
        const boundedPercent = Math.min(100, Math.max(0, percent))
        before.style.clipPath = `inset(0 ${100 - boundedPercent}% 0 0)`
        handle.style.left = boundedPercent + '%'
      }

      setPositionByPercent(readInitialPercent())

      const start = (event) => {
        event.preventDefault()
        wrapper.classList.add('is-dragging')
        const move = (e) =>
          setPosition(e.touches ? e.touches[0].clientX : e.clientX)
        const end = () => {
          wrapper.classList.remove('is-dragging')
          window.removeEventListener('mousemove', move)
          window.removeEventListener('mouseup', end)
          window.removeEventListener('touchmove', move)
          window.removeEventListener('touchend', end)
        }
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', end)
        window.addEventListener('touchmove', move, { passive: false })
        window.addEventListener('touchend', end)
      }

      handle.addEventListener('mousedown', start)
      handle.addEventListener('touchstart', start, { passive: false })
      wrapper.addEventListener('click', (e) => setPosition(e.clientX))
    })
  }

  function initGenericTabs() {
    $$('.tab-buttons').forEach((group) => {
      const buttons = $$('.tab-button', group)
      const parent = group.closest('section') || document
      const panes = $$('.vis-overview-compare-img', parent)
      if (!buttons.length || !panes.length) return

      buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
          buttons.forEach((b) => b.classList.remove('active'))
          panes.forEach((p) => p.classList.remove('active'))
          btn.classList.add('active')
          if (panes[index]) panes[index].classList.add('active')
        })
      })
    })

    const reviewRoot = $('#review-content')
    if (reviewRoot) {
      const tabs = $$('.wd-reviews-tab', reviewRoot)
      const panes = $$('.wd-reviews-pane', reviewRoot)
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
          tabs.forEach((t) => t.classList.remove('wd-reviews-tab-active'))
          panes.forEach((p) => p.classList.remove('wd-reviews-pane-active'))
          tab.classList.add('wd-reviews-tab-active')
          if (panes[index]) panes[index].classList.add('wd-reviews-pane-active')
        })
      })
    }
  }

  function createFaqItemIcon() {
    const icon = document.createElement('span')
    icon.className = 'wd-faq-item-icon'
    icon.setAttribute('aria-hidden', 'true')
    icon.innerHTML =
      '<svg class="wd-faq-item-icon-svg" fill="none" height="7" viewBox="0 0 11 7" width="11" xmlns="http://www.w3.org/2000/svg"><path d="M0.442383 0.442383L5.44238 5.44238L10.4424 0.442383" stroke="currentColor" stroke-linejoin="round" stroke-width="1.25"></path></svg>'
    return icon
  }

  function initFaqGroup(root) {
    if (root.dataset.faqReady === 'true') return

    const items = $$('details.wd-faq-item', root)
    if (!items.length) return

    root.dataset.faqReady = 'true'

    const closeItem = (item) => {
      const summary = $('summary', item)
      const body = $('.wd-faq-item-body', item)
      if (!body) return

      item.classList.remove('wd-faq-item-active')
      if (summary) summary.setAttribute('aria-expanded', 'false')
      body.style.maxHeight = '0px'
      window.setTimeout(() => {
        if (!item.classList.contains('wd-faq-item-active')) {
          item.removeAttribute('open')
        }
      }, 300)
    }

    const openItem = (item) => {
      const summary = $('summary', item)
      const body = $('.wd-faq-item-body', item)
      const inner = $('.wd-faq-item-body-inner', item)
      if (!body || !inner) return

      item.setAttribute('open', '')
      item.classList.add('wd-faq-item-active')
      if (summary) summary.setAttribute('aria-expanded', 'true')
      body.style.maxHeight = inner.scrollHeight + 'px'
    }

    items.forEach((item) => {
      const summary = $('summary', item)
      if (!summary) return

      if (item.open) openItem(item)
      else {
        summary.setAttribute('aria-expanded', 'false')
        closeItem(item)
      }

      summary.addEventListener('click', (event) => {
        event.preventDefault()
        const isOpen = item.classList.contains('wd-faq-item-active')

        if (isOpen) {
          closeItem(item)
          return
        }

        items.forEach((other) => {
          if (other !== item) closeItem(other)
        })
        openItem(item)
      })
    })

    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (!item.classList.contains('wd-faq-item-active')) return
        const body = $('.wd-faq-item-body', item)
        const inner = $('.wd-faq-item-body-inner', item)
        if (body && inner) body.style.maxHeight = inner.scrollHeight + 'px'
      })
    })

    const toggle = $('.wd-faq-toggle-more', root)
    const list = $('.wd-faq-list', root)
    if (toggle && list) {
      toggle.addEventListener('click', () => {
        const expanded = list.classList.toggle('wd-faq-list--expanded')
        toggle.classList.toggle('wd-faq-toggle-more--expanded', expanded)
        const text = $('.wd-faq-toggle-more-text', toggle)
        if (text) text.textContent = expanded ? 'Show Less' : 'Show More'
      })
    }
  }

  function initSpecsMobileTabs() {
    $$('.wd-specs-list').forEach((list) => {
      if (list.dataset.mobileTabsReady === 'true') return

      const items = $$('.wd-specs-item', list)
      if (!items.length) return

      const accordion = document.createElement('div')
      accordion.className = 'wd-specs-mobile-faq'
      accordion.setAttribute('aria-label', 'Специфікації')

      const accordionList = document.createElement('div')
      accordionList.className = 'wd-faq-list wd-specs-mobile-faq-list'

      items.forEach((item, itemIndex) => {
        const label = $('.wd-specs-item-label', item)?.textContent?.trim()
        const value = $('.wd-specs-item-value', item)
        if (!label || !value) return

        const details = document.createElement('details')
        details.className = 'wd-faq-item wd-specs-faq-item'
        if (itemIndex === 0) details.setAttribute('open', '')

        const summary = document.createElement('summary')
        summary.className = 'wd-faq-item-header'

        const title = document.createElement('h3')
        title.className = 'wd-faq-item-title'
        title.textContent = label

        const body = document.createElement('div')
        body.className = 'wd-faq-item-body'

        const bodyInner = document.createElement('div')
        bodyInner.className = 'wd-faq-item-body-inner'

        const valueClone = value.cloneNode(true)
        bodyInner.appendChild(valueClone)
        summary.appendChild(title)
        summary.appendChild(createFaqItemIcon())
        body.appendChild(bodyInner)
        details.appendChild(summary)
        details.appendChild(body)
        accordionList.appendChild(details)
      })

      if (!accordionList.children.length) return

      accordion.appendChild(accordionList)
      list.parentNode?.insertBefore(accordion, list)
      list.dataset.mobileTabsReady = 'true'
      initFaqGroup(accordion)
    })
  }

  function initFaq() {
    $$('.wd-faq-inner').forEach((root) => {
      initFaqGroup(root)
    })
  }

  function disableLiveStoreSubmits() {
    $$('form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault()
        console.info('Form submission is disabled in the clean template.')
      })
    })
    $$('a[href="#"], button[name="add"], .component-atc-button').forEach(
      (el) => {
        el.addEventListener('click', (event) => {
          const href = el.getAttribute && el.getAttribute('href')
          const isLink = el.tagName === 'A'
          const shouldPrevent =
            href === '#' ||
            el.getAttribute('name') === 'add' ||
            (el.classList.contains('component-atc-button') && !isLink)

          if (shouldPrevent) {
            event.preventDefault()
          }
        })
      },
    )
  }

  onReady(() => {
    initSplideSliders()
    initHeroGallery()
    initHeroBenefitsDrawer()
    initMobileMenu()
    initSmoothScroll()
    initDeferredVideoHero()
    initVideoHeroHeader()
    initStickyPurchaseBar()
    initComponentVideos()
    initProductInfluencerYouTube()
    initLazyVideos()
    initVideoButtons()
    initProductNav()
    initBeforeAfterTabs()
    initCompareSliders()
    initGenericTabs()
    initSpecsMobileTabs()
    initFaq()
    initRevealAnimations()
    disableLiveStoreSubmits()
  })
})()
