import { defineConfig } from 'vite';
export default defineConfig({ base: './', server: { port: 5173, strictPort: true }, build:{rollupOptions:{input:{main:'index.html',molecularAll:'molecular-lab-v0683.html',molecular:'molecular-lab-v0673.html',molecularNext:'molecular-lab-v0674.html',molecularCetaceans:'molecular-lab-v0675.html'},output:{manualChunks:{'three-core':['three']}}}} });
