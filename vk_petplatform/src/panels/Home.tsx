import { FC } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Header,
  Group,
  SimpleCell,
  Button,
  Box,
  NavIdProps,
} from '@vkontakte/vkui';
import { Icon28UserOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
}

export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => window.history.back()} />}>
        Главная
      </PanelHeader>
      <Group>
        <SimpleCell
          before={<Icon28UserOutline />}
          onClick={() => routeNavigator.push('profile')}
        >
          Мой профиль
        </SimpleCell>
      </Group>
      <Group header={<Header size="s">Navigation Example</Header>}>
        <Box padding="m">
          <Button stretched size="l" mode="secondary" onClick={() => routeNavigator.push('persik')}>
            Покажите Персика, пожалуйста!
          </Button>
        </Box>
      </Group>
    </Panel>
  );
};
