// An image is a page (`images/<id>/<page>`) rendered once per output size.
// `publish` copies each render to a repo path, e.g. the web app's OG image.
export function defineImage({ title, page = 'index.html', fonts = [], outputs }) {
  if (!outputs?.length) throw new Error(`image "${title}" needs at least one output`);
  for (const o of outputs) {
    if (!o.name || !o.width || !o.height) {
      throw new Error(`image "${title}": every output needs a name, width, and height`);
    }
  }
  return { title, page, fonts, outputs };
}
