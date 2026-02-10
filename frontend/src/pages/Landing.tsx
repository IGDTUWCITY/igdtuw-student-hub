import { ArrowRight, GraduationCap } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import BlurText from "./BlurText";
import TextType from '@/components/TextType';


export default function Landing() {
  const { user, loading } = useAuth();
  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="min-h-screen hero-campus-bg text-white">
      <div className="min-h-screen bg-black/35">
        <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              <span>IGDTUW Student Community</span>
            </div>
            <BlurText
              text="IGDTUW City 2.0"
              delay={500}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="m-0 justify-center font-display text-5xl font-bold leading-none tracking-[-0.03em] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl"
            />
            <TextType
              className="mt-5 justify-center text-lg text-white/90 sm:text-xl"
              text={[
                'The ultimate student hub',
                'Built for IGDTUW students',
                'Discover. Plan. Grow.',
              ]}
              typingSpeed={115}
              pauseDuration={1500}
              showCursor
              cursorCharacter="_"
              deletingSpeed={50}
              variableSpeedEnabled={false}
              variableSpeedMin={60}
              variableSpeedMax={120}
              cursorBlinkDuration={0.5}
            />
            <div className="mt-8">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90">
                <Link to="/auth" className="inline-flex items-center gap-2">
                  Let's Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
