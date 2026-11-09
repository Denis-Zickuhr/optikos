import { create, type Button, type Container, type Label, type Slider } from 'optikos';
import { signal, computed, bind } from 'optikos/bind';

export default function signals(host: HTMLElement) {
  const seats = signal(5);
  const price = computed(() => seats() * 12);
  const page = create<Container>({ type: 'container', renderTo: host, layout: { type: 'vbox', gap: 12 }, style: 'max-inline-size: 360px' });
  const slider = page.add({ type: 'slider', label: 'Seats', min: 1, max: 50 }) as Slider;
  const total = page.add({ type: 'label', variant: 'title' }) as Label;
  const reset = page.add({ type: 'button', text: 'Reset', handler: () => seats.set(5) }) as Button;
  bind(slider, { value: seats }); // two-way: dragging writes the signal back
  bind(total, { text: () => `${seats()} seats · $${price()}/month` });
  bind(reset, { disabled: () => seats() === 5 });
  return () => page.destroy();
}
