import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = 'inbox', title, subtitle }: EmptyStateProps) {
  return (
    <View className="items-center justify-center">
      <Ionicons color="#9CA3AF" name={icon as keyof typeof Ionicons.glyphMap} size={48} />
      <Text className="mt-3 text-base font-medium text-gray-700">{title}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-gray-400">{subtitle}</Text> : null}
    </View>
  );
}
