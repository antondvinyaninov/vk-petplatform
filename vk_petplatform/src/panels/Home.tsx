import { FC } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Header,
  Group,
  Cell,
  SimpleCell,
  Avatar,
  Button,
  Box,
  NavIdProps,
} from '@vkontakte/vkui';
import { Icon28UserOutline } from '@vkontakte/icons';
import { UserInfo } from '@vkontakte/vk-bridge';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
}

export const Home: FC<HomeProps> = ({ id, fetchedUser }) => {
  const { photo_200, city, first_name, last_name } = { ...fetchedUser };
  const routeNavigator = useRouteNavigator();

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => window.history.back()} />}>
        Главная
      </PanelHeader>
      <Group header={<Header size="s">User Data Fetched with VK Bridge</Header>}>
        <Cell before={photo_200 && <Avatar src={photo_200} />} subtitle={city?.title}>
          {`${first_name} ${last_name}`}
        </Cell>
      </Group>
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
