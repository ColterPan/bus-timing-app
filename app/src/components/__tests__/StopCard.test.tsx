import { fireEvent, render, screen } from '@testing-library/react-native';
import { StateView } from '../StateView';
import { StopCard } from '../StopCard';

const stop = { code: '83139', name: 'Blk 89', road: 'Joo Chiat Rd', lat: 1.31, lng: 103.9 };

describe('StopCard', () => {
  it('shows name, code, road and distance, and is pressable', async () => {
    const onPress = jest.fn();
    await render(<StopCard stop={stop} distance="56 m" onPress={onPress} />);

    expect(screen.getByText('Blk 89')).toBeOnTheScreen();
    expect(screen.getByText('83139 · Joo Chiat Rd')).toBeOnTheScreen();
    expect(screen.getByText('56 m')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Blk 89, Joo Chiat Rd, stop 83139, 56 m away' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('omits distance when not given', async () => {
    await render(<StopCard stop={stop} onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Blk 89, Joo Chiat Rd, stop 83139' })).toBeOnTheScreen();
  });
});

describe('StateView', () => {
  it('renders a message and action button', async () => {
    const onAction = jest.fn();
    await render(<StateView kind="error" message="Offline" actionLabel="Try again" onAction={onAction} />);

    expect(screen.getByText('Offline')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('renders a spinner while loading', async () => {
    await render(<StateView kind="loading" />);
    expect(screen.getByTestId('state-loading')).toBeOnTheScreen();
  });

  it('renders an empty state with a custom icon', async () => {
    await render(<StateView kind="empty" icon="star-outline" message="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeOnTheScreen();
  });
});
