'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: {
            theme: 'outline' | 'filled_blue' | 'filled_black';
            size: 'large' | 'medium' | 'small';
            text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment: 'left' | 'center';
            width?: number;
            locale?: string;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleButtonProps {
  googleLoaded: boolean;
  clientId: string;
  onCredential: (credential: string) => void;
}

export function GoogleButton({ googleLoaded, clientId, onCredential }: GoogleButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!googleLoaded || !window.google?.accounts?.id || !buttonRef.current) return;

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        if (response.credential) {
          onCredentialRef.current(response.credential);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      width: 360,
      locale: 'es',
    });
  }, [googleLoaded, clientId]);

  if (!googleLoaded || !window.google?.accounts?.id) {
    return (
      <div className="w-full" style={{ minWidth: 280, maxWidth: 400 }}>
        <div className="flex items-center justify-center h-12 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return <div ref={buttonRef} className="w-full" />;
}