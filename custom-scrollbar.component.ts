// Note this is (so far) only a vertical scrollbar that was enough for me, and has some styles based upon urls


/**
 CUSTOM OVERLAY SCROLLBAR COMPONENT

 This component implements a custom scrollbar using the "overlay scrollbar" technique.
 It replaces the native browser scrollbar with a styled, theme-aware custom scrollbar.

 HOW THE OVERLAY TECHNIQUE WORKS:
 ================================
 1. The viewport container is made wider than its parent by ~20px (calc(100% + 20px))
 2. This pushes the native scrollbar outside the visible area (hidden by overflow:hidden on parent)
 3. A custom scrollbar is overlaid on top using absolute positioning
 4. The custom scrollbar's position and size are calculated based on scroll ratios

 KEY CSS CLASSES:
 ================
 - .os-host: The main container with overflow:hidden to clip the native scrollbar
 - .os-viewport: The scrollable area, wider than parent to hide native scrollbar
 - .os-content: The actual content wrapper with padding to prevent overlap
 - .os-scrollbar-track: The custom scrollbar track (background)
 - .os-scrollbar-thumb: The draggable thumb element

 THEME INTEGRATION:
 ==================
 The component automatically detects URL changes and switches between:
 - Green theme: For storage/cell-related pages
 - Blue theme: For machine-related pages (URLs containing '/machine')

 Color schemes are defined in the colorSchemes object and include:
 - thumb, thumbHover, thumbActive colors
 - track, trackHover colors

 USAGE EXAMPLE:
 ==============
 <custom-scrollbar [scrollbarWidth]="6">
 <div>Your scrollable content here</div>
 </custom-scrollbar>

 TYPICAL USAGE (with proper container sizing):
 <div style="height: 300px; width: 100%;">
 <custom-scrollbar [scrollbarWidth]="6">
 <div style="height: 1000px;">
 Content that's taller than the 300px container
 </div>
 </custom-scrollbar>
 </div>

 REAL-WORLD EXAMPLE (like your sidenav):
 <nav style="height: calc(100vh - 51px);">
 <custom-scrollbar [scrollbarWidth]="6">
 <ng-container *ngFor="let item of items">
 <div class="nav-item">{{ item.name }}</div>
 </ng-container>
 <div class="version-info">Version info...</div>
 </custom-scrollbar>
 </nav>

 INPUT PROPERTIES:
 =================
 - scrollbarWidth: Width of the custom scrollbar track (default: 10px)
 - trackColorOverride: Override default track color
 - thumbColorOverride: Override default thumb color

 RESPONSIVE BEHAVIOR:
 ====================
 - Automatically hides when content doesn't require scrolling
 - Supports both mouse and touch interactions
 - Recalculates on window resize and content changes
 - Uses MutationObserver to detect dynamic content changes

 BROWSER COMPATIBILITY:
 ======================
 - Webkit browsers: Uses ::-webkit-scrollbar properties to hide native scrollbar
 - Firefox: Uses scrollbar-width: none
 - IE/Edge: Uses -ms-overflow-style: none
 - Mobile: Supports touch events with momentum scrolling on iOS

 ACCESSIBILITY NOTES:
 ====================
 - Maintains keyboard navigation (arrow keys, page up/down still work)
 - Preserves scroll wheel functionality
 - Touch devices can still use native scroll gestures on the content area
 - Custom scrollbar provides visual feedback for scroll position
 */

import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

enum ThemeColors {
  Green = 'green',
  Blue = 'blue'
}

@Component({
  selector: 'custom-scrollbar',
  templateUrl: './custom-scrollbar.component.html',
  standalone: true,
  styleUrls: ['./custom-scrollbar.component.css'],
})
export class CustomScrollbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('thumb') thumbRef!: ElementRef<HTMLDivElement>;

  // Customization inputs
  @Input() scrollbarWidth: number = 10;
  @Input() trackColorOverride: string = '';
  @Input() thumbColorOverride: string = '';

  private viewportEl!: HTMLDivElement;
  private thumbEl!: HTMLDivElement;
  private destroy$ = new Subject<void>();
  private currentThemeColor: ThemeColors = ThemeColors.Green;

  // Drag state
  private isDragging = false;
  private dragStartY = 0;
  private thumbStartY = 0;

  // Color schemes these are for my project that has a theme switch based upon url.
  private colorSchemes = {
    [ThemeColors.Green]: {
      thumb: '#08a208',
      thumbHover: 'rgba(21, 128, 61, 0.9)',
      thumbActive: 'rgba(20, 83, 45, 0.95)',
      track: 'rgba(224, 246,224,0.6)',
      trackHover: 'rgba(34, 197, 94, 0.25)'
    },
    [ThemeColors.Blue]: {
      thumb: '#0076CC',
      thumbHover: 'rgba(0, 80, 160, 0.9)',
      thumbActive: 'rgba(0, 60, 120, 0.95)',
      track: 'rgba(217,229,255,0.6)',
      trackHover: 'rgba(59, 130, 246, 0.25)'
    }
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateThemeColor(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updateThemeColor(event.url);
        if (this.thumbEl && this.viewportEl) {
          this.applyCustomization();
        }
      });
  }

  private updateThemeColor(url: string) {
    if (url.includes('/machine')) {
      this.currentThemeColor = ThemeColors.Blue;
    } else {
      this.currentThemeColor = ThemeColors.Green;
    }
  }

  private applyCustomization() {
    if (!this.thumbEl || !this.viewportEl) return;

    const colorScheme = this.colorSchemes[this.currentThemeColor];
    const trackEl = this.thumbEl.parentElement as HTMLElement;

    if (trackEl) {
      trackEl.style.width = `${this.scrollbarWidth}px`;
    }

    const thumbColor = this.thumbColorOverride || colorScheme.thumb;
    this.thumbEl.style.setProperty('background-color', thumbColor, 'important');

    const trackColor = this.trackColorOverride || colorScheme.track;
    if (trackEl) {
      trackEl.style.setProperty('background-color', trackColor, 'important');
    }

    document.documentElement.style.setProperty('--custom-scrollbar-thumb-hover',
      this.thumbColorOverride || colorScheme.thumbHover);
    document.documentElement.style.setProperty('--custom-scrollbar-thumb-active',
      this.thumbColorOverride || colorScheme.thumbActive);
    document.documentElement.style.setProperty('--custom-scrollbar-track-hover',
      this.trackColorOverride || colorScheme.trackHover);
  }

  ngAfterViewInit() {
    this.viewportEl = this.viewportRef.nativeElement;
    this.thumbEl = this.thumbRef.nativeElement;

    this.applyCustomization();

    setTimeout(() => {
      this.updateThumbSize();
      this.updateThumbPosition();
    }, 200);

    this.setupContentObserver();

    this.thumbEl.addEventListener('mousedown', this.onThumbMouseDown.bind(this));
    this.thumbEl.addEventListener('touchstart', this.onThumbTouchStart.bind(this), { passive: false });
  }

  private setupContentObserver() {
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        setTimeout(() => {
          this.updateThumbSize();
          this.updateThumbPosition();
        }, 50);
      });

      observer.observe(this.viewportEl, {
        childList: true,
        subtree: true,
        attributes: false
      });

      (this as any).contentObserver = observer;
    }

    setInterval(() => {
      this.updateThumbSize();
    }, 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    this.thumbEl?.removeEventListener('mousedown', this.onThumbMouseDown.bind(this));
    this.thumbEl?.removeEventListener('touchstart', this.onThumbTouchStart.bind(this));

    if ((this as any).contentObserver) {
      (this as any).contentObserver.disconnect();
    }
  }

  onContentScroll() {
    if (!this.isDragging) {
      this.updateThumbPosition();
    }
  }

  private updateThumbSize() {
    const scrollHeight = this.viewportEl.scrollHeight;
    const clientHeight = this.viewportEl.clientHeight;

    if (scrollHeight <= clientHeight + 5) {
      // Hide both thumb and track when no scrolling is needed
      this.thumbEl.style.display = 'none';
      const trackEl = this.thumbEl.parentElement as HTMLElement;
      if (trackEl) {
        trackEl.style.display = 'none';
      }
      return;
    } else {
      // Show both thumb and track when scrolling is needed
      this.thumbEl.style.display = 'block';
      const trackEl = this.thumbEl.parentElement as HTMLElement;
      if (trackEl) {
        trackEl.style.display = 'block';
      }
    }

    const thumbHeightRatio = clientHeight / scrollHeight;
    const minThumbHeight = 50;
    const maxThumbHeight = clientHeight - 20;
    const calculatedHeight = clientHeight * thumbHeightRatio;
    const thumbHeight = Math.max(minThumbHeight, Math.min(maxThumbHeight, calculatedHeight));

    this.thumbEl.style.height = `${thumbHeight}px`;
  }
  private updateThumbSize_old() {
    const scrollHeight = this.viewportEl.scrollHeight;
    const clientHeight = this.viewportEl.clientHeight;

    if (scrollHeight <= clientHeight + 5) {
      this.thumbEl.style.display = 'none';
      return;
    } else {
      this.thumbEl.style.display = 'block';
    }

    const thumbHeightRatio = clientHeight / scrollHeight;
    const minThumbHeight = 50;
    const maxThumbHeight = clientHeight - 20;
    const calculatedHeight = clientHeight * thumbHeightRatio;
    const thumbHeight = Math.max(minThumbHeight, Math.min(maxThumbHeight, calculatedHeight));

    this.thumbEl.style.height = `${thumbHeight}px`;
  }

  private updateThumbPosition() {
    const scrollTop = this.viewportEl.scrollTop;
    const scrollHeight = this.viewportEl.scrollHeight;
    const clientHeight = this.viewportEl.clientHeight;

    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    const thumbMaxY = clientHeight - this.thumbEl.offsetHeight;
    const thumbY = scrollPercentage * thumbMaxY;

    this.thumbEl.style.transform = `translate3d(0, ${thumbY}px, 0)`;
  }

  private onThumbMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.dragStartY = event.clientY;

    const transform = this.thumbEl.style.transform;
    const match = transform.match(/translate3d\(0,\s*([^,]+)px,\s*0\)/);
    this.thumbStartY = match ? parseFloat(match[1]) : 0;

    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));

    this.thumbEl.style.opacity = '0.8';
  }

  private onDocumentMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    event.preventDefault();

    const deltaY = event.clientY - this.dragStartY;
    const newThumbY = this.thumbStartY + deltaY;

    const thumbMaxY = this.viewportEl.clientHeight - this.thumbEl.offsetHeight;
    const clampedThumbY = Math.max(0, Math.min(newThumbY, thumbMaxY));

    this.thumbEl.style.transform = `translate3d(0, ${clampedThumbY}px, 0)`;

    const scrollPercentage = clampedThumbY / thumbMaxY;
    const scrollHeight = this.viewportEl.scrollHeight;
    const clientHeight = this.viewportEl.clientHeight;
    const newScrollTop = scrollPercentage * (scrollHeight - clientHeight);

    this.viewportEl.scrollTop = newScrollTop;
  }

  private onDocumentMouseUp() {
    if (!this.isDragging) return;

    this.isDragging = false;

    document.removeEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onDocumentMouseUp.bind(this));

    this.thumbEl.style.opacity = '';
  }

  onTrackClick(event: MouseEvent) {
    if (event.target === this.thumbEl) {
      return;
    }

    event.stopPropagation();

    const trackEl = event.currentTarget as HTMLElement;
    const rect = trackEl.getBoundingClientRect();
    const clickY = event.clientY - rect.top;

    const thumbHeight = this.thumbEl.offsetHeight;
    const targetThumbY = clickY - (thumbHeight / 2);
    const thumbMaxY = this.viewportEl.clientHeight - thumbHeight;
    const clampedThumbY = Math.max(0, Math.min(targetThumbY, thumbMaxY));

    const scrollPercentage = clampedThumbY / thumbMaxY;
    const scrollHeight = this.viewportEl.scrollHeight;
    const clientHeight = this.viewportEl.clientHeight;
    const newScrollTop = scrollPercentage * (scrollHeight - clientHeight);

    this.viewportEl.scrollTo({
      top: newScrollTop,
      behavior: 'smooth'
    });
  }

  private onThumbTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    this.isDragging = true;
    this.dragStartY = touch.clientY;

    const transform = this.thumbEl.style.transform;
    const match = transform.match(/translate3d\(0,\s*([^,]+)px,\s*0\)/);
    this.thumbStartY = match ? parseFloat(match[1]) : 0;

    document.addEventListener('touchmove', this.onDocumentTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onDocumentTouchEnd.bind(this));

    this.thumbEl.style.opacity = '0.8';
  }

  private onDocumentTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    event.preventDefault();
    const touch = event.touches[0];

    const deltaY = touch.clientY - this.dragStartY;
    const newThumbY = this.thumbStartY + deltaY;

    const thumbMaxY = this.viewportEl.clientHeight - this.thumbEl.offsetHeight;
    const clampedThumbY = Math.max(0, Math.min(newThumbY, thumbMaxY));

    this.thumbEl.style.transform = `translate3d(0, ${clampedThumbY}px, 0)`;

    const scrollPercentage = clampedThumbY / thumbMaxY;
    const scrollHeight = this.viewportEl.scrollHeight;
    const clientHeight = this.viewportEl.clientHeight;
    const newScrollTop = scrollPercentage * (scrollHeight - clientHeight);

    this.viewportEl.scrollTop = newScrollTop;
  }

  private onDocumentTouchEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;

    document.removeEventListener('touchmove', this.onDocumentTouchMove.bind(this));
    document.removeEventListener('touchend', this.onDocumentTouchEnd.bind(this));

    this.thumbEl.style.opacity = '';
  }

  @HostListener('window:resize')
  onWindowResize() {
    setTimeout(() => {
      this.updateThumbSize();
      this.updateThumbPosition();
    }, 100);
  }
}
