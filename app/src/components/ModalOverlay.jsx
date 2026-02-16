import React, { useEffect } from 'react';

/**
 * ModalOverlay - Reusable modal backdrop component
 *
 * Uses two-layer structure:
 * 1. Backdrop layer: Oversized for mobile viewport coverage (address bar changes)
 * 2. Content layer: Fixed to actual viewport for proper centering
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when backdrop is clicked (optional)
 * @param {React.ReactNode} children - Modal content
 * @param {string} className - Additional classes for the content wrapper
 * @param {number} zIndex - z-index value (default: 50)
 * @param {string} backdropOpacity - Tailwind opacity class (default: "bg-black/95")
 * @param {boolean} blur - Enable backdrop blur (default: true)
 * @param {string} verticalShift - Tailwind translate class (default: "-translate-y-[3vh]")
 * @param {boolean} preventScroll - Prevent body scroll when open (default: true)
 * @param {boolean} closeOnBackdropClick - Close when clicking backdrop (default: true)
 */
const ModalOverlay = ({
  isOpen,
  onClose,
  children,
  className = '',
  zIndex = 50,
  backdropOpacity = 'bg-black/95',
  blur = true,
  verticalShift = '-translate-y-[3vh]',
  preventScroll = true,
  closeOnBackdropClick = true,
}) => {
  // Handle body scroll prevention
  useEffect(() => {
    if (isOpen && preventScroll) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (preventScroll) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, preventScroll]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Layer 1: Oversized backdrop for mobile viewport coverage */}
      <div
        className={`fixed ${backdropOpacity} ${blur ? 'backdrop-blur-sm' : ''}`}
        style={{
          top: '-100vh',
          left: '-50vw',
          width: '200vw',
          height: '300vh',
          zIndex,
        }}
        onClick={handleBackdropClick}
      />

      {/* Layer 2: Fixed to viewport for proper centering */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: zIndex + 1 }}
        onClick={handleBackdropClick}
      >
        <div
          className={`${verticalShift} ${className}`}
          onClick={handleContentClick}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default ModalOverlay;
