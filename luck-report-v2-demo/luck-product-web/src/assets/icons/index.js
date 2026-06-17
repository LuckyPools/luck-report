const req = require.context('@/assets/icons/svg',false,/\.svg$/)
const requireAll = requireContext =>{
    requireContext.keys().map(requireContext)
}
requireAll(req)

// 本地图标名称
export const svgNames = req.keys().map((fileName) => fileName.replace(/^.\/(.+)\.svg$/, '$1'));
