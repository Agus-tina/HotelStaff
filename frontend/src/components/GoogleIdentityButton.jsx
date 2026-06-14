import { useEffect, useRef } from 'react'

let googleScriptPromise

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'))
    document.body.appendChild(script)
  })

  return googleScriptPromise
}

export default function GoogleIdentityButton({ onCredential, onError, text = 'signin_with' }) {
  const buttonRef = useRef(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return

    let active = true

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential(response.credential)
            } else {
              onError?.('Google no devolvio una credencial valida')
            }
          },
        })

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'es',
          width: buttonRef.current.offsetWidth || 360,
        })
      })
      .catch(() => onError?.('No se pudo cargar el boton de Google'))

    return () => {
      active = false
    }
  }, [clientId, onCredential, onError, text])

  if (!clientId) {
    return <p className="hint">Configura VITE_GOOGLE_CLIENT_ID para habilitar Google.</p>
  }

  return <div className="google-button" ref={buttonRef} />
}
