import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, InlineMessage } from '@/src/components/Banner';
import { useConvertAndDownload } from '@/src/features/convert/useConvertAndDownload';
import { ConvertStepCard } from '@/src/features/convert/components/ConvertStepCard';
import { DownloadsStepCard } from '@/src/features/convert/components/DownloadsStepCard';

export default function HomeScreen() {
  const {
    url,
    setUrl,
    resetAll,
    clearPreview,
    message,
    lastFilename,
    previewStatus,
    previewData,
    canConvert,
    convertAndDownload,
    requestPreview,
    openAndroidDownloads,
    isConverting,
  } = useConvertAndDownload();

  const canViewDownloads = Boolean(lastFilename);
  const mode = canViewDownloads ? 'downloads' : 'convert';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      <View className="flex-1 justify-start px-5 pt-12">
        <Text className="mb-2 text-2xl font-bold text-black">YouTube 影片 轉 MP3 音樂</Text>

        <Text className="mb-2 text-xs text-neutral-600">
          貼上 YouTube 影片連結，即可將 MP3 音樂下載到你的手機。
        </Text>

        <Button
          variant="secondary"
          pressOpacity={0.85}
          pressOpacityDurationMs={100}
          className="rounded-xl bg-amber-100 active:bg-amber-100"
          onPress={() => router.push('/tutorial')}>
          <Text className="font-bold text-amber-700 hover:text-amber-800">
            如何複製 YouTube 影片連結？
          </Text>
        </Button>

        {mode === 'convert' ? (
          <>
            <StepHeader title="貼上影片連結，下載 MP3 音樂" className="mt-8" />

            <ConvertStepCard
              url={url}
              setUrl={setUrl}
              previewStatus={previewStatus}
              previewData={previewData}
              canConvert={canConvert}
              isConverting={isConverting}
              onRequestPreview={requestPreview}
              onConvertAndDownload={convertAndDownload}
              onResetToPaste={() => {
                setUrl('');
                clearPreview();
              }}
            />
          </>
        ) : (
          <>
            <StepHeader title="完成！查看已下載的檔案" className="mt-8" />

            <Banner title="下載完成" message={lastFilename ? `${lastFilename}` : '已下載完成。'} />

            <DownloadsStepCard onOpenDownloads={openAndroidDownloads} onConvertAnother={resetAll} />
          </>
        )}

        {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
      </View>
    </SafeAreaView>
  );
}

function StepHeader({ title, className }: { title: string; className?: string }) {
  return (
    <View className={['flex-row items-baseline gap-2', className].filter(Boolean).join(' ')}>
      <Text className="text-lg font-bold text-blue-500">{title}</Text>
    </View>
  );
}
