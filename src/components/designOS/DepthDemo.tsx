/**
 * 2026 GLASSMORPHISM 2.0 - 3D DEPTH DEMO
 * Complete demonstration of 3D depth, parallax, and interactive effects
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React, { useState } from 'react';
import {
  DepthContainer,
  DepthCard,
  ParallaxSection,
  DepthStack,
  FloatingElement,
  DepthIndicator,
  DepthGrid,
  DepthCarousel
} from './designOS/depth3D';
import { TypographyHeading, TypographyBody, TypographyGradient } from './designOS/typography';
import { Input2026 } from './designOS/Input2026';

export const DepthDemo: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const features = [
    { id: 'overview', title: 'Overview', icon: '🚀' },
    { id: 'cards', title: '3D Cards', icon: '💎' },
    { id: 'parallax', title: 'Parallax', icon: '🌊' },
    { id: 'stack', title: 'Stack', icon: '🏗️' },
    { id: 'floating', title: 'Floating', icon: '🎈' },
    { id: 'grid', title: 'Grid', icon: '🔲' },
    { id: 'carousel', title: 'Carousel', icon: '🔄' }
  ];

  const stackItems = [
    { id: '1', title: 'Front Layer', content: 'Closest to user', subtitle: 'Z: 24px' },
    { id: '2', title: 'Mid Layer', content: 'Interactive elements', subtitle: 'Z: 16px' },
    { id: '3', title: 'Back Layer', content: 'Background content', subtitle: 'Z: 8px' },
    { id: '4', title: 'Deep Layer', content: 'Decorative elements', subtitle: 'Z: 0px' }
  ];

  const carouselItems = [
    {
      id: '1',
      title: 'Welcome to 2026',
      subtitle: 'Next-Gen Design',
      content: (
        <TypographyBody>
          Experience the future of web design with advanced 3D transforms and depth effects.
        </TypographyBody>
      )
    },
    {
      id: '2',
      title: 'Glassmorphism 2.0',
      subtitle: 'Enhanced Translucency',
      content: (
        <TypographyBody>
          Our advanced glassmorphism system provides stunning visual effects with perfect performance.
        </TypographyBody>
      )
    },
    {
      id: '3',
      title: 'Interactive Depth',
      subtitle: 'User Engagement',
      content: (
        <TypographyBody>
          Deep interactive elements that respond to user input with smooth 3D animations.
        </TypographyBody>
      )
    }
  ];

  return (
    <div className="depth-demo">
      {/* 3D Depth Indicator */}
      <DepthIndicator threshold={0.3} showValue={true} />

      {/* Navigation */}
      <DepthContainer
        className="demo-navigation"
        depth={2}
        floating={true}
        interactive={true}
        style={{
          position: 'sticky',
          top: '20px',
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '1rem',
          margin: '20px auto',
          maxWidth: '800px'
        }}
      >
        <TypographyHeading level="h2" className="text-center" style={{ marginBottom: '1rem' }}>
          <TypographyGradient type="primary">2026 3D Depth Demo</TypographyGradient>
        </TypographyHeading>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center'
        }}>
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveSection(feature.id)}
              className={`demo-nav-item ${activeSection === feature.id ? 'active' : ''}`}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: activeSection === feature.id
                  ? 'linear-gradient(135deg, rgba(0, 102, 255, 0.3), rgba(0, 212, 255, 0.3))'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{feature.icon}</span>
              <span>{feature.title}</span>
            </button>
          ))}
        </div>
      </DepthContainer>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <ParallaxSection
          backgroundImage="https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=1200&q=80"
          speed={0.3}
          fullHeight={false}
          className="demo-overview"
        >
          <FloatingElement height={20} duration={8000} delay={0}>
            <TypographyHeading level="h1" className="text-center" style={{ marginBottom: '2rem' }}>
              <TypographyGradient type="primary">Immersive 3D Experience</TypographyGradient>
            </TypographyHeading>
          </FloatingElement>

          <DepthStack
            items={stackItems}
            direction="horizontal"
            spacing={40}
            depth={4}
            interactive={true}
            className="demo-stack"
          />

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <TypographyBody style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>
              Explore the cutting-edge of web design with our 2026 Glassmorphism 2.0 system.
              Every element has depth, every interaction feels real, and every pixel is optimized.
            </TypographyBody>
          </div>
        </ParallaxSection>
      )}

      {/* 3D Cards Section */}
      {activeSection === 'cards' && (
        <DepthContainer
          className="demo-cards"
          depth={3}
          parallax={true}
          floating={true}
          style={{
            maxWidth: '1200px',
            margin: '4rem auto',
            padding: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}
        >
          <DepthCard
            title="Interactive Card"
            subtitle="Hover me!"
            depth={4}
            parallax={true}
            tilt={true}
            hoverEffect={true}
            clickEffect={true}
            style={{ height: '300px' }}
          >
            <TypographyBody>
              This card demonstrates advanced 3D interactions including tilt, parallax, and depth effects.
              Try hovering and clicking to see the animations in action.
            </TypographyBody>
          </DepthCard>

          <DepthCard
            title="Floating Card"
            subtitle="Dreamy animations"
            depth={3}
            floating={true}
            hoverEffect={true}
            style={{ height: '300px' }}
          >
            <TypographyBody>
              Experience the smooth floating animations that make your interface come alive.
              Perfect for highlighting important content or creating visual interest.
            </TypographyBody>
          </DepthCard>

          <DepthCard
            title="Deep Card"
            subtitle="Maximum depth"
            depth={5}
            parallax={true}
            interactive={true}
            style={{ height: '300px' }}
          >
            <TypographyBody>
              This card showcases the maximum depth capabilities with multiple layers
              of visual effects working together seamlessly.
            </TypographyBody>
          </DepthCard>
        </DepthContainer>
      )}

      {/* Parallax Section */}
      {activeSection === 'parallax' && (
        <div className="demo-parallax">
          <ParallaxSection
            backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80"
            speed={0.4}
            intensity={1.5}
            fullHeight={true}
            className="demo-hero-parallax"
          >
            <FloatingElement height={30} duration={10000} delay={1000}>
              <TypographyHeading level="h1" className="text-center">
                <TypographyGradient type="secondary">Parallax Scrolling</TypographyGradient>
              </TypographyHeading>
            </FloatingElement>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <TypographyBody style={{ fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                Scroll down to experience the parallax effects in action.
                Background layers move at different speeds creating depth and immersion.
              </TypographyBody>
            </div>
          </ParallaxSection>

          <ParallaxSection
            backgroundImage="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
            speed={0.2}
            intensity={1}
            fullHeight={false}
            className="demo-content-parallax"
            style={{ padding: '4rem 0' }}
          >
            <TypographyHeading level="h2" className="text-center" style={{ marginBottom: '2rem' }}>
              Content with Parallax
            </TypographyHeading>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              <DepthCard depth={2} floating={true}>
                <TypographyBody>
                  Parallax effects can be applied to individual content sections,
                  creating a dynamic scrolling experience.
                </TypographyBody>
              </DepthCard>

              <DepthCard depth={3} parallax={true}>
                <TypographyBody>
                  Combine multiple effects for truly unique experiences that
                  captivate your users.
                </TypographyBody>
              </DepthCard>
            </div>
          </ParallaxSection>
        </div>
      )}

      {/* Stack Section */}
      {activeSection === 'stack' && (
        <DepthContainer
          className="demo-stack-section"
          depth={2}
          floating={true}
          style={{
            maxWidth: '1000px',
            margin: '4rem auto',
            padding: '2rem'
          }}
        >
          <TypographyHeading level="h2" className="text-center" style={{ marginBottom: '3rem' }}>
            <TypographyGradient type="primary">3D Stacking System</TypographyGradient>
          </TypographyHeading>

          <div style={{ marginBottom: '3rem' }}>
            <TypographyBody style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '2rem' }}>
              Our stacking system creates beautiful depth layers that can be
              arranged in multiple directions.
            </TypographyBody>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => {/* Change direction to horizontal */}}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Horizontal
              </button>
              <button
                onClick={() => {/* Change direction to vertical */}}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Vertical
              </button>
              <button
                onClick={() => {/* Change direction to grid */}}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Grid
              </button>
            </div>
          </div>

          <DepthStack
            items={stackItems}
            direction="horizontal"
            spacing={60}
            depth={5}
            interactive={true}
          />
        </DepthContainer>
      )}

      {/* Floating Section */}
      {activeSection === 'floating' && (
        <div className="demo-floating" style={{ padding: '4rem 2rem' }}>
          <TypographyHeading level="h2" className="text-center" style={{ marginBottom: '3rem' }}>
            <TypographyGradient type="primary">Floating Elements</TypographyGradient>
          </TypographyHeading>

          <div style={{
            position: 'relative',
            minHeight: '500px',
            background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 212, 255, 0.1))',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <FloatingElement height={20} duration={6000} delay={0} zIndex={10}>
              <TypographyHeading level="h3" style={{ textAlign: 'center', margin: '2rem 0' }}>
                Floating Title
              </TypographyHeading>
            </FloatingElement>

            <FloatingElement height={15} duration={8000} delay={2000} zIndex={5}>
              <DepthCard depth={3} style={{ margin: '2rem' }}>
                <TypographyBody>
                  Floating elements create a sense of weightlessness and
                  add dynamic movement to your interface.
                </TypographyBody>
              </DepthCard>
            </FloatingElement>

            <FloatingElement height={25} duration={10000} delay={4000} zIndex={15}>
              <Input2026
                label="Floating Input"
                placeholder="Type here..."
                style={{ margin: '2rem' }}
              />
            </FloatingElement>

            <FloatingElement height={10} duration={4000} delay={6000} zIndex={8}>
              <TypographyBody style={{ textAlign: 'center', margin: '2rem' }}>
                Perfect for highlighting important information or creating
                decorative elements that catch the eye.
              </TypographyBody>
            </FloatingElement>
          </div>
        </div>
      )}

      {/* Grid Section */}
      {activeSection === 'grid' && (
        <DepthContainer
          className="demo-grid"
          depth={2}
          floating={true}
          style={{
            maxWidth: '1200px',
            margin: '4rem auto',
            padding: '2rem'
          }}
        >
          <TypographyHeading level="h2" className="text-center" style={{ marginBottom: '3rem' }}>
            <TypographyGradient type="primary">3D Grid System</TypographyGradient>
          </TypographyHeading>

          <TypographyBody style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '3rem' }}>
            Our grid system creates interactive 3D layouts with depth layers
            that respond to user interaction.
          </TypographyBody>

          <DepthGrid
            columns={4}
            rows={3}
            interactive={true}
            children={[
              <DepthCard title="Grid Item 1" subtitle="Layer 1" depth={1} floating={true} />,
              <DepthCard title="Grid Item 2" subtitle="Layer 2" depth={2} tilt={true} />,
              <DepthCard title="Grid Item 3" subtitle="Layer 3" depth={3} parallax={true} />,
              <DepthCard title="Grid Item 4" subtitle="Layer 4" depth={4} floating={true} />,
              <DepthCard title="Grid Item 5" subtitle="Layer 5" depth={5} tilt={true} />,
              <DepthCard title="Grid Item 6" subtitle="Layer 6" depth={4} parallax={true} />,
              <DepthCard title="Grid Item 7" subtitle="Layer 7" depth={3} floating={true} />,
              <DepthCard title="Grid Item 8" subtitle="Layer 8" depth={2} tilt={true} />,
              <DepthCard title="Grid Item 9" subtitle="Layer 9" depth={1} parallax={true} />,
              <DepthCard title="Grid Item 10" subtitle="Layer 10" depth={2} floating={true} />,
              <DepthCard title="Grid Item 11" subtitle="Layer 11" depth={3} tilt={true} />,
              <DepthCard title="Grid Item 12" subtitle="Layer 12" depth={4} parallax={true} />
            ]}
          />
        </DepthContainer>
      )}

      {/* Carousel Section */}
      {activeSection === 'carousel' && (
        <DepthContainer
          className="demo-carousel"
          depth={3}
          floating={true}
          style={{
            maxWidth: '1000px',
            margin: '4rem auto',
            padding: '2rem'
          }}
        >
          <TypographyHeading level="h2" className="text-center" style={{ marginBottom: '3rem' }}>
            <TypographyGradient type="primary">3D Carousel</TypographyGradient>
          </TypographyHeading>

          <TypographyBody style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '3rem' }}>
            Our 3D carousel creates depth with items that recede into the background,
            providing an immersive browsing experience.
          </TypographyBody>

          <DepthCarousel
            items={carouselItems}
            autoPlay={true}
            interval={4000}
            showControls={true}
            showIndicators={true}
          />

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <TypographyBody>
              Each carousel item uses 3D transforms to create a sense of depth and
              perspective, making the browsing experience more engaging.
            </TypographyBody>
          </div>
        </DepthContainer>
      )}
    </div>
  );
};

export default DepthDemo;