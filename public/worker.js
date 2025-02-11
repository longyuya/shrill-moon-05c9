async function readRequestBody(request) {
  const { headers } = request;
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return JSON.stringify(await request.json());
  } else if (contentType.includes('form')) {
    const formData = await request.formData();
    const body = {};
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1];
    }
    let data = JSON.parse(JSON.stringify(body));
    let combine = `{"personalizations":[{"to":[{"email":"${data.to}","name":"${data.ton}"}],"dkim_domain":"${data.dkim}","dkim_selector":"${data.dkims}","dkim_private_key":"${data.dkimpk}"}],"from":{"email":"${data.from}","name":"${data.fromn}"},"reply_to":{"email":"${data.rep}","name":"${data.repn}"},"subject":"${data.sbj}","content":[{"type":"${data.type}","value":"${data.body}"}]}`;
    return combine;
  } else {
    return '{"success":false}';
  }
}

async function handleRequest(request) {
  let start = Date.now();
  let reqBody = await readRequestBody(request);
  let send_request = new Request("https://api.mailchannels.net/tx/v1/send", {
    "method": "POST",
    "headers": {
      "content-type": "application/json",
    },
    "body": reqBody
  });
  let resp = await fetch(send_request);
  let respText = await resp.text();
  let end = Date.now();
  let total = end - start;
  return new Response(respText, {
    headers: {
      "X-MC-Status": resp.status,
      "X-Response-Time": total
    }
  });
}

const htmlForm =`<!DOCTYPE html>
<html>
<head>
<meta content="width=device-width,initial-scale=1" name="viewport">
<title>Submit your email</title>
<body>
(*) is required
<form action="/" method="POST" autocomplete="on">
<input name="from" type="email" placeholder="sender@example.com *" required><br>
<input name="fromn" type="text" placeholder="Sender Name"><br>
<input name="to" type="email" placeholder="receiver@example.com *" required><br>
<input name="ton" type="text" placeholder="Receiver Name"><br>
<input name="rep" type="email" placeholder="reply-to@example.com"><br>
<input name="repn" type="text" placeholder="Replier Name"><br>
<input name="dkim" type="text" placeholder="DKIM Domain"><br>
<input name="dkims" type="text" placeholder="DKIM Selector"><br>
<textarea name="dkimpk" rows="4" cols="23" type="text" placeholder="DKIM Private Key MIICXQIBAAKBgQCU......."></textarea><br>
<select name="type">
<option value="text/html; charset=utf-8">HTML</option>
<option value="text/plain; charset=utf-8" selected>Plain</option>
</select><br>
<input name="sbj" type="text" placeholder="Email Subject *" required><br>
<textarea name="body" rows="7" cols="23" placeholder="Email Body *" required></textarea><br>
<input type="submit" value="submit">
</form>
</body>
</html>`;

addEventListener('fetch', event => {
  const { request } = event;
  const { url } = request;
  if (url.includes('submit')) {
    return event.respondWith(new Response(htmlForm, {headers:{"Content-Type":"text/html"}}));
  }
  if (request.method === 'POST') {
    return event.respondWith(handleRequest(request));
  } else if (request.method === 'GET') {
    return event.respondWith(new Response(`The request was a GET`));
  }
});
