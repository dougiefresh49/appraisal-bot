# MathPix

## Flow for creating a new note

1. Generate body data

- generate a GUID in the format of `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` and save it to a variable
- generate created_at in the format of `2024-12-02T20:58:40.876982Z` and save it to a variable

```js
const uuid = uuidv4();
const created_at = '2024-12-02T20:58:40.876982Z'; // TODO: generate this
const title = 'Untitled document';
const slug = `${title.replace(/\s/g, '-').toLowerCase()}-${uuid}`;
const folderId = 'edbc4895-9277-48fb-bb3e-0175cb6372fc';
```

1. Call `notes` endpoint

```js
fetch('https://snip-api.mathpix.com/v2/notes', {
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    authorization: `Bearer ${process.env.MATHPIX_API_KEY}`,
    'content-type': 'application/json',
    priority: 'u=1, i',
    'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
  },
  referrer: 'https://snip.mathpix.com/',
  referrerPolicy: 'strict-origin-when-cross-origin',
  body: `{"uuid":"${uuid}","title":"${title}","slug":"${slug}","public":false,"shared":false,"index_status":"indexed","created_at":"${created_at}","modified_at":"${created_at}","folder_id":"${folderId}"}`,
  method: 'POST',
  mode: 'cors',
  credentials: 'include',
});
```

the response looks like

```json
{
  "uuid": "32211799-d72a-419c-9bec-66cbebcad924",
  "title": "Untitled document",
  "slug": "untitled-document-32211799-d72a-419c-9bec-66cbebcad924",
  "public": false,
  "shared": false,
  "index_status": "indexed",
  "created_at": "2024-12-02T20:58:40.876982Z",
  "modified_at": "2024-12-02T20:58:40.876982Z",
  "folder_id": "edbc4895-9277-48fb-bb3e-0175cb6372fc"
}
```

The uuid is uuid of the new note to be used in the next step

1. Create new note via `notes/{uuid}` endpoint

```js
fetch(
  'https://snip-api.mathpix.com/v1/channel/key/notes/32211799-d72a-419c-9bec-66cbebcad924',
  {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      priority: 'u=1, i',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
    },
    referrer: 'https://snip.mathpix.com/',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'OPTIONS',
    mode: 'cors',
    credentials: 'omit',
  }
);
```
