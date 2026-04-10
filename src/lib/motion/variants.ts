import { Variants } from "framer-motion";
import { DURATION, EASE_OUT_EXPO, STAGGER } from "./constants";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.medium, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.medium, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: DURATION.fast } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: STAGGER.normal, delayChildren: 0.1 } },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: STAGGER.fast, delayChildren: 0.05 } },
};

export const staggerSections: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: STAGGER.section, delayChildren: 0.05 } },
};

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.medium, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, scale: 0.95, y: 8, transition: { duration: DURATION.fast } },
};

export const dropdownMenu: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.normal, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: DURATION.instant } },
};

export const toastSlideIn: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.medium, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -20, transition: { duration: DURATION.fast } },
};

export const shake: Variants = {
  idle: { x: 0 },
  shake: { x: [0, -6, 6, -4, 4, -2, 2, 0], transition: { duration: 0.5, ease: "easeInOut" } },
};
