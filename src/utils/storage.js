import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cashflow_state';

export const saveState = async (state) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
};

export const loadState = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load state', e);
    return null;
  }
};
