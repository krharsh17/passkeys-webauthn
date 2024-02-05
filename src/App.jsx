import { useState } from 'react'
import './App.css'
import { startRegistration, browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser"

const serverURL = 'http://localhost:8000'

function App() {

  const [authDebug, setAuthDebug] = useState("")
  const [regDebug, setRegDebug] = useState("")

  const appendAuthDebug = (title, output) => {
    let newAuthDebug = authDebug
    if (newAuthDebug !== '') {
      newAuthDebug += '\n';
    }
    newAuthDebug += `// ${title}\n`;
    newAuthDebug += `${output}\n`;

    setAuthDebug(newAuthDebug)
  }

  const appendRegDebug = (title, output) => {
    setRegDebug(val => {
      val += '\n'
      val += `// ${title}\n`
      val += `${output}\n`
      return val
    })
  }

  const onRegistrationStart = async () => {
    const resp = await fetch(serverURL + '/generate-registration-options', { credentials: 'include' });

    let attResp;
    try {
      const opts = await resp.json();

      appendRegDebug('Registration Options', JSON.stringify(opts, null, 2));

      attResp = await startRegistration(opts);
      console.log(attResp)
      appendRegDebug('Registration Response', JSON.stringify(attResp, null, 2));
    } catch (error) {
      console.error(error)
      if (error.name === 'InvalidStateError') {
        alert('Error: Authenticator was probably already registered by user')
      } else {
        alert(error)
      }

      throw error;
    }

    const verificationResp = await fetch(serverURL + '/verify-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attResp),
      credentials: 'include'
    });

    const verificationJSON = await verificationResp.json();
    appendRegDebug('Server Response', JSON.stringify(verificationJSON, null, 2));

    if (verificationJSON && verificationJSON.verified) {
      alert("Authenticator Registered!")
    } else {
      alert(`Oh no, something went wrong! Response: ${JSON.stringify(
        verificationJSON,
      )}`)
    }
  }

  const onAuthStart = async (e) => {

    e.preventDefault()

    const resp = await fetch(serverURL + '/generate-authentication-options', { credentials: 'include' });

    let asseResp;
    try {
      const opts = await resp.json();
      appendAuthDebug('Authentication Options', JSON.stringify(opts, null, 2));

      asseResp = await startAuthentication(opts);
      appendAuthDebug('Authentication Response', JSON.stringify(asseResp, null, 2));
    } catch (error) {
      alert(error)
      throw new Error(error);
    }

    const verificationResp = await fetch(serverURL + '/verify-authentication', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asseResp),
      credentials: 'include'
    });

    const verificationJSON = await verificationResp.json();
    appendAuthDebug('Server Response', JSON.stringify(verificationJSON, null, 2));

    if (verificationJSON && verificationJSON.verified) {
      alert(`User authenticated!`);
    } else {
      alert(`Oh no, something went wrong! Response: ${JSON.stringify(
        verificationJSON,
      )}`);
    }
  }

  return (
    <>
      <div>
        <h1>SimpleWebAuthn Example Site</h1>

        {(browserSupportsWebAuthn() ?
          <div>
            <section id="registration">
              <button onClick={onRegistrationStart}>
                <strong>🚪&nbsp;Register</strong>
              </button>
              <details open>
                <summary>Console</summary>
                <textarea id="regDebug" spellCheck="false" value={regDebug}></textarea>
              </details>
            </section>

            <section id="authentication">
              <form>
                <button onClick={onAuthStart}>
                  <strong>🔐&nbsp;Authenticate</strong>
                </button>
              </form>
              <details open>
                <summary>Console</summary>
                <textarea id="authDebug" spellCheck="false" value={authDebug}></textarea>
              </details>
            </section>
          </div>
          : <div>Sorry, your browser does not support WebAuthn!</div>)}

      </div>
    </>
  )
}

export default App
