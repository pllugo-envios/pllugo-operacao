// Capture the browser's one-use install event before React or authentication mounts.
export function createInstallController(target) {
  const standalone = target.matchMedia('(display-mode: standalone)').matches || target.navigator.standalone === true;
  let state = {prompt: null, installed: standalone, standalone, busy: false, error: ''};
  const listeners = new Set();
  const emit = patch => { state = {...state, ...patch}; listeners.forEach(fn => fn()); };
  const mode = target.matchMedia('(display-mode: standalone)');
  target.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    emit({prompt: event, error: '', busy: false});
  });
  target.addEventListener('appinstalled', () => emit({installed: true, prompt: null, busy: false}));
  mode.addEventListener('change', event => {
    emit({standalone: event.matches, ...(event.matches ? {installed: true, prompt: null} : {})});
  });
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    getSnapshot: () => state,
    async install() {
      if (!state.prompt || state.busy) return;
      const event = state.prompt;
      // This event can only be used once, even when the user cancels the dialog.
      emit({prompt: null, busy: true, error: ''});
      try {
        await event.prompt();
        const choice = await event.userChoice;
        emit({busy: false, error: choice.outcome === 'accepted' ? '' : 'Para instalar agora, use o menu do navegador abaixo.'});
      } catch {
        emit({busy: false, error: 'Use o menu do navegador abaixo para instalar.'});
      }
    }
  };
}
