/**
 * 2026 GLASSMORPHISM 2.0 - 3D ENHANCED UPLOAD AREA
 * Advanced drag & drop with 3D depth effects and haptic feedback
 * Version: 2026.0 | Source: 2026 Best Practices
 */

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { DepthContainer, DepthCard, FloatingElement } from './depth3D';
import { TypographyHeading, TypographyBody, TypographyGradient } from './typography';
import { use3DDepth, useFloating } from '../../hooks/use3D';

interface UploadAreaProps {
  onUploadComplete?: (result: any) => void;
}

export const UploadArea3D: React.FC<UploadAreaProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragCount, setDragCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize 3D effects
  const depthHook = use3DDepth({ layers: 5, baseZ: 0, spacing: 8 });
  const floatingHook = useFloating({
    height: 16,
    duration: 8000,
    enabled: true
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsDragging(false);
    setUploadProgress(0);

    // Simulate upload progress with 3D effects
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          onUploadComplete?.({ files: acceptedFiles, status: 'completed' });
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => {
      setIsDragging(true);
      setDragCount(prev => prev + 1);
    },
    onDragLeave: () => setIsDragging(false),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/csv': ['.csv']
    }
  });

  // 3D animation variants
  const uploadAreaVariants = {
    initial: {
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    drag: {
      scale: 1.05,
      rotateX: 5,
      rotateY: 5,
      boxShadow: '0 20px 60px rgba(0, 212, 255, 0.4)',
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    hover: {
      scale: 1.02,
      boxShadow: '0 15px 50px rgba(0, 102, 255, 0.3)'
    },
    upload: {
      scale: 1.1,
      rotateX: 10,
      rotateY: 10,
      boxShadow: '0 30px 100px rgba(0, 212, 255, 0.6)'
    }
  };

  return (
    <DepthContainer
      {...getRootProps()}
      ref={containerRef}
      depth={isDragActive ? 5 : 3}
      floating={true}
      interactive={true}
      style={{
        position: 'relative',
        cursor: 'pointer',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '24px',
        border: `2px dashed ${isDragActive ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)'}`,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
      className="upload-area-3d"
    >
      <input {...getInputProps()} />

      {/* Animated Background Grid */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 102, 255, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, transparent 49%, rgba(255, 255, 255, 0.1) 50%, transparent 51%)
          `,
          backgroundSize: '100px 100px',
          animation: 'grid-move 20s linear infinite',
          zIndex: 1
        }}
      />

      {/* Progress Overlay */}
      <AnimatePresence>
        {uploadProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, rgba(0, 212, 255, 0.3) ${uploadProgress}%, transparent ${uploadProgress}%)`,
              zIndex: 3,
              borderRadius: '24px'
            }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <FloatingElement height={20} duration={6000} delay={0}>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem' }}>
          {/* Icon Animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
              y: [0, -10, 10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            style={{ marginBottom: '2rem' }}
          >
            <DepthCard
              depth={4}
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px'
              }}
            >
              <span style={{ fontSize: '2rem' }}>📁</span>
            </DepthCard>
          </motion.div>

          {/* Title */}
          <TypographyHeading level="h3" className="text-center" style={{ marginBottom: '1rem' }}>
            <TypographyGradient type={isDragActive ? 'primary' : 'secondary'}>
              {isDragActive ? 'Drop Files Here!' : 'Drag & Drop Files'}
            </TypographyGradient>
          </TypographyHeading>

          {/* Subtitle */}
          <TypographyBody className="text-center" style={{ marginBottom: '2rem', maxWidth: '400px' }}>
            {isDragActive
              ? 'Release to upload and process your documents'
              : 'Supports PDF, images, and text files. Experience AI-powered processing.'}
          </TypographyBody>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {[
              { icon: '🚀', text: 'Instant Upload' },
              { icon: '🤖', text: 'AI Processing' },
              { icon: '🔒', text: 'Secure' }
            ].map((feature, index) => (
              <FloatingElement
                key={feature.text}
                height={8 + index}
                duration={4000 + (index * 500)}
                delay={index * 200}
              >
                <DepthCard
                  depth={2 + index}
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>
                    {feature.icon}
                  </span>
                  <TypographyBody style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {feature.text}
                  </TypographyBody>
                </DepthCard>
              </FloatingElement>
            ))}
          </div>

          {/* Drag Count */}
          {dragCount > 0 && (
            <FloatingElement height={10} duration={3000} delay={0}>
              <DepthCard
                depth={3}
                style={{
                  marginTop: '2rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  display: 'inline-block'
                }}
              >
                <TypographyBody style={{ fontSize: '0.875rem', color: '#00D4FF' }}>
                  {dragCount} drag{dragCount > 1 ? 's' : ''} today
                </TypographyBody>
              </DepthCard>
            </FloatingElement>
          )}
        </div>
      </FloatingElement>

      {/* Floating Particles */}
      {Array.from({ length: 10 }).map((_, index) => (
        <FloatingElement
          key={`particle-${index}`}
          height={Math.random() * 15 + 5}
          duration={Math.random() * 6000 + 3000}
          delay={index * 300}
          zIndex={1}
        >
          <div
            style={{
              position: 'absolute',
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: `rgba(0, 212, 255, ${Math.random() * 0.3 + 0.1})`,
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
        </FloatingElement>
      ))}
    </DepthContainer>
  );
};

export default UploadArea3D;