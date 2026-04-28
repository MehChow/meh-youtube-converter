import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export function Banner({ title, message }: { title: string; message?: string }) {
  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ecfdf5',
      }}>
      <Text className="text-lg font-semibold" style={{ color: '#047857' }}>
        {title}
      </Text>
      {message ? (
        <Text className="mt-1 text-sm" style={{ color: '#047857' }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export function InlineMessage({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'error';
  children: React.ReactNode;
}) {
  return (
    <Text
      className={cn(
        'mt-3 px-1 text-sm font-semibold',
        tone === 'error' ? 'text-red-600' : 'text-neutral-700'
      )}>
      {children}
    </Text>
  );
}
