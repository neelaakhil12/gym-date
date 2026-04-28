async function checkRedirect() {
  const url = 'https://maps.app.goo.gl/5JLwTRRZwJxQPPUX6?g_st=ac';
  try {
    const res = await fetch(url, { redirect: 'follow' });
    console.log("FINAL URL:", res.url);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
checkRedirect();
