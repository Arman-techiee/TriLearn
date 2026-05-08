import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return unsubscribe;
  }, []);

  if (isConnected !== false) {
    return null;
  }

  return (
    <View
      className="w-full px-4 py-2"
      style={{ backgroundColor: '#FEF3C7', borderBottomColor: '#F59E0B', borderBottomWidth: 1 }}
    >
      <Text className="text-sm" style={{ color: '#92400E' }}>
        No internet connection — showing cached data
      </Text>
    </View>
  );
}
