import { FC, useEffect, useState } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  SimpleCell,
  NavIdProps,
  CardGrid,
  ContentCard,
  PanelSpinner,
  Header,
  Button,
} from '@vkontakte/vkui';
import { Icon28UserOutline, Icon28ListOutline, Icon28AddOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { getAllAds } from '../shared/api';
import { DEFAULT_VIEW_PANELS } from '../routes';

export interface HomeProps extends NavIdProps {}

export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAds() {
      try {
        const data = await getAllAds();
        setAds(data);
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAds();
  }, []);

  return (
    <Panel id={id}>
      <PanelHeader 
        before={<PanelHeaderBack onClick={() => window.history.back()} />}
      >
        Главная
      </PanelHeader>

      <Group>
        <SimpleCell
          before={<Icon28UserOutline />}
          onClick={() => routeNavigator.push('/profile')}
        >
          Мой профиль
        </SimpleCell>
        <SimpleCell
          before={<Icon28ListOutline />}
          onClick={() => routeNavigator.push('/my_ads')}
        >
          Мои объявления
        </SimpleCell>
      </Group>

      <Group header={
        <Header 
          mode="secondary" 
          aside={
            <Button 
              size="s" 
              mode="tertiary" 
              before={<Icon28AddOutline width={20} height={20} />}
              onClick={() => routeNavigator.push(`/${DEFAULT_VIEW_PANELS.CREATE_AD}`)}
            >
              Добавить
            </Button>
          }
        >
          Лента объявлений
        </Header>
      }>
        {loading ? (
          <PanelSpinner size="l" />
        ) : (
          <CardGrid size="l">
            {ads.map((ad) => (
              <ContentCard
                key={ad.id}
                onClick={() => routeNavigator.push(`/${DEFAULT_VIEW_PANELS.AD_DETAIL}/${ad.id}`)}
                subtitle={
                  ad.type === 'LOST' ? 'Пропал питомец' : 
                  ad.type === 'FOUND' ? 'Найден питомец' : 'Пристройство'
                }
                header={ad.title}
                text={ad.description}
                caption={new Date(ad.createdAt).toLocaleDateString('ru-RU')}
                maxHeight={250}
                image={ad.photoUrl || undefined}
              />
            ))}
          </CardGrid>
        )}
      </Group>
    </Panel>
  );
};
