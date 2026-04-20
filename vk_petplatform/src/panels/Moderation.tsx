import { FC, useEffect, useState } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Group,
  Header,
  CardGrid,
  ContentCard,
  PanelSpinner,
  Placeholder,
  Button,
  NavIdProps,
  ButtonGroup,
  Div,
} from '@vkontakte/vkui';
import { 
  Icon56CheckShieldOutline, 
  Icon24CheckCircleOutline, 
  Icon24CancelOutline 
} from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { getAllAds } from '../shared/api';
import { DEFAULT_VIEW_PANELS } from '../routes';

export const Moderation: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdsForModeration() {
      try {
        const data = await getAllAds();
        setAds(data);
      } catch (error) {
        console.error('Failed to fetch ads for moderation:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdsForModeration();
  }, []);

  const openApproveModal = (adId: number) => {
    // Открываем модальное окно через push, чтобы передать ID в URL
    routeNavigator.push(`/${DEFAULT_VIEW_PANELS.MODERATION}/approve_settings/${adId}`);
  };

  const handleReject = (adId: number) => {
    console.log(`Ad ${adId} rejected`);
    setAds(prev => prev.filter(a => a.id !== adId));
  };

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        Модерация
      </PanelHeader>

      <Group header={<Header>Предложенные объявления</Header>}>
        {loading ? (
          <PanelSpinner size="l" />
        ) : ads.length === 0 ? (
          <Placeholder
            icon={<Icon56CheckShieldOutline />}
            title="Очередь пуста"
          >
            Все объявления проверены. Отличная работа!
          </Placeholder>
        ) : (
          <CardGrid size="l">
            {ads.map((ad) => (
              <ContentCard
                key={ad.id}
                caption={
                  ad.type === 'LOST' ? 'Пропал питомец' : 
                  ad.type === 'FOUND' ? 'Найден питомец' : 'Пристройство'
                }
                title={ad.title}
                description={
                  <>
                    <Div style={{ padding: 0, marginBottom: 8 }}>{ad.description}</Div>
                    <ButtonGroup mode="horizontal" gap="s" stretched>
                      <Button 
                        size="s" 
                        mode="primary" 
                        appearance="positive"
                        before={<Icon24CheckCircleOutline width={16} height={16} />}
                        onClick={() => openApproveModal(ad.id)}
                        stretched
                      >
                        Одобрить
                      </Button>
                      <Button 
                        size="s" 
                        mode="secondary" 
                        appearance="negative"
                        before={<Icon24CancelOutline width={16} height={16} />}
                        onClick={() => handleReject(ad.id)}
                        stretched
                      >
                        Отклонить
                      </Button>
                    </ButtonGroup>
                  </>
                }
                maxHeight={300}
                src={ad.photoUrl || undefined}
              />
            ))}
          </CardGrid>
        )}
      </Group>
    </Panel>
  );
};

export default Moderation;
