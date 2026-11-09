import { create, ui, toast, type StepForm } from 'optikos';

export default function checkout(host: HTMLElement) {
  const wizard = create<StepForm>({
    type: 'stepform', renderTo: host, review: true, style: 'max-inline-size: 560px',
    steps: [
      { title: 'Contact', items: [ui.text('name', 'Name', { required: true }), ui.email('email', 'Email', { required: true })] },
      { title: 'Shipping', items: [ui.text('street', 'Street', { required: true }), ui.text('city', 'City', { required: true }), ui.select('speed', 'Delivery', ['Standard', 'Express'], { value: 'Standard' })] },
      { title: 'Payment', optional: true, items: [ui.radio('method', 'Method', ['Card', 'Transfer'], { value: 'Card' })] },
    ],
  });
  wizard.on('finish', (values: Record<string, unknown>) => toast({ type: 'success', text: `Order placed for ${values.name}` }));
  return () => wizard.destroy();
}
