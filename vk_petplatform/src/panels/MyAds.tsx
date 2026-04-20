import { FC, useEffect, useState } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Placeholder,
  Button,
  Group,
  PanelSpinner,
  NavIdProps,
} from '@vkontakte/vkui';
import { Icon56ListOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

const API_URL = 'http://localhost:3000/api';

export const MyAds: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyAds() {
      try {
        const search = window.location.search;
        const response = await fetch(`${API_URL}/ads/my`, {
          headers: {
            'x-vk-sign': search.slice(1),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAds(data);
        }
      } catch (error) {
        console.error('Failed to fetch my ads:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMyAds();
  }, []);

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        Мои объявления
      </PanelHeader>

      {loading ? (
        <PanelSpinner size="large" />
      ) : ads.length === 0 ? (
        <Placeholder
          icon={<Icon56ListOutline />}
          header="У вас пока нет объявлений"
          action={
            <Button size="m" onClick={() => console.log('Create Ad Clicked')}>
              Добавить объявление
            </Button>
          }
        >
          Здесь будут отображаться ваши объявления о поиске или пристройстве животных. 
          Начните помогать прямо сейчас!
        </Placeholder>
      ) : (
        <Group>
          {/* Здесь будет список объявлений, когда они появятся */}
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--vkui--color_text_secondary)' }}>
             У вас {ads.length} объявлений (список в разработке)
          </div>
        </Group>
      )}
    </Panel>
  );
};
