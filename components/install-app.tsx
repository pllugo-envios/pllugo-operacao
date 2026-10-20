import {useSyncExternalStore, type ReactNode} from 'react';
import {asset} from '../lib/client-api';
import {createInstallController} from '../lib/install-controller.mjs';

// Kept for the entire page lifetime: login/logout cannot discard the native prompt.
const installation = createInstallController(window);
const ua = navigator.userAgent;
const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const android = /Android/i.test(ua);
const mobile = ios || android;
const embedded = /; wv\)|FBAN|FBAV|Instagram|ChatGPT/i.test(ua) || window.self !== window.top;
if (window.isSecureContext && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(asset('/sw.js'), {scope: new URL(document.baseURI).pathname})
    .then(registration => registration.update()).catch(() => {});
}

export default function InstallApp({children}: {children: ReactNode}) {
  const state = useSyncExternalStore(installation.subscribe, installation.getSnapshot);
  if (!mobile || state.installed) return <>{children}</>;
  const chrome = 'intent://' + new URL(document.baseURI).host + new URL(document.baseURI).pathname
    + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='
    + encodeURIComponent(new URL(document.baseURI).href) + ';end';
  return <main className="mobile-install">
    <section aria-labelledby="install-title">
      <img src={asset('/icons/pllugo-192.png')} width="88" height="88" alt="Pllugo"/>
      <h1 id="install-title">Pllugo no seu celular</h1>
      <p>Instale para abrir suas tarefas pelo ícone do aplicativo.</p>
      {embedded ? <>
        <p>{android ? 'Abra no Chrome para instalar.' : 'Abra este link no Safari. Depois, toque em Compartilhar → Adicionar à Tela de Início.'}</p>
        {android && <a className="primary" href={chrome}>Abrir no Chrome</a>}
      </> : state.prompt ? <button className="primary" onClick={() => installation.install()}>Instalar</button>
        : state.busy ? <p role="status">Confirme a instalação na janela do navegador.</p>
        : <>
          {state.error && <p role="status">{state.error}</p>}
          <div className="mobile-install-step">{ios
            ? <>Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.</>
            : <>No menu <strong>⋮</strong> do navegador, toque em <strong>Adicionar à tela inicial</strong> e confirme em <strong>Instalar</strong>.</>}</div>
          <small>Já instalou? Abra pelo ícone “Pllugo Operação” na tela inicial.</small>
        </>}
    </section>
  </main>;
}
