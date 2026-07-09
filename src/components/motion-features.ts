// Async LazyMotion feature bundle — imported dynamically by MotionProvider so
// framer-motion's ~25KB-gzip animation runtime code-splits out of the critical
// chunk graph (statically importing domAnimation defeats LazyMotion entirely).
export { domAnimation as default } from "framer-motion";
