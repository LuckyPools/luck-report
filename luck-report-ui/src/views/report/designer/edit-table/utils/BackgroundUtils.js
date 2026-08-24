/**
 * BackgroundUtils：设计器表格背景（套打图）统一处理
 * master 仅背景图；克隆层白色底 + 相同定位背景图（克隆层与 master 同为
 * 网格左上角原点，相同 background-position 可对齐），保证冻结区不透明。
 * .handsontable 根切换 ht-bgimage 类控制克隆层 td/th 透明（见 designer/table.css）
 */
export function applyTableBackground(bgImage) {
  document.querySelectorAll('.ht_master').forEach(master => {
    if (master.closest('.htContextMenu')) {
      return;
    }
    master.style.background = bgImage ? `url(${bgImage}) 50px 26px no-repeat` : 'transparent';
    const root = master.closest('.handsontable');
    if (root) {
      root.classList.toggle('ht-bgimage', !!bgImage);
    }
    const clones = master.parentElement.querySelectorAll('.ht_clone_top, .ht_clone_left, .ht_clone_top_left_corner');
    clones.forEach(clone => {
      clone.style.background = bgImage ? `#fff url(${bgImage}) 50px 26px no-repeat` : '';
    });
  });
}
