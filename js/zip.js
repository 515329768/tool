/**
 * 轻量 ZIP 打包（STORE 无压缩）
 * 纯 JS 实现，不依赖 CDN，支持 file:// 离线使用
 */
(function (global) {
  'use strict';

  // CRC32 查表
  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(data) {
    var crc = 0xffffffff;
    for (var i = 0; i < data.length; i++) {
      crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * 将多个文件打包为 ZIP Blob
   * @param {Array<{name: string, blob: Blob}>} files
   * @returns {Promise<Blob>}
   */
  async function createZip(files) {
    var enc = new TextEncoder();
    var parts = [];
    var centralDir = [];
    var offset = 0;
    var usedNames = {};

    for (var f = 0; f < files.length; f++) {
      var file = files[f];
      var name = file.name;

      // 重名文件自动加序号
      if (usedNames[name]) {
        var dot = name.lastIndexOf('.');
        var base = dot >= 0 ? name.slice(0, dot) : name;
        var ext = dot >= 0 ? name.slice(dot) : '';
        var n = usedNames[name];
        usedNames[name] = n + 1;
        name = base + '(' + n + ')' + ext;
      } else {
        usedNames[name] = 1;
      }

      var nameBytes = enc.encode(name);
      var data = new Uint8Array(await file.blob.arrayBuffer());
      var checksum = crc32(data);

      // Local file header
      var localHeader = new Uint8Array(30 + nameBytes.length);
      var lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true); // STORE
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, checksum, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      parts.push(localHeader, data);

      // Central directory header
      var cdHeader = new Uint8Array(46 + nameBytes.length);
      var cv = new DataView(cdHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, checksum, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      cdHeader.set(nameBytes, 46);
      centralDir.push(cdHeader);

      offset += localHeader.length + data.length;
    }

    var centralDirSize = 0;
    for (var i = 0; i < centralDir.length; i++) {
      centralDirSize += centralDir[i].length;
    }

    var eocd = new Uint8Array(22);
    var ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralDirSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    parts = parts.concat(centralDir, [eocd]);
    return new Blob(parts, { type: 'application/zip' });
  }

  global.ImageZip = { createZip: createZip };
})(typeof window !== 'undefined' ? window : globalThis);
