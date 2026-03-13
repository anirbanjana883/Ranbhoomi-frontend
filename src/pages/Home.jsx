import React from 'react';
// import Nav            from '../component/Nav';   // your existing frosted glass Nav
import HeroSection    from '../component/HomepageComponent/HeroSection';
import Nav from "../component/Nav"
import Ticker          from '../component/HomepageComponent/Ticker';
import FeaturesSection from '../component/HomepageComponent/FeaturesSection';
// import PricingSection  from '../component/HomepageComponent/PricingSection';
import PricingPage  from '../pages/PricingPage';
import { CTASection, Footer } from '../component/HomepageComponent/CTAAndFooter';
import { HOME_STYLES } from '../component/HomepageComponent/homeStyles';

export default function Home() {
  return (
    <>
      <style>{HOME_STYLES}</style>
      <div className="ff-inter bg-zinc-950 text-zinc-100 overflow-x-hidden">
        {/* Your existing frosted Nav sits above everything */}
        <Nav />
        <HeroSection />
        <Ticker />
        <FeaturesSection />
        <PricingPage />
        <CTASection />
        <Footer />
      </div>
    </>
  );
}