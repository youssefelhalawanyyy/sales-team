import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create root early for faster initial render
const root = ReactDOM.createRoot(document.getElementById('root'));

// Use startTransition for non-urgent updates
React.startTransition(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// Report vitals asynchronously to avoid blocking render
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => {
    reportWebVitals();
  });
} else {
  setTimeout(() => {
    reportWebVitals();
  }, 2000);
}
