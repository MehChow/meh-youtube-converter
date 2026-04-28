import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { ActivityIndicator, Image, Keyboard, Pressable, TextInput, View } from 'react-native';

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

type PreviewData = {
  title: string;
  uploader: string;
  durationSeconds: number | null;
  webpageUrl: string;
  thumbnailUrl: string;
};

export function ConvertStepCard({
  url,
  setUrl,
  previewStatus,
  previewData,
  canConvert,
  isConverting,
  onRequestPreview,
  onConvertAndDownload,
  onResetToPaste,
}: {
  url: string;
  setUrl: (v: string) => void;
  previewStatus: PreviewStatus;
  previewData: PreviewData | null;
  canConvert: boolean;
  isConverting: boolean;
  onRequestPreview: () => void;
  onConvertAndDownload: () => void;
  onResetToPaste: () => void;
}) {
  const isLoading = isConverting || previewStatus === 'loading';
  const isReadyToDownload = previewStatus === 'ready';

  return (
    <View className="mt-2 rounded-2xl border border-neutral-200 bg-white p-4">
      {!isReadyToDownload ? (
        <>
          <Text className="text-sm text-neutral-700">先把 YouTube 影片連結貼到下面的欄位。</Text>

          <View className="relative mt-2">
            <TextInput
              className="h-12 rounded-xl border border-neutral-200 px-3 py-2 pr-16 text-base placeholder:text-neutral-300"
              placeholder=""
              autoCapitalize="none"
              autoCorrect={false}
              multiline={false}
              numberOfLines={1}
              value={url}
              onChangeText={setUrl}
            />
            {!url.trim().length ? (
              <View
                pointerEvents="none"
                className="absolute bottom-0 left-3 right-16 top-0 justify-center">
                <Text className="text-base text-neutral-300" numberOfLines={1}>
                  https://www.youtube.com/watch?v=...
                </Text>
              </View>
            ) : null}
            <Pressable
              disabled={!url.trim().length}
              onPress={() => setUrl('')}
              hitSlop={10}
              className={[
                'absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-neutral-100 p-2 active:bg-neutral-200',
                !url.trim().length ? 'opacity-40' : '',
              ].join(' ')}>
              <Text className="text-xs font-semibold text-neutral-700">清除</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {previewStatus === 'ready' && previewData ? (
        <View
          className={[
            isReadyToDownload ? 'mt-0' : 'mt-4',
            'overflow-hidden rounded-xl border border-neutral-200',
          ].join(' ')}>
          {previewData.thumbnailUrl ? (
            <Image
              source={{ uri: previewData.thumbnailUrl }}
              className="h-40 w-full bg-neutral-100"
              resizeMode="cover"
            />
          ) : (
            <View className="h-40 w-full items-center justify-center bg-neutral-100">
              <Text className="text-xs text-neutral-500">（沒有縮圖）</Text>
            </View>
          )}

          <View className="p-3">
            <Text className="text-sm font-bold text-neutral-900" numberOfLines={2}>
              {previewData.title || '（未提供標題）'}
            </Text>
            {previewData.uploader ? (
              <Text className="mt-1 text-xs text-neutral-600" numberOfLines={1}>
                {previewData.uploader}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <Text className="mt-4 text-sm text-neutral-700">
          再按
          <Text style={{ color: '#8c3dd1', fontWeight: '700' }}>「預覽」</Text>
          以查看影片縮圖與標題。
        </Text>
      )}

      <View className="mt-2">
        {isReadyToDownload ? (
          <Text style={{ paddingBottom: 8, paddingTop: 8 }}>
            確認無誤後再按
            <Text style={{ color: '#8c3dd1', fontWeight: '700' }}>「下載 MP3」</Text>。
          </Text>
        ) : null}

        <Button
          pressOpacity={0.8}
          pressOpacityDurationMs={140}
          className="rounded-xl active:bg-primary"
          disabled={!canConvert || isLoading}
          onPress={() => {
            Keyboard.dismiss();
            if (isReadyToDownload) onConvertAndDownload();
            else onRequestPreview();
          }}>
          {isLoading ? <ActivityIndicator color="#fff" /> : null}
          <Text style={{ fontWeight: '700' }}>
            {isConverting
              ? '下載中…'
              : previewStatus === 'loading'
                ? '讀取縮圖中…'
                : isReadyToDownload
                  ? '下載 MP3'
                  : '預覽'}
          </Text>
        </Button>
      </View>

      {isReadyToDownload && !isLoading ? (
        <View className="mt-2">
          <Button
            variant="secondary"
            className="rounded-xl"
            style={{
              backgroundColor: '#d9dede',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            onPress={() => {
              Keyboard.dismiss();
              onResetToPaste();
            }}>
            <Text style={{ color: '#374151', fontWeight: '700' }}>貼錯了？按這裡再貼一次</Text>
          </Button>
        </View>
      ) : null}
    </View>
  );
}
