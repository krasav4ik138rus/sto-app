import { KeyValueCard } from '@/components/key-value-card';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { getApiErrorMessage, roleLabels, useStoMe } from '@/lib/sto';

export default function ProfileScreen() {
  const auth = useAuth();
  const stoMe = useStoMe();

  if (!auth.user) return null;

  return (
    <Screen scroll>
      <PageHeader
        eyebrow="Профиль"
        title={stoMe.data?.staffProfile.fullName ?? auth.user.displayName ?? 'Сотрудник'}
        description={auth.user.email}
      />

      <KeyValueCard label="Email" value={auth.user.email} />
      <KeyValueCard label="Роль" value={stoMe.data ? roleLabels[stoMe.data.role] : 'Загрузка'} />
      <KeyValueCard label="Организация" value={stoMe.data?.organization.name ?? '—'} />
      <KeyValueCard label="Сервисный центр" value={stoMe.data?.serviceCenter?.name ?? 'Все центры'} />

      {stoMe.isError ? <KeyValueCard label="STO context" value={getApiErrorMessage(stoMe.error)} /> : null}

      <Button variant="outline" onPress={() => void auth.logout()}>
        Выйти
      </Button>
    </Screen>
  );
}
