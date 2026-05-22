export function normalizePhotos(photos) {
  if (!photos) return [];
  let list = photos;
  if (typeof photos === 'string') {
    try { list = JSON.parse(photos); } catch (e) { list = [photos]; }
  }
  if (!Array.isArray(list)) list = list ? [list] : [];

  return list.map((p, idx) => {
    if (!p) return null;
    if (typeof p === 'string') {
      return { id: `p_${idx}`, src: p, caption: '' };
    }
    let src = p.url || p.image || p.src || p.photo || p.preview || p.path || '';
    // If the photo contains a File/Blob under `file`, create an object URL for immediate display
    if (!src) {
      const fileObj = p.file || p;
      if (fileObj instanceof Blob || (fileObj.constructor && fileObj.constructor.name === 'File')) {
        try {
          src = URL.createObjectURL(fileObj);
        } catch (e) {
          src = '';
        }
      }
    }
    const caption = p.caption || p.title || '';
    const id = p.id || p._id || p.name || `p_${idx}`;
    return { id, src, caption };
  }).filter(Boolean);
}

export function getPhotoSrc(photo) {
  if (!photo) return '';
  if (typeof photo === 'string') return photo;
  return photo.src || photo.url || photo.preview || '';
}
