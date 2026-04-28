import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { View } from 'react-native';

export function DownloadsStepCard({
  onOpenDownloads,
  onConvertAnother,
}: {
  onOpenDownloads: () => void;
  onConvertAnother: () => void;
}) {
  return (
    <View className="mt-4">
      <View>
        <Button className="rounded-xl" onPress={onOpenDownloads}>
          <Text className="text-white">查看檔案</Text>
        </Button>
      </View>

      <View className="mt-3">
        <Button
          variant="secondary"
          pressOpacity={0.8}
          pressOpacityDurationMs={140}
          className="rounded-xl bg-blue-100 active:bg-blue-100"
          onPress={onConvertAnother}>
          <Text className="text-blue-700">再轉換一個</Text>
        </Button>
      </View>
    </View>
  );
}
