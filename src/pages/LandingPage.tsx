import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { Hero } from '../components/landing/Hero'
import { WhatIsLogic } from '../components/landing/WhatIsLogic'
import { LogicFlowVisualizer } from '../components/logic/LogicFlowVisualizer'
import { FourLanguages } from '../components/landing/FourLanguages'
import { InteractiveCode } from '../components/landing/InteractiveCode'
import { TraceSection } from '../components/landing/TraceSection'
import { SolveChallenge } from '../components/landing/SolveChallenge'
import { DebuggingSection } from '../components/landing/DebuggingSection'
import { AlgorithmBuilder } from '../components/challenge/AlgorithmBuilder'
import { LearningPathPreview } from '../components/landing/LearningPathPreview'
import { StartTraining } from '../components/landing/StartTraining'

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-lab-950">
      <Navbar variant="public" />
      <main>
        <Hero />
        <WhatIsLogic />
        <LogicFlowVisualizer />
        <FourLanguages />
        <InteractiveCode />
        <TraceSection />
        <SolveChallenge />
        <DebuggingSection />
        <AlgorithmBuilder />
        <LearningPathPreview />
        <StartTraining />
      </main>
      <Footer />
    </div>
  )
}