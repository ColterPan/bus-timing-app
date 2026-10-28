import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ServiceArrival } from '../../types';
import { ArrivalRow } from '../ArrivalRow';

const service: ServiceArrival = {
  serviceNo: '15',
  operator: 'GAS',
  next: [
    { etaMin: 0, load: 'SEA', type: 'SD', wheelchair: true, monitored: true },
    { etaMin: 7, load: 'LSD', type: 'DD', wheelchair: false, monitored: false },
  ],
};

describe('ArrivalRow', () => {
  it('shows service, operator and up to three ETAs', async () => {
    await render(<ArrivalRow service={service} />);

    expect(screen.getByText('15')).toBeOnTheScreen();
    expect(screen.getByText('GAS')).toBeOnTheScreen();
    expect(screen.getByText('Arr')).toBeOnTheScreen();
    expect(screen.getByText('7 min')).toBeOnTheScreen();
    expect(screen.getByText('-')).toBeOnTheScreen();
  });

  it('badges double deckers and scheduled (non-live) estimates', async () => {
    await render(<ArrivalRow service={service} />);

    expect(screen.getByText('DD')).toBeOnTheScreen();
    expect(screen.getByText('sched')).toBeOnTheScreen();
  });

  it('describes crowding for screen readers', async () => {
    await render(<ArrivalRow service={service} />);

    expect(screen.getByLabelText('Arr, Seats available')).toBeOnTheScreen();
    expect(screen.getByLabelText('7 min, Limited standing')).toBeOnTheScreen();
    expect(screen.getByLabelText('No bus')).toBeOnTheScreen();
  });

  it('hides the pin button unless a handler is given', async () => {
    await render(<ArrivalRow service={service} />);
    expect(screen.queryByTestId('pin-15')).toBeNull();
  });

  it('calls onTogglePin and reflects the pinned state', async () => {
    const onTogglePin = jest.fn();
    await render(<ArrivalRow service={service} pinned onTogglePin={onTogglePin} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Unpin service 15' }));

    expect(onTogglePin).toHaveBeenCalledTimes(1);
  });
});
