import React from 'react';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import createMarkdownParser from './createMarkdownParser';

// 使用自定义的 Markdown 渲染器
const MarkdownViewer = ({ markdownContent }) => {
  // 预处理 Markdown 内容，将 \[...\] 替换为 $$...$$
  const processedMarkdownContent = markdownContent
    .replace(/\\\[/g, '$$') // 将 \[ 替换为 $$
    .replace(/\\\]/g, '$$'); // 将 \] 替换为 $$

  // 使用自定义 Markdown 解析器解析 Markdown 内容
  const markdownParser = createMarkdownParser();
  const htmlContent = markdownParser.render(processedMarkdownContent);

  return (
    <div
      className="toastui-editor-contents"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownViewer;
