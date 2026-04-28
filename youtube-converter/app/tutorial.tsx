import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TutorialScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      <View className="flex-1 px-5 pt-4">
        <Text className="mt-2 text-sm text-neutral-600">
          依照下面步驟複製 YouTube 影片連結，回到主畫面貼上即可下載 MP3。
        </Text>

        <ScrollView
          className="mt-4"
          contentContainerClassName="gap-4 pb-10"
          showsVerticalScrollIndicator={false}>
          <View className="rounded-2xl border border-neutral-200 bg-white p-3">
            <Text className="mb-2 text-base font-semibold text-neutral-800">步驟 1：按「分享」</Text>
            <Image
              source={require('@/assets/tutorial/1.jpg')}
              resizeMode="contain"
              className="h-80 w-full self-center rounded-xl"
            />
          </View>

          <View className="rounded-2xl border border-neutral-200 bg-white p-3">
            <Text className="mb-2 text-base font-semibold text-neutral-800">步驟 2：按「複製連結」</Text>
            <Image
              source={require('@/assets/tutorial/2.jpg')}
              resizeMode="contain"
              className="h-80 w-full self-center rounded-xl"
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
