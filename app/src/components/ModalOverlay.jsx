import React, { useEffect } from 'react';

/**
 * ModalOverlay - Reusable modal backdrop component
 *
 * Handles:
 * - Mobile viewport coverage (oversized backdrop for address bar changes)
 * - Vertical centering with optional upward shift for better UX
 * - Click-outside-to-close behavior
 * - Body scroll prevention
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when backdrop is clicked (optional)
 * @param {React.ReactNode} children - Modal content
 * @param {string} className - Additional classes for the content wrapper
 * @param {number} zIndex - z-index value (default: 50)
 * @param {string} backdropOpacity - Tailwind opacity class (default: "bg-black/95")
 * @param {boolean} blur - Enable backdrop blur (default: true)
 * @param {string} verticalShift - Tailwind translate class (default: "-translate-y-[5vh]")
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
  verticalShift = '-translate-y-[5vh]',
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
    <div
      className={`fixed left-0 flex items-center justify-center p-4 ${backdropOpacity} ${blur ? 'backdrop-blur-sm' : ''}`}
      style={{
        top: '-50vh',
        width: '100vw',
        height: '200vh',
        zIndex,
      }}
      onClick={handleBackdropClick}
    >
      <div
        className={`${verticalShift} ${className}`}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalOverlay;
