import { useEffect } from 'react';
import { supabase } from 'Services/Supabase/client';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/login/personnel';

      // Ensure session is fetched so Supabase completes activation
      await supabase.auth.getSession();

      // Prevent automatic dashboard / must-change-password redirect
      await supabase.auth.signOut();

      window.location.replace(`${window.location.origin}/#${next}`);
    };

    handleCallback();
  }, []);

  return <p>Activating account...</p>;
}
