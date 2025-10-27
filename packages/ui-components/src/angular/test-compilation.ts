// Simple compilation test for Angular components
// This file tests that the components can be imported and their types are correct

import { NgAdBanner } from './NgAdBanner';
import { NgAdInterstitial } from './NgAdInterstitial';
import { NgAdNative } from './NgAdNative';
import { AiAd YuugenAngularModule } from './ai-yuugen-angular.module';
import { AiAd YuugenService } from './ai-yuugen.service';

// Test that all exports are available
export {
  NgAdBanner,
  NgAdInterstitial,
  NgAdNative,
  AiAd YuugenAngularModule,
  AiAd YuugenService
};

// Test that theme interfaces are properly exported
import type { AdBannerTheme } from './NgAdBanner';
import type { AdInterstitialTheme } from './NgAdInterstitial';
import type { AdNativeTheme } from './NgAdNative';

export type {
  AdBannerTheme,
  AdInterstitialTheme,
  AdNativeTheme
};

console.log('Angular components compilation test passed');