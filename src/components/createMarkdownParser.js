import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import 'katex/dist/katex.min.css'; // 引入 KaTeX 样式

// 创建一个带有数学公式支持的 markdown-it 实例
const createMarkdownParser = () => {
  const mdParser = new MarkdownIt();
  mdParser.use(markdownItKatex); // 使用 KaTeX 解析数学公式
  return mdParser;
};

export default createMarkdownParser;
