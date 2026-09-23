import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import AboutSection from '../components/landing/AboutSection'
import ServicesSection from '../components/landing/ServicesSection'
import FleetSection from '../components/landing/FleetSection'
import FacilitiesSection from '../components/landing/FacilitiesSection'
import ContactSection from '../components/landing/ContactSection'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-main)' }}>
      <LandingHeader />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <FleetSection />
        <FacilitiesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
