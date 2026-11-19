/* Book packs stored on this device (IndexedDB).
   The public app has no Cambridge audio or pages. On each device you import one .zip "pack" per book once;
   the files are kept in the browser's storage and served from there. If the files sit next to the app
   (running from your Mac's folder), they are used directly. */
(function (App) {
  'use strict';
  const DB = 'ielts-media', V = 1;
  let dbp = null;
  const urlCache = new Map(), availCache = {};
  const MIME = { mp3: 'audio/mpeg', m4a: 'audio/mp4', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', json: 'application/json' };

  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, V);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('files')) d.createObjectStore('files'); if (!d.objectStoreNames.contains('packs')) d.createObjectStore('packs', { keyPath: 'id' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function store(name, mode) { return (await db()).transaction(name, mode).objectStore(name); }

  /* --- minimal reader for uncompressed ("stored") zip files; reads slices so large files never load into memory --- */
  async function readZip(file) {
    const tailLen = Math.min(file.size, 66000);
    const tail = new DataView(await file.slice(file.size - tailLen).arrayBuffer());
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('This file is not a zip pack.');
    const count = tail.getUint16(eocd + 10, true), cdSize = tail.getUint32(eocd + 12, true), cdOff = tail.getUint32(eocd + 16, true);
    const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
    const dec = new TextDecoder();
    const entries = [];
    for (let p = 0, n = 0; n < count; n++) {
      if (cd.getUint32(p, true) !== 0x02014b50) throw new Error('Damaged zip file.');
      const method = cd.getUint16(p + 10, true), size = cd.getUint32(p + 20, true);
      const nl = cd.getUint16(p + 28, true), el = cd.getUint16(p + 30, true), cl = cd.getUint16(p + 32, true), off = cd.getUint32(p + 42, true);
      const name = dec.decode(new Uint8Array(cd.buffer, p + 46, nl));
      entries.push({ name, method, size, off });
      p += 46 + nl + el + cl;
    }
    for (const e of entries) {
      if (e.name.endsWith('/')) continue;
      if (e.method !== 0) throw new Error('This pack is compressed. Please use the packs made for IELTS Studio.');
      const lh = new DataView(await file.slice(e.off, e.off + 30).arrayBuffer());
      e.start = e.off + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    }
    return entries.filter(e => !e.name.endsWith('/') && !/(^|\/)(__MACOSX|\.DS_Store)/.test(e.name));
  }

  const M = App.media = {
    supported: 'indexedDB' in window,
    async packs() { try { return await req((await store('packs', 'readonly')).getAll()); } catch (e) { return []; } },
    async get(path) { try { return await req((await store('files', 'readonly')).get(path)); } catch (e) { return undefined; } },
    /* URL for a book file: from this device's storage, else the file next to the app */
    async url(path) {
      if (urlCache.has(path)) return urlCache.get(path);
      const blob = await M.get(path);
      const u = blob ? URL.createObjectURL(blob) : path;
      urlCache.set(path, u); return u;
    },
    /* is a book usable here? (imported pack, or files present beside the app) */
    async available(book) {
      if (availCache[book.id] != null) return availCache[book.id];
      const packs = await M.packs();
      if (packs.some(p => p.id === book.id)) return (availCache[book.id] = true);
      const probe = book.tests[0].parts[0].audio;
      let ok = false;
      if (location.protocol.startsWith('http')) { try { ok = (await fetch(probe, { method: 'HEAD', cache: 'no-store' })).ok; } catch (e) { ok = false; } }
      else ok = true; // opened as a file from the app folder: the files are there
      return (availCache[book.id] = ok);
    },
    async importZip(file, onProgress) {
      const entries = await readZip(file);
      const manifest = entries.find(e => e.name === 'pack.json');
      if (!manifest) throw new Error('“' + file.name + '” is not an IELTS Studio book pack.');
      const info = JSON.parse(await file.slice(manifest.start, manifest.start + manifest.size).text());
      const files = entries.filter(e => e !== manifest);
      if (navigator.storage && navigator.storage.persist) { try { await navigator.storage.persist(); } catch (e) { /* ignore */ } }
      let bytes = 0;
      for (let i = 0; i < files.length; i++) {
        const e = files[i], ext = e.name.split('.').pop().toLowerCase();
        const blob = new Blob([file.slice(e.start, e.start + e.size)], { type: MIME[ext] || 'application/octet-stream' });
        await req((await store('files', 'readwrite')).put(blob, e.name));
        bytes += e.size;
        if (onProgress) onProgress(i + 1, files.length);
      }
      await req((await store('packs', 'readwrite')).put({ id: info.id, title: info.title, files: files.length, bytes, ts: Date.now() }));
      delete availCache[info.id]; urlCache.clear();
      return info;
    },
    async remove(id) {
      const s = await store('files', 'readwrite');
      const keys = await req(s.getAllKeys());
      const st = await store('files', 'readwrite');
      await Promise.all(keys.filter(k => k.startsWith('audio/' + id + '/') || k.startsWith('books/' + id + '/')).map(k => req(st.delete(k))));
      await req((await store('packs', 'readwrite')).delete(id));
      delete availCache[id]; urlCache.clear();
    },
    async usage() { try { return navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; } catch (e) { return null; } }
  };
})(window.App);
