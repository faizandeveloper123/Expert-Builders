import { useState } from 'react';
import {
  FaAlignLeft,
  FaAlignRight,
  FaArrowUpLong,
  FaChevronDown,
  FaChevronUp,
  FaCircleInfo,
  FaDesktop,
  FaMobileScreenButton,
  FaPlus,
  FaRegTrashCan,
} from 'react-icons/fa6';

export type DeviceMode = 'desktop' | 'mobile';
export type LabelAlignment = 'left' | 'top' | 'right' | 'default';

export interface GeneralSettingsState {
  label: string;
  labelAlignment: {
    desktop: LabelAlignment;
    mobile: LabelAlignment;
  };
  placeholder: string;
  shortLabel: string;
  queryKey: string;
  fieldWidth: number;
  widthUnit: '%' | 'px';
  isRequired: boolean;
  isHidden: boolean;
  options?: string[];
  buttonColor?: string;
  buttonTextColor?: string;
}

interface GeneralSettingsProps {
  initialConfig?: Partial<GeneralSettingsState>;
  allowOptions?: boolean;
  isButton?: boolean;
  onChange: (updatedSettings: GeneralSettingsState) => void;
}

const DEFAULT_SETTINGS: GeneralSettingsState = {
  label: 'First Name',
  labelAlignment: {
    desktop: 'default',
    mobile: 'default',
  },
  placeholder: 'Please Input',
  shortLabel: 'Please Input',
  queryKey: '',
  fieldWidth: 100,
  widthUnit: '%',
  isRequired: false,
  isHidden: false,
  options: [],
};

export function GeneralSettingsAccordion({
  initialConfig,
  allowOptions = false,
  isButton = false,
  onChange,
}: GeneralSettingsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeDevice, setActiveDevice] = useState<DeviceMode>('desktop');
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);

  const [settings, setSettings] = useState<GeneralSettingsState>({
    ...DEFAULT_SETTINGS,
    ...initialConfig,
    options: initialConfig?.options ?? DEFAULT_SETTINGS.options,
    labelAlignment: {
      ...DEFAULT_SETTINGS.labelAlignment,
      ...(initialConfig?.labelAlignment || {}),
    },
  });

  const updateSetting = <K extends keyof GeneralSettingsState>(
    key: K,
    value: GeneralSettingsState[K]
  ) => {
    const nextState = { ...settings, [key]: value };
    setSettings(nextState);
    onChange(nextState);
  };

  const handleAlignmentChange = (alignment: LabelAlignment) => {
    const updatedAlignment = {
      ...settings.labelAlignment,
      [activeDevice]: alignment,
    };
    updateSetting('labelAlignment', updatedAlignment);
  };

  const addOption = () => {
    const next = [...(settings.options ?? []), `Option ${(settings.options?.length ?? 0) + 1}`];
    updateSetting('options', next);
  };

  const updateOption = (index: number, value: string) => {
    const next = [...(settings.options ?? [])];
    next[index] = value;
    updateSetting('options', next);
  };

  const removeOption = (index: number) => {
    const next = [...(settings.options ?? [])];
    next.splice(index, 1);
    updateSetting('options', next);
  };

  const inputCls =
    'w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
  const labelCls = 'block font-medium text-slate-700 mb-1';

  return (
    <div className="w-full border border-slate-200 rounded-md bg-white text-xs font-sans shadow-sm select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors"
      >
        <span className="font-semibold text-slate-700 text-sm">General Settings</span>
        {isOpen ? (
          <FaChevronUp className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <FaChevronDown className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="p-3.5 space-y-4">
          <div>
            <label className={labelCls}>Label</label>
            <input
              type="text"
              value={settings.label}
              onChange={(e) => updateSetting('label', e.target.value)}
              placeholder="First Name"
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-slate-700">Label Alignment</label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                  className="flex items-center gap-1 text-slate-500 hover:text-blue-600 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 transition-colors"
                  title="Switch view to set breakpoint-specific alignment"
                >
                  {activeDevice === 'desktop' ? (
                    <FaDesktop className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <FaMobileScreenButton className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <FaChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isDeviceMenuOpen && (
                  <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded shadow-lg z-10 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDevice('desktop');
                        setIsDeviceMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1 flex items-center gap-2 text-xs ${
                        activeDevice === 'desktop'
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FaDesktop className="w-3.5 h-3.5" /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDevice('mobile');
                        setIsDeviceMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1 flex items-center gap-2 text-xs ${
                        activeDevice === 'mobile'
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FaMobileScreenButton className="w-3.5 h-3.5" /> Mobile
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded border border-slate-200">
              <button
                type="button"
                onClick={() => handleAlignmentChange('left')}
                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                  settings.labelAlignment[activeDevice] === 'left'
                    ? 'bg-white border border-slate-300 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Left Align"
              >
                <FaAlignLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleAlignmentChange('top')}
                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                  settings.labelAlignment[activeDevice] === 'top'
                    ? 'bg-white border border-slate-300 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Top Align"
              >
                <FaArrowUpLong className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleAlignmentChange('right')}
                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                  settings.labelAlignment[activeDevice] === 'right'
                    ? 'bg-white border border-slate-300 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Right Align"
              >
                <FaAlignRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleAlignmentChange('default')}
                className={`px-1 py-1 rounded text-[10px] font-medium leading-tight text-center transition-all ${
                  settings.labelAlignment[activeDevice] === 'default'
                    ? 'bg-white border border-blue-500 text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Form Default
              </button>
            </div>
          </div>

          {allowOptions && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>Options</label>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-[11px] border border-blue-200 hover:bg-blue-50 rounded px-2 py-0.5 transition"
                >
                  <FaPlus className="w-2.5 h-2.5" />
                  Add option
                </button>
              </div>
              <div className="space-y-1.5">
                {(settings.options ?? []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition shrink-0"
                      title="Remove option"
                    >
                      <FaRegTrashCan className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(settings.options ?? []).length === 0 && (
                  <div className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded px-2.5 py-2">
                    No options yet. Click "Add option" to create choices.
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Placeholder</label>
            <input
              type="text"
              value={settings.placeholder}
              onChange={(e) => updateSetting('placeholder', e.target.value)}
              placeholder="Please Input"
              className={inputCls}
            />
          </div>

          {isButton && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Button Text</label>
                <input
                  type="text"
                  value={settings.label}
                  onChange={(e) => updateSetting('label', e.target.value)}
                  placeholder="Button label"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Button Color</label>
                  <input
                    type="color"
                    value={settings.buttonColor || '#2563EB'}
                    onChange={(e) => updateSetting('buttonColor', e.target.value)}
                    className="w-full h-9 rounded border border-slate-300 bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className={labelCls}>Text Color</label>
                  <input
                    type="color"
                    value={settings.buttonTextColor || '#FFFFFF'}
                    onChange={(e) => updateSetting('buttonTextColor', e.target.value)}
                    className="w-full h-9 rounded border border-slate-300 bg-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Short Label</label>
            <input
              type="text"
              value={settings.shortLabel}
              onChange={(e) => updateSetting('shortLabel', e.target.value)}
              placeholder="Please Input"
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label className="font-medium text-slate-700">Query Key</label>
              <div className="relative group cursor-pointer">
                <FaCircleInfo className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg z-20 pointer-events-none">
                  Pre-fill this input using URL query params (e.g. ?first_name=John)
                </div>
              </div>
            </div>
            <input
              type="text"
              value={settings.queryKey}
              onChange={(e) => updateSetting('queryKey', e.target.value)}
              placeholder="Please Input"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Field Width</label>
            <div className="flex border border-slate-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input
                type="number"
                value={settings.fieldWidth}
                onChange={(e) => updateSetting('fieldWidth', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-slate-800 focus:outline-none"
                min={1}
                max={settings.widthUnit === '%' ? 100 : 1920}
              />
              <select
                value={settings.widthUnit}
                onChange={(e) => updateSetting('widthUnit', e.target.value as '%' | 'px')}
                className="bg-slate-50 border-l border-slate-300 px-2 py-1.5 text-slate-600 font-medium focus:outline-none cursor-pointer"
              >
                <option value="%">%</option>
                <option value="px">px</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={settings.isRequired}
                onChange={(e) => updateSetting('isRequired', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              Required
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={settings.isHidden}
                onChange={(e) => updateSetting('isHidden', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              Hidden
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneralSettingsAccordion;
