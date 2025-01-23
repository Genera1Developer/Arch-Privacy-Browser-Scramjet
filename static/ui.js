const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.js",
    worker: "/scram/scramjet.worker.js",
    client: "/scram/scramjet.client.js",
    shared: "/scram/scramjet.shared.js",
    sync: "/scram/scramjet.sync.js",
  },
  siteFlags: {
    "https://worker-playground.glitch.me/.*": {
      serviceworkers: true,
    },
  },
});

scramjet.init();
navigator.serviceWorker.register("./sw.js");

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const flex = css`
  display: flex;
`;
const col = css`
  flex-direction: column;
`;

const store = $store(
  {
    url: "https://google.com",
    wispurl: _CONFIG?.wispurl || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`,
    bareurl: _CONFIG?.bareurl || `${location.protocol === "https:" ? "https" : "http"}://${location.host}/bare/`,
    proxy: "",
  },
  { ident: "settings", backing: "localstorage", autosave: "auto" }
);

connection.setTransport("/epoxy/index.mjs", [{ wisp: store.wispurl }]);

// Modern CSS with cleaner variables
function Config() {
  this.css = `
    :root {
      --background-dark: #121212;
      --background-light: #313131;
      --highlight-color: #4c8bf5;
      --text-color: #fff;
      --input-border-color: rgb(49, 49, 49);
      --button-hover-bg: #292929;
      --transition-time: 0.4s;
    }

    transition: opacity var(--transition-time) ease;
    :modal[open] {
      animation: fade var(--transition-time) ease normal;
    }

    :modal::backdrop {
      backdrop-filter: blur(3px);
    }

    .buttons {
      gap: 0.5em;
    }

    .buttons button {
      border: 1px solid var(--highlight-color);
      background-color: var(--background-dark);
      border-radius: 0.75em;
      color: var(--text-color);
      padding: 0.45em;
      transition: background-color 0.3s;
    }

    .buttons button:hover {
      background-color: var(--button-hover-bg);
    }

    .input_row input {
      background-color: var(--background-dark);
      border: 2px solid var(--input-border-color);
      border-radius: 0.75em;
      color: var(--text-color);
      outline: none;
      padding: 0.45em;
    }

    .input_row {
      margin: 0.5em 0;
    }

    .centered {
      justify-content: center;
      align-items: center;
    }
  `;

  const handleModalClose = (modal) => {
    modal.style.opacity = 0;
    setTimeout(() => {
      modal.close();
      modal.style.opacity = 1;
    }, 250);
  };

  return html`
    <dialog class="cfg" style="background-color: var(--background-dark); color: var(--text-color); border-radius: 8px;">
      <div style="align-self: end">
        <div class=${[flex, "buttons"]}>
          <button on:click=${() => connection.setTransport("/baremod/index.mjs", [store.bareurl])}>Use Bare Server</button>
          <button on:click=${() => connection.setTransport("/libcurl/index.mjs", [{ wisp: store.wispurl }])}>Use libcurl.js</button>
          <button on:click=${() => connection.setTransport("/epoxy/index.mjs", [{ wisp: store.wispurl }])}>Use Epoxy</button>
        </div>
      </div>
      <div class=${[flex, col, "input_row"]}>
        <label for="wisp_url_input">Wisp URL:</label>
        <input id="wisp_url_input" bind:value=${use(store.wispurl)} spellcheck="false" />
      </div>
      <div class=${[flex, col, "input_row"]}>
        <label for="bare_url_input">Bare URL:</label>
        <input id="bare_url_input" bind:value=${use(store.bareurl)} spellcheck="false" />
      </div>
      <div class=${[flex, "buttons", "centered"]}>
        <button on:click=${() => handleModalClose(this.root)}>Close</button>
      </div>
    </dialog>
  `;
}

function BrowserApp() {
  this.css = `
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      background-color: var(--background-dark);
      color: var(--text-color);
    }
    .version {
      font-size: 0.8rem;
      color: #b0b0b0;
    }
    h1 {
      margin: 0;
      font-family: 'Inter Tight', 'Inter', sans-serif;
    }
    iframe {
      background-color: #fff;
      border: none;
      border-radius: 0.3em;
      flex: 1;
      width: 100%;
    }

    .bar {
      padding: 0.3em;
      font-family: 'Inter';
      border-radius: 0.3em;
      border: 1px solid var(--input-border-color);
      color: var(--text-color);
      background-color: var(--background-dark);
      outline: none;
    }

    .input_row > label {
      font-size: 0.8rem;
      color: gray;
    }

    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5em;
      padding: 0.3em 0;
    }

    .nav button {
      background-color: var(--background-dark);
      border: 1px solid var(--input-border-color);
      color: var(--text-color);
      padding: 0.6em;
      border-radius: 0.3em;
      transition: background-color 0.3s;
    }

    .nav button:hover {
      background-color: var(--button-hover-bg);
    }
  `;

  const frame = scramjet.createFrame();

  frame.addEventListener("urlchange", (e) => {
    if (e.url) this.url = e.url;
  });

  frame.frame.addEventListener("load", () => {
    let url = frame.frame.contentWindow.location.href;
    if (url && url !== "about:blank") {
      this.url = $scramjet.codec.decode(url.substring(location.href.length + "/scramjet".length));
    }
  });

  const handleSubmit = () => {
    this.url = this.url.trim();
    if (!this.url.startsWith("http")) this.url = "https://" + this.url;
    frame.go(this.url);
  };

  const cfg = h(Config);
  document.body.appendChild(cfg);
  this.githubURL = `https://github.com/MercuryWorkshop/scramjet/commit/${$scramjet.version.build}`;

  return html`
    <div>
      <div class=${[flex, "nav"]}>
        <button on:click=${() => cfg.showModal()}>Config</button>
        <button on:click=${() => frame.back()}>&lt;-</button>
        <button on:click=${() => frame.forward()}>-&gt;</button>
        <button on:click=${() => frame.reload()}>&#x21bb;</button>

        <input class="bar" bind:value=${use(this.url)} on:input=${(e) => { this.url = e.target.value; }} on:keyup=${(e) => e.keyCode == 13 && (store.url = this.url) && handleSubmit()} />
        
        <button on:click=${() => window.open(scramjet.encodeUrl(this.url))}>Open</button>

        <p class="version">
          <b>scramjet</b> ${$scramjet.version.version} <a href=${use(this.githubURL)}>${$scramjet.version.build}</a>
        </p>
      </div>
      ${frame.frame}
    </div>
  `;
}

window.addEventListener("load", async () => {
  document.body.appendChild(h(BrowserApp));

  const b64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  };

  const arrayBuffer = await (await fetch("/assets/scramjet.png")).arrayBuffer();
  console.log(
    "%cb",
    `
      background-image: url(data:image/png;base64,${b64(arrayBuffer)});
      color: transparent;
      padding-left: 200px;
      padding-bottom: 100px;
      background-size: contain;
      background-position: center center;
      background-repeat: no-repeat;
    `
  );
});
