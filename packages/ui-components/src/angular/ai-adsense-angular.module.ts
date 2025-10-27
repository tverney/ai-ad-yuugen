import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgAdBanner } from './NgAdBanner';
import { NgAdInterstitial } from './NgAdInterstitial';
import { NgAdNative } from './NgAdNative';

/**
 * Angular module for AI Ad Yuugen UI components
 * Provides banner, interstitial, and native ad components with proper dependency injection
 */
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    NgAdBanner,
    NgAdInterstitial,
    NgAdNative
  ],
  exports: [
    NgAdBanner,
    NgAdInterstitial,
    NgAdNative
  ]
})
export class AiAd YuugenAngularModule {}

// Re-export components for direct import
export { NgAdBanner } from './NgAdBanner';
export { NgAdInterstitial } from './NgAdInterstitial';
export { NgAdNative } from './NgAdNative';

// Re-export theme interfaces
export type { AdBannerTheme } from './NgAdBanner';
export type { AdInterstitialTheme } from './NgAdInterstitial';
export type { AdNativeTheme } from './NgAdNative';