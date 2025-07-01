import Layout from '@/components/Layout';
import '@/styles/globals.css'; // ✅ Second: Your Tailwind styles (important!)
import { Toaster } from 'react-hot-toast';


export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </Layout>
  );
}
