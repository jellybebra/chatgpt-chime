async (page) => {
  const checks = [];
  function assert(ok, name) { if (!ok) throw new Error(name); checks.push(name); }
  // Every request is intercepted locally; no prompts or requests reach ChatGPT.
  const fixture = '<html><head><title>Local focus test</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Crect width=\'32\' height=\'32\' fill=\'gray\'/%3E%3C/svg%3E"></head><body><main></main><button aria-label="Send">Send</button></body></html>';
  await page.context().route('**/*', r => r.fulfill({contentType:'text/html',body:fixture}));
  await page.goto('https://chatgpt.com/c/local-focus-fixture');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setFocusEmulationEnabled', {enabled:false});
  await page.waitForTimeout(250);
  const background = await page.context().newPage();
  await background.goto('about:blank');
  await background.bringToFront();
  assert(!(await page.evaluate(() => document.hasFocus())), 'Fixture is genuinely unfocused');
  const original = await page.locator('link[rel="icon"]').getAttribute('href');
  async function reply(text, settle = true) {
    await page.evaluate(text => {
      document.querySelector('button').click();
      const message = document.createElement('div');
      message.setAttribute('data-markdown-text-style','assistant-message');
      message.textContent = text;
      document.querySelector('main').append(message);
    }, text);
    if (settle) await page.waitForTimeout(3500);
  }
  await reply('Background completion');
  assert(await page.locator('link[rel="icon"]').count() === 2, 'Background reply gets a dot');
  const pixel = await page.evaluate(async () => {
    const img = new Image(); img.src = document.querySelector('link[rel="icon"]').href;
    await img.decode(); const c=document.createElement('canvas'); c.width=c.height=32;
    const x=c.getContext('2d'); x.drawImage(img,0,0,32,32);
    return [...x.getImageData(24,24,1,1).data];
  });
  assert(pixel[0]===59 && pixel[1]===130 && pixel[2]===246, 'Original blue #3b82f6 is restored');
  await page.evaluate(() => { delete document.documentElement.dataset.chatgptChimeClearSource; });
  await page.bringToFront();
  await page.waitForTimeout(250);
  assert(await page.evaluate(() => document.documentElement.dataset.chatgptChimeClearSource) === 'browser-activation', 'Chrome tab activation directly clears the indicator');
  assert(await page.locator('link[rel="icon"]').count()===1 && await page.locator('link[rel="icon"]').getAttribute('href')===original, 'Focus immediately restores original favicon');
  await reply('Already focused');
  assert(await page.locator('link[rel="icon"]').count()===1, 'No unread dot for completion while focused');
  assert(await page.evaluate(() => document.documentElement.dataset.chatgptChimeAudio)==='played', 'Focused completion still plays sound');
  await background.bringToFront();
  await reply('Return during settle delay', false);
  await page.waitForTimeout(200);
  await page.bringToFront();
  await page.waitForTimeout(3500);
  assert(await page.locator('link[rel="icon"]').count()===1, 'Returning during completion delay does not recreate the dot');
  await background.bringToFront();
  await page.bringToFront();
  await background.close();
  return checks;
}
