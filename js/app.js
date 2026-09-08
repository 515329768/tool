/**
 * 图片格式转换工具
 * 纯前端实现：本地选择图片 → Canvas 转换格式/尺寸 → 下载
 */

(function () {
  'use strict';

  // DOM 元素
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const selectBtn = document.getElementById('selectBtn');
  const outputFormat = document.getElementById('outputFormat');
  const quality = document.getElementById('quality');
  const qualityValue = document.getElementById('qualityValue');
  const qualityGroup = document.getElementById('qualityGroup');
  const sizeInputs = document.getElementById('sizeInputs');
  const targetWidth = document.getElementById('targetWidth');
  const targetHeight = document.getElementById('targetHeight');
  const keepAspectRatio = document.getElementById('keepAspectRatio');
  const namePrefix = document.getElementById('namePrefix');
  const convertBtn = document.getElementById('convertBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const clearBtn = document.getElementById('clearBtn');
  const listSection = document.getElementById('listSection');
  const resultSection = document.getElementById('resultSection');
  const fileList = document.getElementById('fileList');
  const resultList = document.getElementById('resultList');
  const fileCount = document.getElementById('fileCount');
  const resultCount = document.getElementById('resultCount');

  /** @type {Array<{id: string, file: File, preview: string, width: number, height: number, status: string}>} */
  let pendingFiles = [];

  /** @type {Array<{id: string, name: string, blob: Blob, preview: string, width: number, height: number, size: number}>} */
  let convertedFiles = [];

  // ---------- 工具函数 ----------

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getExt(mime) {
    return mime === 'image/png' ? 'png' : 'jpg';
  }

  function getSizeMode() {
    return document.querySelector('input[name="sizeMode"]:checked').value;
  }

  /**
   * 根据设置计算输出尺寸
   * @param {number} srcW 原图宽
   * @param {number} srcH 原图高
   * @returns {{width: number, height: number}}
   */
  function calcOutputSize(srcW, srcH) {
    if (getSizeMode() === 'original') {
      return { width: srcW, height: srcH };
    }

    const w = parseInt(targetWidth.value, 10);
    const h = parseInt(targetHeight.value, 10);
    const keepRatio = keepAspectRatio.checked;

    if (!w && !h) {
      return { width: srcW, height: srcH };
    }

    if (w && h) {
      if (keepRatio) {
        const ratio = Math.min(w / srcW, h / srcH);
        return {
          width: Math.round(srcW * ratio),
          height: Math.round(srcH * ratio),
        };
      }
      return { width: w, height: h };
    }

    if (w) {
      const ratio = w / srcW;
      return {
        width: w,
        height: keepRatio ? Math.round(srcH * ratio) : srcH,
      };
    }

    const ratio = h / srcH;
    return {
      width: keepRatio ? Math.round(srcW * ratio) : srcW,
      height: h,
    };
  }

  /**
   * 加载图片文件，返回 Image 对象及原始尺寸
   * @param {File} file
   */
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        resolve({ img: img, width: img.naturalWidth, height: img.naturalHeight, url: url });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };
      img.src = url;
    });
  }

  /**
   * Canvas 转换单张图片
   * @param {HTMLImageElement} img
   * @param {number} outW
   * @param {number} outH
   * @param {string} mime
   * @param {number} q JPG 质量 0-1
   */
  function convertImage(img, outW, outH, mime, q) {
    return new Promise(function (resolve, reject) {
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');

      // JPG 不支持透明，填充白底
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }

      ctx.drawImage(img, 0, 0, outW, outH);

      canvas.toBlob(
        function (blob) {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('转换失败'));
          }
        },
        mime,
        mime === 'image/jpeg' ? q : undefined
      );
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildOutputName(originalName) {
    const prefix = namePrefix.value.trim();
    const ext = getExt(outputFormat.value);
    const base = originalName.replace(/\.[^.]+$/, '');
    return (prefix || '') + base + '.' + ext;
  }

  // ---------- UI 渲染 ----------

  function renderPendingList() {
    fileCount.textContent = pendingFiles.length;
    listSection.hidden = pendingFiles.length === 0;
    convertBtn.disabled = pendingFiles.length === 0;

    fileList.innerHTML = pendingFiles
      .map(function (item) {
        return (
          '<div class="file-item" data-id="' +
          item.id +
          '">' +
          '<img class="thumb" src="' +
          item.preview +
          '" alt="">' +
          '<div class="file-info">' +
          '<div class="file-name">' +
          escapeHtml(item.file.name) +
          '</div>' +
          '<div class="file-meta">' +
          item.width +
          ' × ' +
          item.height +
          ' · ' +
          formatSize(item.file.size) +
          '</div>' +
          '</div>' +
          '<span class="file-status ' +
          item.status +
          '">' +
          statusText(item.status) +
          '</span>' +
          '<div class="file-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm remove-btn" data-id="' +
          item.id +
          '">移除</button>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    fileList.querySelectorAll('.remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeFile(btn.dataset.id);
      });
    });
  }

  function renderResultList() {
    resultCount.textContent = convertedFiles.length;
    resultSection.hidden = convertedFiles.length === 0;
    downloadAllBtn.disabled = convertedFiles.length === 0;

    resultList.innerHTML = convertedFiles
      .map(function (item) {
        return (
          '<div class="file-item">' +
          '<img class="thumb" src="' +
          item.preview +
          '" alt="">' +
          '<div class="file-info">' +
          '<div class="file-name">' +
          escapeHtml(item.name) +
          '</div>' +
          '<div class="file-meta">' +
          item.width +
          ' × ' +
          item.height +
          ' · ' +
          formatSize(item.size) +
          '</div>' +
          '</div>' +
          '<div class="file-actions">' +
          '<button type="button" class="btn btn-primary btn-sm dl-btn" data-id="' +
          item.id +
          '">下载</button>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    resultList.querySelectorAll('.dl-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = convertedFiles.find(function (f) {
          return f.id === btn.dataset.id;
        });
        if (item) downloadBlob(item.blob, item.name);
      });
    });
  }

  function statusText(s) {
    const map = { pending: '待转换', processing: '转换中', done: '已完成', error: '失败' };
    return map[s] || s;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- 文件操作 ----------

  async function addFiles(fileList) {
    const files = Array.from(fileList).filter(function (f) {
      return f.type.startsWith('image/');
    });

    if (files.length === 0) return;

    for (const file of files) {
      try {
        const loaded = await loadImage(file);
        pendingFiles.push({
          id: uid(),
          file: file,
          preview: loaded.url,
          width: loaded.width,
          height: loaded.height,
          status: 'pending',
        });
      } catch (e) {
        console.warn('跳过无效图片:', file.name, e);
      }
    }

    renderPendingList();
  }

  function removeFile(id) {
    const idx = pendingFiles.findIndex(function (f) {
      return f.id === id;
    });
    if (idx >= 0) {
      URL.revokeObjectURL(pendingFiles[idx].preview);
      pendingFiles.splice(idx, 1);
      renderPendingList();
    }
  }

  function clearAll() {
    pendingFiles.forEach(function (f) {
      URL.revokeObjectURL(f.preview);
    });
    convertedFiles.forEach(function (f) {
      URL.revokeObjectURL(f.preview);
    });
    pendingFiles = [];
    convertedFiles = [];
    fileInput.value = '';
    renderPendingList();
    renderResultList();
  }

  async function startConvert() {
    if (pendingFiles.length === 0) return;

    convertBtn.disabled = true;
    const mime = outputFormat.value;
    const q = parseInt(quality.value, 10) / 100;

    for (const item of pendingFiles) {
      if (item.status === 'done') continue;

      item.status = 'processing';
      renderPendingList();

      try {
        const loaded = await loadImage(item.file);
        const size = calcOutputSize(loaded.width, loaded.height);
        const blob = await convertImage(loaded.img, size.width, size.height, mime, q);
        URL.revokeObjectURL(loaded.url);

        const outName = buildOutputName(item.file.name);
        const preview = URL.createObjectURL(blob);

        convertedFiles.push({
          id: uid(),
          name: outName,
          blob: blob,
          preview: preview,
          width: size.width,
          height: size.height,
          size: blob.size,
        });

        item.status = 'done';
      } catch (e) {
        item.status = 'error';
        console.error('转换失败:', item.file.name, e);
      }

      renderPendingList();
      renderResultList();
    }

    convertBtn.disabled = false;
  }

  /**
   * 打包下载全部：单张直接下载，多张本地 ZIP 打包（不依赖 CDN）
   */
  async function downloadAll() {
    if (convertedFiles.length === 0) return;

    if (convertedFiles.length === 1) {
      downloadBlob(convertedFiles[0].blob, convertedFiles[0].name);
      return;
    }

    downloadAllBtn.disabled = true;
    downloadAllBtn.textContent = '打包中...';

    try {
      if (!window.ImageZip || typeof window.ImageZip.createZip !== 'function') {
        throw new Error('ZIP 模块未加载');
      }

      const zipBlob = await window.ImageZip.createZip(
        convertedFiles.map(function (item) {
          return { name: item.name, blob: item.blob };
        })
      );
      downloadBlob(zipBlob, 'converted_images.zip');
    } catch (e) {
      console.error('ZIP 打包失败，改为逐张下载:', e);
      for (var i = 0; i < convertedFiles.length; i++) {
        downloadBlob(convertedFiles[i].blob, convertedFiles[i].name);
        if (i < convertedFiles.length - 1) {
          await new Promise(function (r) {
            setTimeout(r, 300);
          });
        }
      }
    } finally {
      downloadAllBtn.disabled = convertedFiles.length === 0;
      downloadAllBtn.textContent = '打包下载全部';
    }
  }

  // ---------- 事件绑定 ----------

  selectBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) {
      addFiles(fileInput.files);
    }
  });

  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', function () {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  });

  outputFormat.addEventListener('change', function () {
    qualityGroup.hidden = outputFormat.value !== 'image/jpeg';
  });

  quality.addEventListener('input', function () {
    qualityValue.textContent = quality.value;
  });

  document.querySelectorAll('input[name="sizeMode"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      sizeInputs.hidden = getSizeMode() !== 'custom';
    });
  });

  convertBtn.addEventListener('click', startConvert);
  downloadAllBtn.addEventListener('click', downloadAll);
  clearBtn.addEventListener('click', clearAll);

  // 初始化 JPG 质量显示
  qualityValue.textContent = quality.value;
})();
