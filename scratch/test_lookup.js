async function testLookup() {
  const input = 'https://maps.app.goo.gl/5JLwTRRZwJxQPPUX6?g_st=ac';
  try {
    const res = await fetch(input, { 
      method: 'GET', 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const finalUrl = res.url;
    console.log("FINAL URL:", finalUrl);

    const placeMatch = finalUrl.match(/\/place\/([^\/@?#]+)/);
    if (placeMatch) {
      const address = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      console.log("EXTRACTED ADDRESS:", address);
    } else {
      console.log("PLACE MATCH FAILED");
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
testLookup();
