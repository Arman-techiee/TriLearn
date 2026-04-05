import { Platform } from 'react-native'

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32
}

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999
}

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 20px 45px rgba(16, 37, 63, 0.12)'
    },
    default: {
      shadowColor: '#0B1726',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3
    }
  })
}
