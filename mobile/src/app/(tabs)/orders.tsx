import { useQuery } from '@tanstack/react-query';
import type { WorkOrderStatus } from '@autoservice-app/contracts';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { OrderCard, StateBlock } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import {
  canCreateOrders,
  getApiErrorMessage,
  roleLabels,
  stoQueryKeys,
  useStoMe,
  workOrderStatusLabels,
  workOrderStatuses,
} from '@/lib/sto';

export default function OrdersScreen() {
  const auth = useAuth();
  const router = useRouter();
  const colors = useTheme();
  const stoMe = useStoMe();
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [status, setStatus] = useState<WorkOrderStatus | undefined>();

  const filters = useMemo(() => ({ search: activeSearch || undefined, status }), [activeSearch, status]);
  const orders = useQuery({
    queryKey: stoQueryKeys.orders(filters),
    enabled: auth.isAuthenticated && stoMe.isSuccess,
    queryFn: () => auth.api.listWorkOrders(filters),
  });
  const refreshing = stoMe.isRefetching || orders.isRefetching;

  if (stoMe.isPending) {
    return <StateBlock title="Загружаем профиль СТО" description="Проверяем роль и доступ к заказам." />;
  }

  if (stoMe.isError) {
    return (
      <StateBlock
        title="Нет доступа к СТО"
        description={getApiErrorMessage(stoMe.error)}
        actionLabel="Повторить"
        onAction={() => void stoMe.refetch()}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.backgroundElement }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Typography variant="h2" weight="800">
              Заказы
            </Typography>
            <Typography muted variant="bodySm">
              {stoMe.data.staffProfile.fullName ?? auth.user?.email} · {roleLabels[stoMe.data.role]}
            </Typography>
          </View>
          <Button
            disabled={!canCreateOrders(stoMe.data.role)}
            size="sm"
            variant={canCreateOrders(stoMe.data.role) ? 'default' : 'outline'}
            onPress={() => router.push('/orders/new')}>
            Создать
          </Button>
        </View>

        <View style={styles.searchRow}>
          <Input
            value={search}
            autoCapitalize="none"
            placeholder="Номер, VIN, госномер, клиент"
            returnKeyType="search"
            style={styles.searchInput}
            onChangeText={setSearch}
            onSubmitEditing={() => setActiveSearch(search.trim())}
          />
          <Button variant="outline" onPress={() => setActiveSearch(search.trim())}>
            Найти
          </Button>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Button size="sm" variant={status ? 'outline' : 'default'} onPress={() => setStatus(undefined)}>
            Все
          </Button>
          {workOrderStatuses.map((nextStatus) => (
            <Button
              key={nextStatus}
              size="sm"
              variant={status === nextStatus ? 'default' : 'outline'}
              onPress={() => setStatus(nextStatus)}>
              {workOrderStatusLabels[nextStatus]}
            </Button>
          ))}
        </ScrollView>
      </View>

      {orders.isError ? (
        <StateBlock
          title="Заказы не загрузились"
          description={getApiErrorMessage(orders.error)}
          actionLabel="Повторить"
          onAction={() => void orders.refetch()}
        />
      ) : (
        <FlatList
          data={orders.data?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void stoMe.refetch();
                void orders.refetch();
              }}
            />
          }
          ListEmptyComponent={
            orders.isPending ? (
              <StateBlock title="Загружаем заказы" />
            ) : (
              <StateBlock title="Заказов нет" description="Измени фильтр или создай новый заказ." />
            )
          }
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    padding: Spacing.three,
    paddingTop: Spacing.five,
  },
  listContent: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  screen: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
