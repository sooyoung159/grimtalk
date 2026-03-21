import { SectionTitle } from '@/components/common/section-title';
import { PrimaryButton } from '@/components/common/primary-button';
import { LandingHeroCard } from './landing-hero-card';
import { NanaGuide } from '@/components/nana/nana-guide';
import { COPY } from '@/lib/constants/copy';
import { ScreenContainer } from '@/components/common/screen-container';

export function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <ScreenContainer>
      <NanaGuide message={COPY.landing.nana} />
      <SectionTitle title={COPY.landing.title} description={COPY.landing.sub} align="center" />
      <LandingHeroCard />
      <PrimaryButton onClick={onStart}>{COPY.landing.cta}</PrimaryButton>
    </ScreenContainer>
  );
}
