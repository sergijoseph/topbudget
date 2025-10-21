import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from "react-redux";
import { authStore } from './store/authStore';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Provider store={authStore}>
        <App />
      </Provider>
  </StrictMode>,
)
