import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemePicker } from '../ThemePicker';

describe('ThemePicker', () => {
  it('shows the three options with the current one checked', async () => {
    await render(<ThemePicker value="dark" onChange={() => {}} />);

    expect(screen.getByRole('radio', { name: 'System default' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('reports the chosen option', async () => {
    const onChange = jest.fn();
    await render(<ThemePicker value="system" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Light' }));

    expect(onChange).toHaveBeenCalledWith('light');
  });
});
