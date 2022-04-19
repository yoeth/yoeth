export function log(k, v, c) {
  return console.log(`%c[${k}]`, `color: ${c};`, v);
}
