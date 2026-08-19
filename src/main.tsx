import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './contexts/DataContext';

// --- Robust Global LocalStorage Interceptor for Supabase ---
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);
const originalClear = localStorage.clear.bind(localStorage);

(window as any).__originalSetItem = originalSetItem;
(window as any).__originalRemoveItem = originalRemoveItem;

// Debounce map for batching rapid updates per storage key
const syncTimeouts: Record<string, any> = {};

localStorage.setItem = function (key, value) {
  originalSetItem(key, value);
  
  // Skip if currently hydrating from Supabase to prevent cyclic updates
  if ((window as any).__IS_HYDRATING_FROM_SUPABASE) return;

  // Ignore internal noise keys if any
  if (!key || key.startsWith('__vite') || key.startsWith('chakra') || key.startsWith('react-aria')) return;

  try {
    let parsedValue = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }

    if (syncTimeouts[key]) {
      clearTimeout(syncTimeouts[key]);
    }

    syncTimeouts[key] = setTimeout(() => {
      delete syncTimeouts[key];
      import('./lib/supabaseClient').then(async ({ syncStateToSupabase }) => {
        await syncStateToSupabase(key, parsedValue);
      }).catch(err => {
        console.warn('Background Supabase sync failed:', err);
      });
    }, 150);
  } catch (e) {
    console.warn('Supabase sync preparation error:', e);
  }
};

localStorage.removeItem = function (key) {
  originalRemoveItem(key);
  if ((window as any).__IS_HYDRATING_FROM_SUPABASE) return;
  
  if (syncTimeouts[key]) {
    clearTimeout(syncTimeouts[key]);
    delete syncTimeouts[key];
  }

  try {
    import('./lib/supabaseClient').then(async ({ deleteStateFromSupabase }) => {
      await deleteStateFromSupabase(key);
    }).catch(err => {
      console.warn('Background Supabase delete failed:', err);
    });
  } catch (e) {
    console.warn('Supabase delete error:', e);
  }
};

localStorage.clear = function () {
  originalClear();
};
// ----------------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
);
