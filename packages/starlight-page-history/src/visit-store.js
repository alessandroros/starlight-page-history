// Where the browser keeps the last version of each page a reader saw. Only in
// their browser (localStorage), never sent anywhere. Fails quietly when
// storage is blocked: the page then has no "since your last visit".
const PREFIX = 'starlight-page-history:';

export function readVisit(key) {
  try {
    const value = JSON.parse(localStorage.getItem(PREFIX + key) ?? 'null');
    return value && typeof value.seen === 'string' ? value : null;
  } catch {
    return null;
  }
}

export function writeVisit(key, state) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(state));
  } catch {
    // Private mode or storage turned off.
  }
}
