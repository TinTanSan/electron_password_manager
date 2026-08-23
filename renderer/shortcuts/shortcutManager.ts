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
  
  // Track high-resolution timestamps
  private lastExecutedTime = 0; 
  private isProcessing = false;
  
  // Batch processing queue
  private eventBatch: { combo: string; event: KeyboardEvent }[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Configuration thresholds
  private readonly DEBOUNCE_MS = 50; // Window to catch simultaneous modifier chords
  private readonly THROTTLE_MS = 150; // Guard window between distinct successful actions

  constructor(private defaultShortcuts: Shortcut[]) {
    this.defaultShortcuts.forEach(def => this.register(def.action, def.handler, def.keyCombo));
  }

  register(action: ShortcutAction, handler: () => void, keyCombo?: string): void {
    this.unregister(action);
    const combo = keyCombo && keyCombo !== '' ? keyCombo : this.getDefaultKeyCombo(action);
    const shortcut: Shortcut = { action, keyCombo: combo, handler };
    this.shortcuts.set(action, shortcut);
  }

  remap(action: ShortcutAction, newKeyCombo: string): void {
    const existing = this.shortcuts.get(action);
    if (!existing) return;
    this.shortcuts.set(action, { ...existing, keyCombo: newKeyCombo });
  }

  unregister(action: ShortcutAction): void {
    this.shortcuts.delete(action);
  }

  /** Main entry point for keyboard events */
  handleKeyEvent = (event: KeyboardEvent): void => {
    const now = performance.now();
    
    // 1. Throttle completely distinct macro spams
    if (now - this.lastExecutedTime < this.THROTTLE_MS || this.isProcessing) {
      return;
    }

    const combo = this.getKeyCombo(event);

    // 2. Queue the event into our current evaluation window
    this.eventBatch.push({ combo, event });

    // 3. Reset the micro-window timer
    if (this.batchTimeout) clearTimeout(this.batchTimeout);
    
    this.batchTimeout = setTimeout(() => {
      this.processLatestBatch();
    }, this.DEBOUNCE_MS);
  };

  /** Processes gathered combos to find the best match */
  private processLatestBatch(): void {
    this.isProcessing = true;
    
    try {
      if (this.eventBatch.length === 0) return;

      let bestMatch: Shortcut | null = null;
      let matchedEvent: KeyboardEvent | null = null;

      // Sort combos by complexity (number of modifiers) so complex combinations take precedence
      // This stops 'Cmd+N' from accidentally swallowing 'Cmd+Shift+N'
      const sortedBatch = [...this.eventBatch].sort((a, b) => b.combo.length - a.combo.length);

      for (const item of sortedBatch) {
        for (const shortcut of this.shortcuts.values()) {
          if (shortcut.keyCombo === item.combo && shortcut.handler) {
            bestMatch = shortcut;
            matchedEvent = item.event;
            break; 
          }
        }
        if (bestMatch) break; // Found our highest priority winner
      }

      // Execute the winner
      if (bestMatch && matchedEvent) {
        matchedEvent.preventDefault();
        bestMatch.handler();
        this.lastExecutedTime = performance.now();
      }
    } finally {
      // Clean state for the next sequence
      this.eventBatch = [];
      this.batchTimeout = null;
      this.isProcessing = false;
    }
  }

  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.metaKey) parts.push('Cmd');
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    const key = event.key; 
    if (key !== "Shift" && key !== "Alt" && key !== "Meta" && key !== "Control") {
      const normalizedKey = key.length === 1 ? key.toUpperCase() : key;
      parts.push(normalizedKey);
    }
    
    return parts.join('+');
  }

  private getDefaultKeyCombo(action: ShortcutAction): string {
    const defaults: Record<ShortcutAction, string> = {
      NEW_ENTRY: 'Cmd+N',
      NEW_FILE: 'Cmd+Shift+N',
      SAVE: 'Cmd+S',
      OPEN_FILE: 'Cmd+O',
      FOCUS_SEARCH: 'Cmd+K',
      TOGGLE_SIDEBAR: 'Cmd+B',
      SHOW_PREFERENCES: 'Cmd+,',
      REDO: 'Cmd+Y',
      UNDO: 'Cmd+Z',
      CLOSE: 'Cmd+W',
      MINIMIZE: 'Cmd+M',
      MAXIMIZE: 'Cmd+Shift+F',
      QUIT: 'Cmd+Q',
    };
    return defaults[action] ?? 'Cmd+.';
  }
}

// Export a singleton instance safely passing standard defaults
export const shortcutManager = new ShortcutManager([
  { action: 'NEW_ENTRY', handler: () => console.log('New Entry'), keyCombo: 'Cmd+N' },
  { action: 'NEW_FILE', handler: () => console.log('New File'), keyCombo: 'Cmd+Shift+N' },
  { action: 'SAVE', handler: () => console.log('Save'), keyCombo: 'Cmd+S' },
  { action: 'OPEN_FILE', handler: () => console.log('Open File'), keyCombo: 'Cmd+O' },
  { action: 'FOCUS_SEARCH', handler: () => console.log('Focus Search'), keyCombo: 'Cmd+K' },
  { action: 'TOGGLE_SIDEBAR', handler: () => console.log('Toggle Sidebar'), keyCombo: 'Cmd+B' },
  { action: 'SHOW_PREFERENCES', handler: () => console.log('Show Preferences'), keyCombo: 'Cmd+,' },
  { action: 'REDO', handler: () => console.log('Redo'), keyCombo: 'Cmd+Shift+Z' },
  { action: 'UNDO', handler: () => console.log('Undo'), keyCombo: 'Cmd+Z' },
  { action: 'CLOSE', handler: () => console.log('Close'), keyCombo: 'Cmd+W' },
  { action: 'MINIMIZE', handler: () => console.log('Minimize'), keyCombo: 'Cmd+M' },
  { action: 'MAXIMIZE', handler: () => console.log('Maximize'), keyCombo: 'Cmd+Shift+F' },
  { action: 'QUIT', handler: () => console.log('Quit'), keyCombo: 'Cmd+Q' },
]);

export const registerShortcut = (action: ShortcutAction, handler: () => void, keyCombo?: string) => {
  shortcutManager.register(action, handler, keyCombo);
};

export const remapShortcut = (action: ShortcutAction, newKeyCombo: string) => {
  shortcutManager.remap(action, newKeyCombo);
};

export const unregisterShortcut = (action: ShortcutAction) => {
  shortcutManager.unregister(action);
};
