import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LOGO = 'https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png';

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async ({ username, password }) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('pg_admin_token', data.token);
      message.success('Login successful!');
      navigate('/admin');
    } catch (e) {
      if (e.response && e.response.data?.message) {
        message.error(e.response.data.message);
      } else {
        message.error('Cannot connect to backend server. Please verify backend is running on port 5000.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'pg@diwali2024'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🪔</div>
          <img src={LOGO} alt="PG" className="h-14 mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">PG Grand Diwali Lucky Draw 2026</p>
        </div>
        <Card className="shadow-2xl rounded-2xl border-0">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ username: 'admin', password: 'pg@diwali2024' }}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter username' }]}
            >
              <Input size="large" placeholder="admin" autoFocus />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password size="large" placeholder="pg@diwali2024" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{ backgroundColor: '#C8102E', borderColor: '#C8102E', height: 46, fontSize: 16 }}
            >
              Login
            </Button>
          </Form>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
            <div className="font-semibold mb-1 flex items-center justify-between">
              <span>🔑 Default Admin Credentials</span>
              <button
                type="button"
                onClick={fillCredentials}
                className="text-red-700 underline font-normal hover:text-red-900"
              >
                Auto-fill
              </button>
            </div>
            <div>Username: <code className="bg-amber-100 px-1 py-0.5 rounded">admin</code></div>
            <div className="mt-1">Password: <code className="bg-amber-100 px-1 py-0.5 rounded">pg@diwali2024</code> (or <code className="bg-amber-100 px-1 py-0.5 rounded">admin</code>)</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
