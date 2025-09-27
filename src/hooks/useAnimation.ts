import { useState, useEffect } from 'react';

/**
 * A custom hook to manage animations for mounting and unmounting components.
 * It controls the rendering and visibility states to allow for entry and exit animations.
 *
 * @param {boolean} isOpen - A boolean indicating whether the component should be open or closed.
 * @param {number} [duration=1000] - The duration of the animation in milliseconds.
 * @returns {{ shouldRender: boolean, isVisible: boolean }} An object containing:
 * - `shouldRender`: A boolean indicating if the component should be rendered in the DOM.
 * - `isVisible`: A boolean indicating if the component should be visible (e.g., for applying opacity).
 */
const useAnimation = (isOpen: boolean, duration = 1000) => {
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
