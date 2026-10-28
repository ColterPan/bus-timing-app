import { FlatList } from 'react-native';
import { FavouriteCard } from '../../components/FavouriteCard';
import { StateView } from '../../components/StateView';
import { useScreenFocused } from '../../hooks/useScreenFocused';
import { useFavourites } from '../../store/FavouritesContext';

export default function FavouritesScreen() {
  const { favourites, ready } = useFavourites();
  const focused = useScreenFocused();

  if (!ready) return <StateView kind="loading" />;
  if (favourites.length === 0) {
    return (
      <StateView
        kind="empty"
        icon="star-outline"
        message={'No favourites yet.\nFind a stop in Nearby or Search, then tap the ☆ to add it here.'}
      />
    );
  }

  return (
    <FlatList
      data={favourites}
      keyExtractor={(f) => f.stopCode}
      renderItem={({ item }) => <FavouriteCard favourite={item} active={focused} />}
      contentContainerStyle={{ paddingVertical: 8 }}
    />
  );
}
