import { create, defineTheme, setTheme } from 'optikos';

// a whole brand look from tokens: no CSS selectors, no !important
const acme = defineTheme({
  color: { primary: '#0f766e', primaryHover: '#115e59', primaryFg: '#ffffff', primarySoft: '#ccfbf1', focus: '#0f766e' }, // set the text on it too
  radius: '0.75rem', // the base radius; { sm, lg } set the others
  button: { radius: '999px', fontWeight: 700 },
}, 'acme');

export default function theme(host: HTMLElement) {
  acme.inject();
  setTheme('acme', host); // scoped: only this box changes
  const box = create({
    type: 'panel', title: 'Acme', renderTo: host, style: 'max-inline-size: 380px', items: [
      { type: 'textfield', label: 'Project', value: 'Launch' },
      { type: 'slider', label: 'Budget', value: 60, format: (v: number) => `$${v}k` },
    ],
    buttons: [{ text: 'Cancel' }, { text: 'Save', variant: 'primary' }],
  });
  return () => box.destroy();
}
