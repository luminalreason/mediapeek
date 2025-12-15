import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown } from 'lucide-react';

interface FormatMenuProps {
  value: string;
  onChange: (value: string) => void;
}

const formats = [
  { value: 'text', label: 'Text' },
  { value: 'HTML', label: 'HTML' },
  { value: 'XML', label: 'XML' },
  { value: 'JSON', label: 'JSON' },
  { value: 'EBUCore_1.8_ps', label: 'EBUCore 1.8 (XML)' },
  { value: 'MPEG-7', label: 'MPEG-7' },
  { value: 'PBCore_2.1', label: 'PBCore 2.1' },
];

export function FormatMenu({ value, onChange }: FormatMenuProps) {
  const selectedFormat = formats.find((f) => f.value === value) || formats[0];

  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-full min-w-[140px] items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none">
        {selectedFormat.label}
        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={8}>
          <Menu.Popup className="z-50 w-[180px] overflow-hidden rounded-xl bg-[#1e1e1e] p-1 shadow-xl ring-1 ring-white/10 backdrop-blur-xl">
            <Menu.RadioGroup value={value} onValueChange={onChange}>
              {formats.map((format) => (
                <Menu.RadioItem
                  key={format.value}
                  value={format.value}
                  className="flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-300 outline-none hover:bg-white/10 hover:text-white focus:bg-white/10 data-checked:font-medium data-checked:text-white"
                  closeOnClick
                >
                  {format.label}
                  <Menu.RadioItemIndicator>
                    <Check className="h-4 w-4 text-blue-400" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
