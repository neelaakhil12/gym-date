async function testLookup() {
  const input = 'https://maps.app.goo.gl/853vXyBsEBZZ91on9?g_st=ac';
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

    const dirMatch = finalUrl.match(/\/dir\/[^\/]+\/([^\/@?#]+)/);
    if (dirMatch) {
      const address = decodeURIComponent(dirMatch[1].replace(/\+/g, ' '));
      console.log("EXTRACTED DESTINATION:", address);
    } else {
      console.log("DIR MATCH FAILED");
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
testLookup();
