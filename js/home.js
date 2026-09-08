/**
 * 首页工具列表渲染
 */
(function () {
  'use strict';

  var grid = document.getElementById('toolGrid');
  var countEl = document.getElementById('toolCount');
  var tools = window.TOOLS_CONFIG || [];

  if (!grid) return;

  countEl.textContent = tools.length + ' 个工具';

  if (tools.length === 0) {
    grid.innerHTML =
      '<div class="empty-tip">暂无可用工具，请在 js/tools-config.js 中添加配置。</div>';
    return;
  }

  grid.innerHTML = tools
    .map(function (tool) {
      var tags = (tool.tags || [])
        .map(function (t) {
          return '<span class="tool-tag">' + escapeHtml(t) + '</span>';
        })
        .join('');

      return (
        '<a class="tool-card" href="' +
        escapeHtml(tool.path) +
        '">' +
        '<div class="tool-card-head">' +
        '<h2 class="tool-name">' +
        escapeHtml(tool.name) +
        '</h2>' +
        (tags ? '<div class="tool-tags">' + tags + '</div>' : '') +
        '</div>' +
        '<p class="tool-desc">' +
        escapeHtml(tool.desc) +
        '</p>' +
        '<span class="tool-link">进入工具 →</span>' +
        '</a>'
      );
    })
    .join('');

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
