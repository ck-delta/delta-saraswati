"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { fadeInUp, scaleIn, staggerContainer, staggerContainerFast, staggerSections, modalOverlay, modalContent, dropdownMenu } from "./variants";

interface AnimatedProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export function AnimatedPage({ children, ...props }: AnimatedProps) {
  return (
    <motion.div variants={staggerSections} initial="hidden" animate="visible" {...props}>
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, ...props }: AnimatedProps) {
  return (
    <motion.section variants={fadeInUp} {...props}>
      {children}
    </motion.section>
  );
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedProps & { enableHover?: boolean }>(
  ({ children, enableHover = true, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={scaleIn}
      whileHover={enableHover ? { y: -2, borderColor: "rgba(245,158,11,0.3)", boxShadow: "0 0 20px rgba(245,158,11,0.06)", transition: { duration: 0.2 } } : undefined}
      whileTap={enableHover ? { scale: 0.99 } : undefined}
      layout
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedCard.displayName = "AnimatedCard";

export function AnimatedList({ children, fast = false, ...props }: { children: ReactNode; fast?: boolean } & HTMLMotionProps<"div">) {
  return (
    <motion.div variants={fast ? staggerContainerFast : staggerContainer} initial="hidden" animate="visible" {...props}>
      {children}
    </motion.div>
  );
}

export function AnimatedListItem({ children, ...props }: AnimatedProps) {
  return (
    <motion.div variants={fadeInUp} {...props}>
      {children}
    </motion.div>
  );
}

export function AnimatedModal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" variants={modalOverlay} initial="hidden" animate="visible" exit="exit" onClick={onClose} />
          <motion.div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2" variants={modalContent} initial="hidden" animate="visible" exit="exit">
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AnimatedDropdown({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div variants={dropdownMenu} initial="hidden" animate="visible" exit="exit">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
