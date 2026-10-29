import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { followIOSTextSize } from './lib/textSize'

followIOSTextSize();

createRoot(document.getElementById("root")!).render(<App />);
