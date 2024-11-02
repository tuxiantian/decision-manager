import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config'; 
const ArticleEditor = () => {
    const { id } = useParams(); // 获取路由参数中的文章 ID
    const navigate = useNavigate(); // 创建导航对象
    const editorRef = useRef();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [tags, setTags] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState('');
    const [errors, setErrors] = useState({}); // 保存字段错误信息

    // useEffect 钩子用于在组件加载时获取文章数据
    useEffect(() => {
        if (id) {
            axios.get(`${API_BASE_URL}/articles/${id}`)
                .then(response => {
                    const { title, content, author, tags, keywords } = response.data;
                    setTitle(title);
                    setContent(content);
                    setAuthor(author);
                    setTags(tags);
                    setKeywords(keywords ? keywords.split(',') : []);
                    if (editorRef.current) {
                        editorRef.current.getInstance().setMarkdown(content);
                    }
                })
                .catch(error => {
                    console.error('There was an error fetching the article!', error);
                });
        } else {
            // 如果是新增文章，则清空编辑器内容
            if (editorRef.current) {
                editorRef.current.getInstance().setMarkdown('');
            }
            if (tags === "") {
                setTags("ThinkingModel");
            }
        }
    }, [id]);

    const validateFields = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Title is required';

        // 使用 editorRef 获取富文本编辑器的内容
        const editorContent = editorRef.current?.getInstance().getMarkdown();
        if (!editorContent.trim()) newErrors.content = 'Content is required';

        if (!tags.trim()) newErrors.tags = 'Tag is required';
        if (keywords.length === 0) newErrors.keywords = 'At least one keyword is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddKeyword = () => {
        if (keywords.length >= 10) {
            alert("You can only add up to 10 keywords.");
            return;
        }
        if (keywordInput.trim()) {
            setKeywords([...keywords, keywordInput.trim()]);
            setKeywordInput('');
        }
    };

    const handleRemoveKeyword = (index) => {
        setKeywords(keywords.filter((_, i) => i !== index));
    };

    const goBack = ()=>{
        navigate('/articles');
    }

    const handleSave = () => {
        if (!validateFields()) {
            return; // 如果有错误，阻止提交
        }

        const newArticle = {
            title,
            content: editorRef.current.getInstance().getMarkdown(),
            author,
            tags, // 直接使用下拉选择的值
            keywords: keywords.join(',')
        };

        if (id) {
            // 更新已有文章
            axios.put(`${API_BASE_URL}/articles/${id}`, newArticle)
                .then(response => {
                    console.log('Article updated:', response.data);
                    navigate('/articles'); // 保存成功后跳转到文章列表
                })
                .catch(error => {
                    console.error('There was an error updating the article!', error);
                });
        } else {
            // 创建新文章
            axios.post(`${API_BASE_URL}/articles`, newArticle)
                .then(response => {
                    console.log('Article saved:', response.data);
                    navigate('/articles'); // 保存成功后跳转到文章列表
                })
                .catch(error => {
                    console.error('There was an error saving the article!', error);
                });
        }
    };

    const handleImageUpload = async (blob, callback) => {
        // 创建 FormData 对象，将 blob 作为参数
        const formData = new FormData();
        formData.append('file', blob);
    
        try {
          // 向 Flask 后端发送 POST 请求，将图片上传到 MinIO
          const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
    
          // 使用回调函数，将生成的 URL 设置到编辑器中
          const imageUrl = response.data.url;
          callback(imageUrl, 'Uploaded Image');
        } catch (error) {
          console.error('There was an error uploading the image:', error);
        }
      };

    return (
        <div style={{ width: '80%', margin: '0 auto' }}>
            <h2>{id ? 'Edit Article' : 'Create Article'}</h2>
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Title"
                    maxLength={255}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '1.2em' }} // 标题占据整行，宽度更大
                />
                {errors.title && <p style={{ color: 'red' }}>{errors.title}</p>}
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <input
                    type="text"
                    maxLength={50}
                    placeholder="Author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{ flex: 1, padding: '10px' }}
                />
                <select value={tags || "ThinkingModel"} onChange={(e) => setTags(e.target.value)} style={{ flex: 1, padding: '10px' }}>
                    <option value="">Select Tag</option>
                    <option value="ThinkingModel">Thinking Model</option>
                    <option value="CognitiveBias">Cognitive Bias</option>
                </select>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Add a keyword"
                        maxLength={25}
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        style={{ flex: 1, padding: '10px' }}
                    />
                    <button type="button" onClick={handleAddKeyword} style={{ marginLeft: '10px' }}  className='green-button'>Add Keyword</button>
                </div>
            </div>

            <div style={{ marginTop: '10px' }}>
                {keywords.map((keyword, index) => (
                    <div key={index} style={{ display: 'inline-block', marginRight: '10px' }}>
                        <span>{keyword}</span>
                        <button type="button"  className='red-button' onClick={() => handleRemoveKeyword(index)}>x</button>
                    </div>
                ))}
            </div>
            {errors.keywords && <p style={{ color: 'red' }}>{errors.keywords}</p>}

            <Editor
                initialValue={id ? content : ""} // 编辑时加载内容，新增时为空
                previewStyle="vertical"
                height="600px"
                initialEditType="markdown"
                useCommandShortcut={true}
                ref={editorRef}
                onChange={() => setContent(editorRef.current.getInstance().getMarkdown())}
                hooks={{
                    addImageBlobHook: (blob, callback) => handleImageUpload(blob, callback),
                  }}
            />
            {errors.content && <p style={{ color: 'red' }}>{errors.content}</p>}
            <button onClick={handleSave}  className='green-button' style={{marginTop:'10px'}}>Save Article</button>
            <button onClick={goBack}  className='green-button' style={{marginTop:'10px'}}>Go Back</button>
        </div>
    );
};

export default ArticleEditor;
