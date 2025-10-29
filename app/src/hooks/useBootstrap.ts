import { useEffect, useState } from "react";

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export const useBootstrap = () => {
  const [isHydrated, setHydrated] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      // Placeholder for loading persisted auth tokens or preferences.
      await Promise.resolve();
      if (isMounted) {
        setHydrated(true);
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isReady: fontsLoaded && isHydrated };
};
