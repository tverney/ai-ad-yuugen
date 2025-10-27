# Angular Components Usage Demo

This document demonstrates how to use the AI Ad Yuugen Angular components.

## Installation

```bash
npm install @ai-yuugen/ui-components @angular/core @angular/common rxjs
```

## Module Setup

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AiAd YuugenAngularModule } from '@ai-yuugen/ui-components';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AiAd YuugenAngularModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Service Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { AiAd YuugenService } from '@ai-yuugen/ui-components';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <h1>My AI App</h1>
      <ng-ad-banner 
        placementId="header-banner"
        [responsive]="true"
        (adLoad)="onAdLoad($event)"
        (adClick)="onAdClick($event)">
      </ng-ad-banner>
    </div>
  `
})
export class AppComponent implements OnInit {
  
  constructor(private adService: AiAd YuugenService) {}
  
  async ngOnInit() {
    await this.adService.initialize({
      apiKey: 'your-api-key',
      environment: 'development'
    });
  }
  
  onAdLoad(ad: any) {
    console.log('Ad loaded:', ad);
  }
  
  onAdClick(ad: any) {
    console.log('Ad clicked:', ad);
  }
}
```

## Component Examples

### Banner Ad

```html
<ng-ad-banner 
  placementId="main-banner"
  [size]="{ width: 728, height: 90, responsive: true }"
  [responsive]="true"
  [theme]="{
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderRadius: '8px'
  }"
  (adLoad)="onAdLoad($event)"
  (adError)="onAdError($event)"
  (adClick)="onAdClick($event)">
</ng-ad-banner>
```

### Interstitial Ad

```html
<ng-ad-interstitial 
  placementId="popup-ad"
  [isOpen]="showInterstitial"
  [showCloseButton]="true"
  [autoCloseDelay]="5000"
  [closeOnOverlayClick]="true"
  [closeOnEscape]="true"
  (closeEvent)="onInterstitialClose()"
  (adLoad)="onAdLoad($event)"
  (adClick)="onAdClick($event)">
</ng-ad-interstitial>
```

### Native Ad

```html
<ng-ad-native 
  placementId="content-ad"
  layout="card"
  [showImage]="true"
  [showBrandName]="true"
  [showCTA]="true"
  [showAdLabel]="true"
  adLabelText="Sponsored"
  [theme]="{
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    ctaBackgroundColor: '#007bff'
  }"
  (adLoad)="onAdLoad($event)"
  (adClick)="onAdClick($event)">
</ng-ad-native>
```

## Features

### Dependency Injection
- Components use Angular's dependency injection system
- Service is provided at root level for singleton behavior
- Platform detection for SSR compatibility

### Change Detection
- OnPush change detection strategy for performance
- Manual change detection triggers when needed
- Reactive state management with RxJS

### Lifecycle Management
- Proper OnInit/OnDestroy implementation
- Automatic cleanup of observers and timers
- Memory leak prevention

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management for modals

### Server-Side Rendering
- Platform detection to prevent browser-only code on server
- Graceful degradation for SSR environments
- Proper hydration support

## Advanced Usage

### Custom Themes

```typescript
import { AdBannerTheme } from '@ai-yuugen/ui-components';

const customTheme: AdBannerTheme = {
  backgroundColor: '#1a1a1a',
  borderColor: '#333333',
  borderRadius: '16px',
  textColor: '#ffffff',
  fontSize: '16px',
  fontFamily: 'Inter, sans-serif'
};
```

### Event Handling

```typescript
onAdLoad(ad: Ad) {
  // Track ad load event
  this.analytics.track('ad_loaded', {
    adId: ad.id,
    placement: 'header-banner'
  });
}

onAdError(error: Error) {
  // Handle ad loading errors
  console.error('Ad failed to load:', error);
  this.showFallbackContent = true;
}

onAdClick(ad: Ad) {
  // Track ad click event
  this.analytics.track('ad_clicked', {
    adId: ad.id,
    landingUrl: ad.content.landingUrl
  });
}
```

### Service Integration

```typescript
import { AiAd YuugenService } from '@ai-yuugen/ui-components';

@Component({...})
export class MyComponent {
  constructor(private adService: AiAd YuugenService) {}
  
  async getMetrics() {
    if (this.adService.isInitialized()) {
      const metrics = await this.adService.getPerformanceMetrics();
      console.log('Performance:', metrics);
    }
  }
  
  trackCustomEvent() {
    this.adService.trackEvent({
      id: 'custom-event-1',
      type: 'custom_interaction',
      adId: 'current-ad-id',
      sessionId: 'session-123',
      timestamp: new Date(),
      context: { action: 'user_scroll' }
    });
  }
}
```