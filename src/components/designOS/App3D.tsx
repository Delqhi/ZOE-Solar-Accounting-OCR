/**
 * 2026 GLASSMORPHISM 2.0 - 3D ENHANCED APP COMPONENT
 * Main application with advanced 3D depth effects and parallax
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import { useState, useEffect } from 'react';
import {
  DepthContainer,
  DepthCard,
  ParallaxSection,
  DepthStack,
  FloatingElement,
  DepthIndicator,
  DepthGrid,
  DepthCarousel
} from './depth3D';
import { TypographyHeading, TypographyBody, TypographyGradient } from './typography';
import { Input2026 } from './Input2026';
import { use3DDepth, useParallax, useFloating } from '../hooks/use3D';

interface App3DProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
}

export const App3D: React.FC<App3DProps> = ({
  children,
  title = "ZOE Solar Accounting",
  subtitle = "2026 Glassmorphism 2.0",
  backgroundImage
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize 3D effects
  const depthHook = use3DDepth({ layers: 5, baseZ: 0, spacing: 8 });
  const parallaxHook = useParallax({
    speed: 0.3,
    direction: 'vertical',
    intensity: 1,
    enabled: true
  });
  const floatingHook = useFloating({
    height: 12,
    duration: 6000,
    enabled: true
  });

  // Track scroll and mouse position for dynamic effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Dynamic depth based on scroll position
  const dynamicDepth = Math.min(5, Math.floor(scrollY / 200) + 1);

  return (
    <div className="app-3d relative min-h-screen">
      {/* 3D Depth Indicator */}
      <FloatingElement height={15} duration={8000} delay={0} zIndex={100}>
        <DepthIndicator threshold={0.3} showValue={true} />
      </FloatingElement>

      {/* Hero Section with Parallax */}
      <ParallaxSection
        backgroundImage={backgroundImage}
        speed={0.4}
        intensity={1.5}
        fullHeight={true}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Floating Title Section */}
        <FloatingElement height={20} duration={10000} delay={0}>
          <DepthStack
            items={[
              {
                id: '1',
                title: 'ZOE Solar',
                subtitle: 'Accounting',
                content: (
                  <TypographyHeading level="h1" className="text-center">
                    <TypographyGradient type="primary">{title}</TypographyGradient>
                  </TypographyHeading>
                )
              },
              {
                id: '2',
                title: '2026',
                subtitle: 'Glassmorphism 2.0',
                content: (
                  <TypographyBody className="text-center text-lg">
                    {subtitle}
                  </TypographyBody>
                )
              },
              {
                id: '3',
                title: 'Experience',
                subtitle: 'Next Gen',
                content: (
                  <TypographyBody className="text-center text-sm text-text-muted">
                    Advanced 3D effects, AI-powered workflows, and immersive user experience
                  </TypographyBody>
                )
              }
            ]}
            direction="vertical"
            spacing={40}
            depth={dynamicDepth}
            interactive={true}
          />
        </FloatingElement>

        {/* Floating CTA Section */}
        <FloatingElement height={10} duration={6000} delay={1000} zIndex={10}>
          <DepthContainer
            depth={dynamicDepth}
            floating={true}
            interactive={true}
            style={{
              marginTop: '4rem',
              padding: '2rem',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <TypographyBody style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                Ready to experience the future of accounting?
              </TypographyBody>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <DepthCard
                  title="Upload Documents"
                  subtitle="Drag & Drop"
                  depth={2}
                  hoverEffect={true}
                  style={{ minWidth: '200px' }}
                >
                  <TypographyBody>Fast, secure, and intelligent document processing</TypographyBody>
                </DepthCard>

                <DepthCard
                  title="AI Analysis"
                  subtitle="Smart Insights"
                  depth={3}
                  hoverEffect={true}
                  style={{ minWidth: '200px' }}
                >
                  <TypographyBody>Get actionable insights with AI-powered analysis</TypographyBody>
                </DepthCard>

                <DepthCard
                  title="3D Dashboard"
                  subtitle="Immersive View"
                  depth={4}
                  hoverEffect={true}
                  style={{ minWidth: '200px' }}
                >
                  <TypographyBody>Explore your data in stunning 3D visualizations</TypographyBody>
                </DepthCard>
              </div>
            </div>
          </DepthContainer>
        </FloatingElement>
      </ParallaxSection>

      {/* Main Content Area */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          marginTop: '-100px',
          padding: '2rem 0'
        }}
      >
        {/* Content Grid with Depth Effects */}
        <DepthGrid
          columns={3}
          rows={2}
          interactive={true}
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 2rem'
          }}
        >
          {React.Children.map(children, (child, index) => (
            <FloatingElement
              key={`content-${index}`}
              height={8 + (index * 2)}
              duration={4000 + (index * 1000)}
              delay={index * 200}
            >
              <DepthCard
                depth={2 + index}
                hoverEffect={true}
                tilt={true}
                floating={true}
                style={{
                  height: '100%',
                  minHeight: '200px'
                }}
              >
                {child}
              </DepthCard>
            </FloatingElement>
          ))}
        </DepthGrid>
      </main>

      {/* Footer with 3D Effects */}
      <footer
        style={{
          marginTop: '4rem',
          padding: '4rem 2rem',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(10, 14, 20, 0.8) 100%)',
          position: 'relative'
        }}
      >
        <DepthContainer
          depth={2}
          floating={true}
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          <TypographyHeading level="h3" className="text-center">
            <TypographyGradient type="secondary">Powered by 2026 Technology</TypographyGradient>
          </TypographyHeading>

          <TypographyBody style={{ marginTop: '1rem', maxWidth: '800px', margin: '0 auto' }}>
            Built with cutting-edge 2026 technologies including Glassmorphism 2.0, 3D depth effects,
            AI-powered workflows, and advanced accessibility features for the ultimate user experience.
          </TypographyBody>

          {/* Floating tech badges */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['React 19', 'TypeScript', 'Glassmorphism 2.0', '3D Depth', 'AI Integration'].map((tech, index) => (
              <FloatingElement
                key={tech}
                height={6 + index}
                duration={3000 + (index * 500)}
                delay={index * 100}
                zIndex={5}
              >
                <DepthCard
                  depth={1 + index}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <TypographyBody style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {tech}
                  </TypographyBody>
                </DepthCard>
              </FloatingElement>
            ))}
          </div>
        </DepthContainer>
      </footer>

      {/* Interactive Background Elements */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, index) => (
          <FloatingElement
            key={`particle-${index}`}
            height={Math.random() * 20 + 10}
            duration={Math.random() * 8000 + 4000}
            delay={index * 200}
            zIndex={1}
          >
            <div
              style={{
                position: 'absolute',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                background: `rgba(0, 212, 255, ${Math.random() * 0.5 + 0.1})`,
                borderRadius: '50%',
                filter: 'blur(1px)'
              }}
            />
          </FloatingElement>
        ))}

        {/* Grid lines */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.1,
            pointerEvents: 'none'
          }}
        >
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
};

export default App3D;