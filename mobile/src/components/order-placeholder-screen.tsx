import { useLocalSearchParams, type Href } from 'expo-router';

import { StateBlock } from '@/components/sto-ui';
import { Screen } from '@/components/screen';

export function PlaceholderOrderFeatureScreen({ title }: { title: string }) {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen backButton="auto" backFallbackHref={`/orders/${id}` as Href} centered>
      <StateBlock
        title={title}
        description="Следующий этап. Сейчас здесь будет подключена полноценная форма и сохранение в backend."
      />
    </Screen>
  );
}
