import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // 启用凭证以携带 cookies
});
// 设置 Axios 响应拦截器
api.interceptors.response.use(
    response => response, // 对于成功响应，直接返回
    error => {
        if (error.response && error.response.status === 401) {
            // 使用当前页面路径作为重定向路径
            const currentPath = window.location.pathname + window.location.search;
            // 跳转到登录页面，并附加重定向参数
            if (window.location.pathname !== '/login') {
                const currentPath = window.location.pathname + window.location.search;
                window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }
        }
        return Promise.reject(error);
    }
);
export default api;
