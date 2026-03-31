export interface MessengerService {
  id: string
  name: string
  url: string
  color: string
  emoji: string
}

export const SERVICES: MessengerService[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    color: '#25d366',
    emoji: '\u{1F4AC}',
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    url: 'https://web.whatsapp.com',
    color: '#128c7e',
    emoji: '\u{1F3E2}',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    url: 'https://web.telegram.org/a/',
    color: '#2AABEE',
    emoji: '\u{2708}\u{FE0F}',
  },
  {
    id: 'signal',
    name: 'Signal',
    url: 'https://app.signal.org',
    color: '#3A76F0',
    emoji: '\u{1F512}',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    url: 'https://www.messenger.com',
    color: '#0099FF',
    emoji: '\u{26A1}',
  },
  {
    id: 'discord',
    name: 'Discord',
    url: 'https://discord.com/app',
    color: '#5865F2',
    emoji: '\u{1F3AE}',
  },
  {
    id: 'slack',
    name: 'Slack',
    url: 'https://app.slack.com',
    color: '#4A154B',
    emoji: '\u{1F537}',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    url: 'https://teams.microsoft.com',
    color: '#6264A7',
    emoji: '\u{1F535}',
  },
]

export function getServiceById(id: string): MessengerService | undefined {
  return SERVICES.find(s => s.id === id)
}
