import { Tabs as RouterTabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/components/ui/typography';
import { TEST_IDS } from '@/constants/testIds';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + Math.max(insets.bottom, Spacing.two);

  return (
    <RouterTabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.text,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.backgroundElement,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, Spacing.two),
          },
        ],
      }}>
      <RouterTabs.Screen
        name="orders"
        options={{
          title: 'Заказы',
          tabBarLabel: ({ color }) => (
            <Typography colorValue={color} variant="caption" weight="700">
              Заказы
            </Typography>
          ),
          tabBarButtonTestID: TEST_IDS.tabs.componentsTab,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'list.bullet.rectangle.fill', android: 'assignment', web: 'assignment' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <RouterTabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarLabel: ({ color }) => (
            <Typography colorValue={color} variant="caption" weight="700">
              Профиль
            </Typography>
          ),
          tabBarButtonTestID: TEST_IDS.tabs.profileTab,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <RouterTabs.Screen name="components" options={{ href: null }} />
    </RouterTabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    paddingTop: Spacing.two,
    shadowOpacity: 0,
  },
  tabBarItem: {
    paddingVertical: Spacing.one,
  },
});
