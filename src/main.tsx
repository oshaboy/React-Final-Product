
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { downloadFirebase, syncFirebase } from './firebase_nonsense.ts';


ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
