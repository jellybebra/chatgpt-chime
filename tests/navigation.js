async (page) => {
  const checks = [];
  const worker = page.context().serviceWorkers()[0];
  const assert = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
  await worker.evaluate(async () => {
    await chrome.storage.local.set({enabled:false});
    globalThis.navigationCheckCount = 0;
    chrome.runtime.onMessage.addListener(m => { if (m?.type === 'reply-complete') globalThis.navigationCheckCount++; });
  });
  const count = () => worker.evaluate(() => globalThis.navigationCheckCount);
  const fixture = '<html><head><title>Local navigation regression</title></head><body><main><div data-markdown-text-style="assistant-message">Old answer</div></main><div contenteditable="true" role="textbox" data-composer-markdown="" aria-label="Ask ChatGPT"></div><button aria-label="Send">Send</button><button aria-label="Regenerate response">Regenerate</button><a href="/c/other">Other chat</a></body></html>';
  // All page requests are fulfilled from this fixture, without reaching ChatGPT.
  await page.context().route('**/*', r => r.fulfill({contentType:'text/html',body:fixture}));
  await page.goto('https://chatgpt.com/c/first');
  await page.waitForTimeout(300);
  assert(await page.evaluate(() => document.documentElement.dataset.chatgptChimeVersion)==='1.0.5', 'Updated detector loaded');
  async function loadHistory(path, text) {
    await page.evaluate(path => {
      if (path) history.pushState({},'',path);
      document.querySelector('main').innerHTML = '<span role="status" aria-busy="true">Loading</span>';
    }, path);
    await page.waitForTimeout(200);
    await page.evaluate(text => {
      document.querySelector('main').innerHTML = '<div data-markdown-text-style="assistant-message"></div>';
      document.querySelector('[data-markdown-text-style]').textContent = text;
    }, text);
    await page.waitForTimeout(2400);
  }
  await loadHistory('/c/second','Saved reply in second conversation');
  await loadHistory('/c/third','Saved reply in third conversation');
  assert(await count()===0, 'Repeated conversation navigation with loading spinners stays silent');
  await loadHistory(null,'History hydrated again without URL change');
  assert(await count()===0, 'Same-page history hydration stays silent');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await page.evaluate(() => {
    document.querySelector('main').innerHTML='<span role="status" aria-busy="true">ChatGPT is responding</span>';
    document.querySelector('[aria-label="Send"]').setAttribute('aria-label','Stop');
  });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    history.pushState({},'', '/c/fourth');
    document.querySelector('main').innerHTML='<div data-markdown-text-style="assistant-message">A different saved reply</div>';
  });
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[aria-label="Stop"]').setAttribute('aria-label','Send'));
  await page.waitForTimeout(2400);
  assert(await count()===0, 'Navigating away during a reply cancels detection without rearming');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await page.evaluate(() => document.querySelector('[data-markdown-text-style]').textContent='Fresh reply to Send');
  await page.waitForTimeout(2400);
  assert(await count()===1, 'Genuine send still notifies once');
  await page.getByRole('button',{name:'Regenerate response',exact:true}).click();
  await page.evaluate(() => document.querySelector('[data-markdown-text-style]').textContent='Fresh regenerated reply');
  await page.waitForTimeout(2400);
  assert(await count()===2, 'Regenerate still notifies');
  await page.evaluate(() => { history.pushState({},'', '/'); });
  await page.waitForTimeout(150);
  await page.getByRole('textbox',{name:'Ask ChatGPT'}).fill('Local fixture only');
  await page.getByRole('textbox',{name:'Ask ChatGPT'}).press('Enter');
  await page.evaluate(() => {
    history.pushState({},'', '/c/newly-created');
    document.querySelector('[data-markdown-text-style]').textContent='First answer in newly created conversation';
  });
  await page.waitForTimeout(2400);
  assert(await count()===3, 'Assigning a new conversation URL preserves a genuine first reply');
  await page.evaluate(() => { history.pushState({},'', '/'); });
  await page.waitForTimeout(150);
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await page.evaluate(() => {
    const link=document.querySelector('a');
    link.addEventListener('click', e => { e.preventDefault(); history.pushState({},'', '/c/other'); document.querySelector('[data-markdown-text-style]').textContent='Existing chat opened from sidebar'; });
    link.click();
  });
  await page.waitForTimeout(2400);
  assert(await count()===3, 'Sidebar navigation cannot masquerade as first-chat URL assignment');
  await worker.evaluate(() => chrome.storage.local.set({enabled:true}));
  return checks;
}
