import { Toaster } from 'react-hot-toast';

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #6dd5ed, #2193b0)',
          color: '#fff',
          borderRadius: '12px',
          padding: '14px 18px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          fontSize: '15px',
        },
        success: {
          iconTheme: {
            primary: '#4ade80',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            background: 'linear-gradient(135deg, #ff758c, #ff7eb3)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ff3e3e',
          },
        },
      }}
    />
  );
}