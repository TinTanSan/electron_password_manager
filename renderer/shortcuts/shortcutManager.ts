
type ShortcutAction =
  | 'NEW_ENTRY'
  | 'NEW_FILE'
  | 'SAVE'
  | 'OPEN_FILE'
  | 'FOCUS_SEARCH'
  | 'TOGGLE_SIDEBAR'
  | 'SHOW_PREFERENCES'
  | 'REDO'
  | 'UNDO'
  | 'CLOSE'
  | 'MINIMIZE'
  | 'MAXIMIZE'
  | 'QUIT';

interface Shortcut {
  action: ShortcutAction;
  keyCombo: string;
  handler: () => void;
}

class ShortcutManager {
  private shortcuts = new Map<string, Shortcut>(); // keyed by action
  private keydownHandler;
  constructor(private defaultShortcuts: Shortcut[]) {
    this.defaultShortcuts.forEach(def => this.register(def.action, def.handler));
  }

  /** Register a new shortcut */
  register(action: ShortcutAction, handler: () => void, keyCombo?: string): void {
    const combo = keyCombo ?? this.getDefaultKeyCombo(action);
    const shortcut: Shortcut = { action, keyCombo: combo, handler };
    this.shortcuts.set(action, shortcut);
    // Add global keydown listener if not already present
    // window.addEventListener('keydown', this.handleKeyEvent);
  }

  /** Remap an existing shortcut */
  remap(action: ShortcutAction, newKeyCombo: string): void {
    const existing = this.shortcuts.get(action);
    if (!existing) return;
    this.shortcuts.set(action, { ...existing, keyCombo: newKeyCombo });
  }

  /** Unregister a shortcut */
  unregister(action: ShortcutAction): void {
    this.shortcuts.delete(action);
  }

  /** Handle keydown events */
  handleKeyEvent = (event: KeyboardEvent): void => {
    const combo = this.getKeyCombo(event);
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.keyCombo === combo && shortcut.handler) {
        console.log('run combo')
        event.preventDefault();
        shortcut.handler();
        break;
      }
    }
  };

  /** Convert a KeyboardEvent into a string key combo */
  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.metaKey) parts.push('Cmd');
    else if (event.ctrlKey) parts.push('Ctrl');

    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');

    // Add the key name, normalising for printable keys
    const key = event.key;
    const normalizedKey = key.length === 1 ? key.toUpperCase() : key;
    parts.push(normalizedKey);

    return parts.join('+');
  }

  /** Get default key combo for an action */
  private getDefaultKeyCombo(action: ShortcutAction): string {
    const defaults: Record<ShortcutAction, string> = {
      NEW_ENTRY: 'Cmd+N',
      NEW_FILE: 'Cmd+Shift+N',
      SAVE: 'Cmd+S',
      OPEN_FILE: 'Cmd+O',
      FOCUS_SEARCH: 'Cmd+F',
      TOGGLE_SIDEBAR: 'Cmd+B',
      SHOW_PREFERENCES: 'Cmd+,',
      REDO: 'Cmd+Shift+Z',
      UNDO: 'Cmd+Z',
      CLOSE: 'Cmd+W',
      MINIMIZE: 'Cmd+M',
      MAXIMIZE: 'Cmd+Shift+F',
      QUIT: 'Cmd+Q',
    };
    return defaults[action] ?? 'Cmd+.';
  }
}

// Export a singleton instance for easy import
export const shortcutManager = new ShortcutManager([
  { action: 'NEW_ENTRY', handler: () => console.log('New Entry'), keyCombo: '' },
  { action: 'NEW_FILE', handler: () => console.log('New File'), keyCombo: '' },
  { action: 'SAVE', handler: () => console.log('Save'), keyCombo: '' },
  { action: 'OPEN_FILE', handler: () => console.log('Open File'), keyCombo: 'Cmd+O' },
  { action: 'FOCUS_SEARCH', handler: () => console.log('Focus Search'), keyCombo: '' },
  { action: 'TOGGLE_SIDEBAR', handler: () => console.log('Toggle Sidebar'), keyCombo: '' },
  { action: 'SHOW_PREFERENCES', handler: () => console.log('Show Preferences'), keyCombo: '' },
  { action: 'REDO', handler: () => console.log('Redo'), keyCombo: '' },
  { action: 'UNDO', handler: () => console.log('Undo'), keyCombo: '' },
  { action: 'CLOSE', handler: () => console.log('Close'), keyCombo: '' },
  { action: 'MINIMIZE', handler: () => console.log('Minimize'), keyCombo: '' },
  { action: 'MAXIMIZE', handler: () => console.log('Maximize'), keyCombo: '' },
  { action: 'QUIT', handler: () => console.log('Quit'), keyCombo: '' },
]);

// External registration helpers
export const registerShortcut = (action: ShortcutAction, handler: () => void, keyCombo?: string) => {
  shortcutManager.register(action, handler, keyCombo);
};

export const remapShortcut = (action: ShortcutAction, newKeyCombo: string) => {
  shortcutManager.remap(action, newKeyCombo);
};

export const unregisterShortcut = (action: ShortcutAction) => {
  shortcutManager.unregister(action);
};