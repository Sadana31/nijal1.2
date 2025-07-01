import Sidebar from './Sidebar';
import { Toaster } from 'sonner';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />
      
      {/* Increase left margin if sidebar is wider or remove fixed margin */}
      <div className="ml-[90px] p-2 w-full max-w-9xl">
        {children}
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
