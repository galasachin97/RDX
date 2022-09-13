const transition = { duration: 0.8, ease: "easeInOut" };
export const container = {
  hidden: { opacity: 0, scale: 0, y: 100 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
  exit: { x: "-100%", opacity: 0, transition },
};

export const parentContainer = {
  hidden: { opacity: 0, x: "100%" },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
      // duration: 1,
      ease: "easeInOut",
    },
  },
  exit: { x: "-100%", opacity: 0, transition },
};

export const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export const xMotion = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
  },
};

export const homeMotion = {
  hidden: { y: "-100vh" },
  visible: {
    y: 0,
    transition: { duration: 1.2, ease: "easeInOut" },
  },
};

export const homeMotion2 = {
  hidden: { y: "0" },
  visible: {
    y: 0,
    transition: { duration: 1.2, ease: "easeInOut" },
  },
};
