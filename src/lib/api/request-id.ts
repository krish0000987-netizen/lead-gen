let counter = 0;
export function requestId() {
  const id = `req_${Date.now()}_${++counter}`;
  return id;
}
