import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Leaf, Sprout, Trees } from 'lucide-react'
import AiChatWidget from '../../components/AiChatWidget'
import AbsenceModal from './modals/AbsenceModal'
import FeaturesSection from './components/FeaturesSection'
import HeroSection from './components/HeroSection'
import LandingFooter from './components/LandingFooter'
import LandingHeader from './components/LandingHeader'
import LookupSection from './components/LookupSection'
import useStudentLookup from './hooks/useStudentLookup'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modalClass, setModalClass] = useState<ReturnType<typeof useStudentLookup>['selectedClass']>(null)
  const lookup = useStudentLookup()

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div id="top" className="relative isolate min-h-screen bg-[#F5FAF4] text-[#0F3822] selection:bg-[#D8F3DC] selection:text-[#0F3822]">
      <div aria-hidden="true" className="login-scene pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F5FAF4]">
        <div className="login-canopy login-canopy-top" />
        <div className="login-canopy login-canopy-bottom" />
        <Leaf className="login-float login-leaf-one" strokeWidth={1.3} />
        <Sprout className="login-float login-sprout" strokeWidth={1.3} />
        <Trees className="login-float login-trees" strokeWidth={1.2} />
        <BookOpen className="login-float login-book" strokeWidth={1.3} />
        <GraduationCap className="login-float login-cap" strokeWidth={1.3} />
        <Leaf className="login-float login-leaf-two" strokeWidth={1.3} />
      </div>

      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        onMenuToggle={() => setMobileMenuOpen((current) => !current)}
        onNavigate={navigate}
        onScroll={scrollToSection}
      />
      <HeroSection onLookup={() => scrollToSection('lookup-section')} onLogin={() => navigate('/login')} />
      <LookupSection
        studentCodeInput={lookup.studentCodeInput}
        onCodeChange={(value) => {
          lookup.setStudentCodeInput(value)
          lookup.setErrorMessage('')
        }}
        onSearch={lookup.handleSearch}
        isLoading={lookup.isLoading}
        hasSearched={lookup.hasSearched}
        errorMessage={lookup.errorMessage}
        onClearError={() => lookup.setErrorMessage('')}
        student={lookup.studentProfile}
        classes={lookup.studentClasses}
        selectedClass={lookup.selectedClass}
        classDetailLoading={lookup.classDetailLoading}
        exams={lookup.exams}
        homeworks={lookup.homeworks}
        onSelectClass={lookup.selectClass}
        onOpenAbsence={setModalClass}
      />
      <FeaturesSection />
      <LandingFooter onNavigate={navigate} onScroll={scrollToSection} />

      {modalClass && lookup.studentProfile && (
        <AbsenceModal
          student={lookup.studentProfile}
          classItem={modalClass}
          onClose={() => setModalClass(null)}
        />
      )}
      <AiChatWidget />
    </div>
  )
}
