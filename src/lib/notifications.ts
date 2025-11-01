import { notifications } from '@mantine/notifications';

export const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
  const config = {
    title,
    message,
    autoClose: type === 'error' ? 5000 : 4000,
    withCloseButton: true,
    style: { marginTop: '60px' },
  };

  switch (type) {
    case 'success':
      notifications.show({
        ...config,
        color: 'green',
        icon: '✅',
      });
      break;
    case 'error':
      notifications.show({
        ...config,
        color: 'red',
        icon: '❌',
      });
      break;
    case 'warning':
      notifications.show({
        ...config,
        color: 'yellow',
        icon: '⚠️',
      });
      break;
    case 'info':
      notifications.show({
        ...config,
        color: 'blue',
        icon: 'ℹ️',
      });
      break;
  }
};