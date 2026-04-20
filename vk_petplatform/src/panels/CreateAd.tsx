import { FC, useState } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  FormLayout,
  FormItem,
  Textarea,
  Button,
  Div,
  NavIdProps,
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

export const CreateAd: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const [text, setText] = useState('');

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        Создать объявление
      </PanelHeader>

      <FormLayout>
        <FormItem 
          top="Текст объявления" 
          status={text.length > 0 ? 'valid' : 'default'}
          bottom={text.length > 0 ? '' : 'Пожалуйста, опишите ситуацию'}
        >
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Напишите здесь всё, что считаете нужным..."
            rows={10}
          />
        </FormItem>

        <Div>
          <Button 
            size="l" 
            stretched 
            disabled={text.length === 0}
            onClick={() => {
              console.log('Publishing text:', text);
              alert('Объявление записано в консоль (логика отправки будет позже)');
            }}
          >
            Опубликовать
          </Button>
        </Div>
      </FormLayout>
    </Panel>
  );
};
