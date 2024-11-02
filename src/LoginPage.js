import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import JSEncrypt from 'jsencrypt';
import api from './components/api.js'
import './LoginPage.css'
import './App.css'

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsPIcYtKANnymGmDEwOje
5kO5cVrxxLj7qrUiiUUJOYhE2bfsFRqEqQgi7anrWkC1d6sL2pVJROF8tIsZzerM
DBcX4XYnmLHJm7jfTtYffZ6E1ZOHdmvYL9OI14+14D3Aw1DuaCBGXWoKLROkGAax
Q8vOUINULHpNMnevzQkK1EbxUZYADJNr6Nu8EDw1LbLxjUkI5CEHYw4nCjjbsfmx
BBEPLGUtH44OTGKoEXmgOTWUe7HaVLvWF6rpB3buPQDi1IeVptcXyTMChkg3UHF3
38ZQ36OT1x9do8oToP8+Eewe5wiF/mWX9xM/ek7p+hyZyEph931H4TFhCY0BPX6v
jQIDAQAB
-----END PUBLIC KEY-----
`;

        // 创建 JSEncrypt 实例并设置公钥
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);

        // 加密密码
        const encryptedPassword = encryptor.encrypt(password);

        if (!encryptedPassword) {
            console.error("Encryption failed");
            return;
        }
        try {
            const response = await api.post('/login', {
                username,
                'password':encryptedPassword,
            });

            if (response.status === 200) {
                // 登录成功后设置用户名，并存储到 localStorage
                const loggedInUsername = response.data.username;
                localStorage.setItem('username', loggedInUsername);
                onLogin(loggedInUsername); // 触发导航栏更新
                // 检查 URL 中是否有 redirect 参数
                const params = new URLSearchParams(location.search);
                const redirectUrl = params.get('redirect');

                // 如果有 redirect 参数，跳转到指定页面；否则跳转到默认页面
                if (redirectUrl) {
                    navigate(redirectUrl);
                } else {
                    navigate('/articles'); // 默认跳转路径
                }
            }
        } catch (error) {
            console.log(error);
            // 处理登录错误
            setError(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="login-container">
            <h2>Login to Decision App</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className='green-button'>Login</button>
            </form>
        </div>
    );
};

export default LoginPage;
