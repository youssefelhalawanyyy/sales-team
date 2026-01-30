import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Report vitals asynchronously to avoid blocking render
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => {
    reportWebVitals();
  });
} else {
  setTimeout(() => {
    reportWebVitals();
  }, 1000);
}
