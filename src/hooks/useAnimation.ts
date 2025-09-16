import { useState, useEffect } from 'react';

const useAnimation = (isOpen: boolean, duration = 300) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10); // Small delay to allow DOM to render before animating
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), duration);
    }
  }, [isOpen, duration]);

  return { shouldRender, isVisible };
};

export default useAnimation;
