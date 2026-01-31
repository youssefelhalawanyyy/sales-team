import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Skip StrictMode in production for faster renders
const AppComponent = process.env.NODE_ENV === 'production' ? 
  <App /> : 
  <React.StrictMode><App /></React.StrictMode>;

root.render(AppComponent);

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
