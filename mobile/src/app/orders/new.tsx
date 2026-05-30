import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWorkOrderInput } from '@autoservice-app/contracts';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { StateBlock } from '@/components/sto-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { canCreateOrders, getApiErrorMessage, stoQueryKeys, useStoMe } from '@/lib/sto';

export default function NewOrderScreen() {
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const stoMe = useStoMe();
  const [number, setNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [vin, setVin] = useState('');
  const [plate, setPlate] = useState('');
  const [engineSpec, setEngineSpec] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [visitReason, setVisitReason] = useState('');

  const customers = useQuery({
    queryKey: stoQueryKeys.customers(''),
    enabled: stoMe.isSuccess,
    queryFn: () => auth.api.listCustomers({ limit: 20, sort: 'name_asc' }),
  });
  const vehicles = useQuery({
    queryKey: stoQueryKeys.vehicles('', selectedCustomerId),
    enabled: stoMe.isSuccess,
    queryFn: () => auth.api.listVehicles({ limit: 20, customerId: selectedCustomerId ?? undefined }),
  });

  const buildCreateOrderInput = (): CreateWorkOrderInput => {
    const parsedMileage = parseOptionalNonNegativeInt(mileage, 'Пробег');
    const parsedYear = parseOptionalYear(year);
    const vehicleBrandModel = brandModel.trim();

    if (!selectedVehicleId && !vehicleBrandModel) {
      throw new Error('Укажите марку и модель автомобиля.');
    }

    return {
        ...(number.trim() ? { number: number.trim() } : {}),
        ...(selectedCustomerId
          ? { customerId: selectedCustomerId }
          : customerName.trim() || customerPhone.trim()
            ? { customer: { name: customerName.trim() || undefined, phone: customerPhone.trim() || undefined } }
            : {}),
        ...(selectedVehicleId
          ? { vehicleId: selectedVehicleId }
          : {
              vehicle: {
                brandModel: vehicleBrandModel,
                vin: vin.trim() || undefined,
                plate: plate.trim() || undefined,
                engineSpec: engineSpec.trim() || undefined,
                year: parsedYear,
                currentMileage: parsedMileage,
              },
            }),
        mileage: parsedMileage,
        visitReason: visitReason.trim() || undefined,
      };
  };

  const createOrder = useMutation({
    mutationFn: () => auth.api.createWorkOrder(buildCreateOrderInput()),
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: ['sto', 'orders'] });
      Alert.alert('Заказ создан', order.number);
      router.replace(`/orders/${order.id}` as Href);
    },
    onError: (error) => {
      Alert.alert('Не удалось создать заказ', getApiErrorMessage(error));
    },
  });

  if (stoMe.isPending) return <StateBlock title="Проверяем роль" />;
  if (stoMe.isError) {
    return <StateBlock title="Нет доступа" description={getApiErrorMessage(stoMe.error)} />;
  }
  if (!canCreateOrders(stoMe.data.role)) {
    return (
      <Screen backButton="auto" backFallbackHref="/orders" centered>
        <StateBlock title="Создание недоступно" description="Механик пока не создает заказ-наряды в этом сценарии." />
      </Screen>
    );
  }

  return (
    <Screen
      backButton="auto"
      backFallbackHref="/orders"
      keyboardAvoiding
      scroll
      scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <Typography variant="h2" weight="800">
        Новый заказ
      </Typography>

      <Field label="Номер заказ-наряда">
        <Input value={number} placeholder="Можно оставить пустым" onChangeText={setNumber} />
      </Field>

      <Section title="Клиент">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
          <Button
            size="sm"
            variant={selectedCustomerId === null ? 'default' : 'outline'}
            onPress={() => setSelectedCustomerId(null)}>
            Новый
          </Button>
          {(customers.data?.items ?? []).map((customer) => (
            <Button
              key={customer.id}
              size="sm"
              variant={selectedCustomerId === customer.id ? 'default' : 'outline'}
              onPress={() => setSelectedCustomerId(customer.id)}>
              {customer.name ?? customer.phone ?? 'Клиент'}
            </Button>
          ))}
        </ScrollView>
        {!selectedCustomerId ? (
          <>
            <Input value={customerName} placeholder="Имя клиента" onChangeText={setCustomerName} />
            <Input value={customerPhone} keyboardType="phone-pad" placeholder="Телефон" onChangeText={setCustomerPhone} />
          </>
        ) : null}
      </Section>

      <Section title="Автомобиль">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
          <Button
            size="sm"
            variant={selectedVehicleId === null ? 'default' : 'outline'}
            onPress={() => setSelectedVehicleId(null)}>
            Новый
          </Button>
          {(vehicles.data?.items ?? []).map((vehicle) => (
            <Button
              key={vehicle.id}
              size="sm"
              variant={selectedVehicleId === vehicle.id ? 'default' : 'outline'}
              onPress={() => setSelectedVehicleId(vehicle.id)}>
              {vehicle.brandModel}
            </Button>
          ))}
        </ScrollView>
        {!selectedVehicleId ? (
          <>
            <Input value={brandModel} placeholder="Марка и модель" onChangeText={setBrandModel} />
            <Input value={vin} autoCapitalize="characters" placeholder="VIN" onChangeText={setVin} />
            <Input value={plate} autoCapitalize="characters" placeholder="Госномер" onChangeText={setPlate} />
            <Input value={engineSpec} placeholder="Двигатель" onChangeText={setEngineSpec} />
            <Input value={year} keyboardType="number-pad" placeholder="Год" onChangeText={setYear} />
          </>
        ) : null}
      </Section>

      <Field label="Пробег">
        <Input value={mileage} keyboardType="number-pad" placeholder="Например 153000" onChangeText={setMileage} />
      </Field>

      <Field label="Причина обращения">
        <Input value={visitReason} multiline placeholder="Описание работ или жалоба" onChangeText={setVisitReason} />
      </Field>

      <Button
        disabled={createOrder.isPending || (!selectedVehicleId && !brandModel.trim())}
        loading={createOrder.isPending}
        onPress={() => createOrder.mutate()}>
        Создать заказ
      </Button>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Typography variant="h4" weight="700">
        {title}
      </Typography>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Typography variant="label" weight="700">
        {label}
      </Typography>
      {children}
    </View>
  );
}

function parseOptionalNonNegativeInt(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${label}: укажите целое число без пробелов и букв.`);
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${label}: число должно быть не меньше 0.`);
  }
  return parsed;
}

function parseOptionalYear(value: string) {
  const parsed = parseOptionalNonNegativeInt(value, 'Год');
  if (parsed === undefined) return undefined;
  if (parsed < 1886 || parsed > 2200) {
    throw new Error('Год: укажите значение от 1886 до 2200.');
  }
  return parsed;
}

const styles = StyleSheet.create({
  choiceRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  field: {
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
});
