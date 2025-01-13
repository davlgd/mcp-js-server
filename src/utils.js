export async function fetchResource(uri) {
    const response = await fetch(uri);
    const content = await response.text();
    const mimeType = response.headers.get('content-type')?.split(';')[0] || 'text/plain';

    return { content, mimeType };
}
