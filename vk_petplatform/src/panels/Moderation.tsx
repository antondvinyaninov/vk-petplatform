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
} from '@vkontakte/vkui';
import { 
  Icon56CheckShieldOutline, 
  Icon24CheckCircleOutline, 
  Icon24CancelOutline 
} from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { getAllAds } from '../shared/api';

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

  const handleAction = (adId: number, action: 'approve' | 'reject') => {
    console.log(`Ad ${adId} ${action}ed`);
    // В будущем здесь будет вызов API для смены статуса
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
                    {ad.description}
                    <ButtonGroup mode="horizontal" gap="s" stretched style={{ marginTop: 12 }}>
                      <Button 
                        size="s" 
                        mode="primary" 
                        appearance="positive"
                        before={<Icon24CheckCircleOutline width={16} height={16} />}
                        onClick={() => handleAction(ad.id, 'approve')}
                        stretched
                      >
                        Одобрить
                      </Button>
                      <Button 
                        size="s" 
                        mode="secondary" 
                        appearance="negative"
                        before={<Icon24CancelOutline width={16} height={16} />}
                        onClick={() => handleAction(ad.id, 'reject')}
                        stretched
                      >
                        Отклонить
                      </Button>
                    </ButtonGroup>
                  </>
                }
                maxHeight={250}
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
