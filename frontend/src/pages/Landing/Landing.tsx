import { HeroSection } from '../../components/landing/HeroSection'
import { LearningMethod } from '../../components/landing/LearningMethod'
import { InteractiveLearningPreview } from '../../components/landing/InteractiveLearningPreview'
import { RoadmapPreview } from '../../components/landing/RoadmapPreview'
import { PlatformFeatures } from '../../components/landing/PlatformFeatures'
import { AITutorPreview } from '../../components/landing/AITutorPreview'
import { ModuleJourney } from '../../components/landing/ModuleJourney'
import { FinalCTA } from '../../components/landing/FinalCTA'

export function Landing() {
  return (
    <div className="q-landing">
      <HeroSection />
      <LearningMethod />
      <InteractiveLearningPreview />
      <RoadmapPreview />
      <PlatformFeatures />
      <AITutorPreview />
      <ModuleJourney />
      <FinalCTA />
    </div>
  )
}
