import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AiAd YuugenAngularModule, NgAdBanner, NgAdInterstitial, NgAdNative } from '../ai-yuugen-angular.module';

@Component({
  template: `
    <ng-ad-banner placementId="test-banner"></ng-ad-banner>
    <ng-ad-interstitial placementId="test-interstitial" [isOpen]="false"></ng-ad-interstitial>
    <ng-ad-native placementId="test-native"></ng-ad-native>
  `
})
class TestHostComponent {}

describe('AiAd YuugenAngularModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAd YuugenAngularModule],
      declarations: [TestHostComponent]
    }).compileComponents();
  });

  it('should create the module', () => {
    expect(AiAd YuugenAngularModule).toBeDefined();
  });

  it('should export NgAdBanner component', () => {
    expect(NgAdBanner).toBeDefined();
    
    const fixture = TestBed.createComponent(NgAdBanner);
    const component = fixture.componentInstance;
    component.placementId = 'test-placement';
    
    expect(component).toBeTruthy();
    expect(component.placementId).toBe('test-placement');
  });

  it('should export NgAdInterstitial component', () => {
    expect(NgAdInterstitial).toBeDefined();
    
    const fixture = TestBed.createComponent(NgAdInterstitial);
    const component = fixture.componentInstance;
    component.placementId = 'test-placement';
    
    expect(component).toBeTruthy();
    expect(component.placementId).toBe('test-placement');
  });

  it('should export NgAdNative component', () => {
    expect(NgAdNative).toBeDefined();
    
    const fixture = TestBed.createComponent(NgAdNative);
    const component = fixture.componentInstance;
    component.placementId = 'test-placement';
    
    expect(component).toBeTruthy();
    expect(component.placementId).toBe('test-placement');
  });

  it('should allow components to be used in templates', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ng-ad-banner')).toBeTruthy();
    expect(compiled.querySelector('ng-ad-interstitial')).toBeTruthy();
    expect(compiled.querySelector('ng-ad-native')).toBeTruthy();
  });

  it('should provide proper component isolation', () => {
    const bannerFixture = TestBed.createComponent(NgAdBanner);
    const interstitialFixture = TestBed.createComponent(NgAdInterstitial);
    const nativeFixture = TestBed.createComponent(NgAdNative);

    const bannerComponent = bannerFixture.componentInstance;
    const interstitialComponent = interstitialFixture.componentInstance;
    const nativeComponent = nativeFixture.componentInstance;

    bannerComponent.placementId = 'banner-test';
    interstitialComponent.placementId = 'interstitial-test';
    nativeComponent.placementId = 'native-test';

    expect(bannerComponent.placementId).toBe('banner-test');
    expect(interstitialComponent.placementId).toBe('interstitial-test');
    expect(nativeComponent.placementId).toBe('native-test');

    // Verify components are independent
    expect(bannerComponent.placementId).not.toBe(interstitialComponent.placementId);
    expect(interstitialComponent.placementId).not.toBe(nativeComponent.placementId);
  });
});