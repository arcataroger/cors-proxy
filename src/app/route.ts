export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const referrer = request.headers.get("referer");

  try {
    if (referrer) {
      const referrerUrl = new URL(referrer);
      const hostname = referrerUrl.hostname;

      if (hostname !== "localhost" && !hostname.endsWith(".datocms.com")) {
        return new Response("Invalid referrer", { status: 400 });
      }
    }
  } catch (error) {
    return new Response("Invalid referrer", { status: 400 });
  }

  let destinationUrl = ''
  try {
    const urlAsObj = new URL(request.url);
    const {searchParams} = urlAsObj
    const encodedUrl = searchParams.get('url')
    if(!searchParams || !encodedUrl) {
      return new Response(`No valid URL parameter provided`, { status: 400 });
    }
    if(encodedUrl) {
      destinationUrl = decodeURIComponent(encodedUrl)
    }
  } catch (e) {
    return new Response(`Error parsing the URL: ${JSON.stringify(e)}`, { status: 400 });
  }

  const destinationResponse = await fetch(destinationUrl);

  const newHeaders = new Headers(destinationResponse.headers);

  // Rewrite CORS to something more permissive
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set('Access-Control-Allow-Methods', 'GET');

  // Strip these headers because our fetch may have decompressed the body
  // and the recipient browser may ask for a different scheme anyway... let the web server handle that
  newHeaders.delete('content-encoding');
  newHeaders.delete('content-length');

  return new Response(destinationResponse.body, {
    status: destinationResponse.status,
    statusText: destinationResponse.statusText,
    headers: newHeaders,
  });
}
