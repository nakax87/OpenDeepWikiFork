/**
 * esbuild 配置文件
 * 用于打包 widget 代码并压缩内联 CSS
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// CSS 压缩函数
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
    .replace(/\s+/g, ' ')             // 合并空白字符
    .replace(/\s*({|}|,|:|;)\s*/g, '$1') // 移除选择器周围的空白
    .replace(/;}/g, '}')             // 移除最后的分号
    .trim();
}

// 创建CSS压缩插件
const cssMinifierPlugin = {
  name: 'css-minifier',
  setup(build) {
    // 只处理styles.ts文件
    build.onLoad({ filter: /styles\.ts$/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, 'utf8');

      // 查找模板字符串中的CSS
      const cssRegex = /const styles = `\s*\n([\s\S]*?)\s*`;/g;

      // 替换为压缩后的CSS
      contents = contents.replace(cssRegex, (match, cssContent) => {
        return 'const styles = `' + minifyCSS(cssContent) + '`;';
      });

      return {
        contents,
        loader: 'ts'
      };
    });
  }
};

// 打包配置
async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: ['widget/index.ts'],
      bundle: true,
      minify: true,
      sourcemap: true,
      platform: 'browser',
      outfile: 'public/koala-chat-widget.js',
      plugins: [cssMinifierPlugin],
    });

    console.log('✅ Widget 构建成功');
  } catch (error) {
    console.error('❌ Widget 构建失败:', error);
    process.exit(1);
  }
}

build();
