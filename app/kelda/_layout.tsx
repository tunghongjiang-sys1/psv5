import React, { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { keldaState } from '../../lib/keldaState';

export default function KeldaLayout() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && pathname.startsWith('/kelda/')) {
      keldaState.setLastRoute(pathname);
    }
  }, [pathname]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
