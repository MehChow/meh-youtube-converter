import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Image, ScrollView, View } from 'react-native';

export default function TutorialScreen() {
  return (
    <View className="flex-1 px-5">
      <ScrollView
        className="pt-4"
        contentContainerClassName="gap-4 pb-10"
        showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-neutral-600">
          依照下面步驟複製 YouTube 影片連結，回到程式主頁貼上即可下載 MP3。
        </Text>

        <View className="rounded-2xl border border-neutral-200 bg-white p-3">
          <Text className="mb-2 text-base font-semibold text-neutral-800">步驟 1：按「分享」</Text>
          <Image
            source={require('@/assets/tutorial/1.jpg')}
            resizeMode="contain"
            className="h-80 w-full self-center rounded-xl"
          />
        </View>

        <View className="rounded-2xl border border-neutral-200 bg-white p-3">
          <Text className="mb-2 text-base font-semibold text-neutral-800">
            步驟 2：按「複製連結」
          </Text>
          <Image
            source={require('@/assets/tutorial/2.jpg')}
            resizeMode="contain"
            className="h-80 w-full self-center rounded-xl"
          />
        </View>

        <View className="rounded-2xl border border-neutral-200 bg-white p-3">
          <Text className="text-base font-semibold text-neutral-800">
            步驟 3：回到此程式主頁貼上連結
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
