import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'dns'

// Custom DNS Resolver fallback for systems with broken DNS/routers
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  if (hostname.includes('supabase.co')) {
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || !addresses.length) {
        return originalLookup(hostname, options, callback);
      }
      
      const family = 4;
      if (options.all) {
        const results = addresses.map(addr => ({ address: addr, family }));
        callback(null, results);
      } else {
        callback(null, addresses[0], family);
      }
    });
  } else {
    originalLookup(hostname, options, callback);
  }
};

// Set public DNS fallback servers (Google DNS and Cloudflare DNS)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Failed to set custom DNS servers:', e);
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/supabase-api': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase-api/, '')
        }
      }
    }
  }
})
