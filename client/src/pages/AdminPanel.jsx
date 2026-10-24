import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Menu, Button, Upload, Table, Tag, Form, Input,
  message, Popconfirm, Card, Statistic, Row, Col, Badge, Space, Alert
} from 'antd';
import {
  UploadOutlined, PlayCircleOutlined, StepForwardOutlined,
  TrophyOutlined, TeamOutlined, GiftOutlined, LogoutOutlined,
  ReloadOutlined, EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const LOGO = 'https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` } });

const GROUP_LABELS = { 1: 'Group A', 2: 'Group B', 3: 'Group C' };
const GROUP_COLORS = { 1: 'blue', 2: 'purple', 3: 'green' };

function roundToGroup(r) {
  if (r <= 3) return 1;
  if (r <= 6) return 2;
  return 3;
}

// ── PrizesTab component ─────────────────────────────────────────────
function PrizesTab() {
  const [prizes, setPrizes] = React.useState(
    Array.from({ length: 9 }, (_, i) => ({
      roundNo: i + 1,
      name: '',
      description: '',
      imageUrl: '',
    }))
  );
  const [saving, setSaving] = React.useState({});
  const [saved, setSaved]   = React.useState({});

  React.useEffect(() => {
    axios.get('/api/prizes', { headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` } })
      .then(r => {
        setPrizes(prev => prev.map(p => {
          const found = r.data.find(x => x.roundNo === p.roundNo);
          return found ? { ...p, ...found } : p;
        }));
      });
  }, []);

  const update = (roundNo, field, value) => {
    setPrizes(prev => prev.map(p => p.roundNo === roundNo ? { ...p, [field]: value } : p));
    setSaved(prev => ({ ...prev, [roundNo]: false }));
  };

  const saveOne = async (roundNo) => {
    const prize = prizes.find(p => p.roundNo === roundNo);
    if (!prize.name.trim()) { message.warning('Prize name is required'); return; }
    setSaving(prev => ({ ...prev, [roundNo]: true }));
    try {
      await axios.post(`/api/prizes`, prize, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` },
      });
      setSaved(prev => ({ ...prev, [roundNo]: true }));
      message.success(`Round ${roundNo} saved`);
    } catch (e) {
      message.error(e.response?.data?.message || 'Save failed');
    }
    setSaving(prev => ({ ...prev, [roundNo]: false }));
  };

  const saveAll = async () => {
    const filled = prizes.filter(p => p.name.trim());
    if (!filled.length) { message.warning('Fill at least one prize'); return; }
    setSaving({ all: true });
    try {
      await axios.post('/api/prizes/batch', { prizes: filled }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` },
      });
      const allSaved = {};
      filled.forEach(p => { allSaved[p.roundNo] = true; });
      setSaved(allSaved);
      message.success('All prizes saved!');
    } catch (e) {
      message.error(e.response?.data?.message || 'Batch save failed');
    }
    setSaving({});
  };

  const groupLabel = (r) => r <= 3 ? { label: 'Group A', color: 'blue' }
                              : r <= 6 ? { label: 'Group B', color: 'purple' }
                              :          { label: 'Group C', color: 'orange' };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>🎁 Prize Configuration — 9 Rounds</h2>
        <Button type="primary" size="large" loading={saving.all} onClick={saveAll}
          style={{ background: '#C8102E', borderColor: '#C8102E' }}>
          💾 Save All Prizes
        </Button>
      </div>
      {prizes.map(p => {
        const g = groupLabel(p.roundNo);
        return (
          <Card key={p.roundNo} style={{ marginBottom: 16, borderLeft: `4px solid ${g.color === 'blue' ? '#1677ff' : g.color === 'purple' ? '#722ed1' : '#fa8c16'}` }}
            bodyStyle={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 10 }}>
              <Tag color={g.color}>{g.label}</Tag>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Round {p.roundNo}</span>
              {saved[p.roundNo] && <Tag color="success">✓ Saved</Tag>}
            </div>
            <Row gutter={[12, 8]} align="middle">
              <Col xs={24} sm={7}>
                <Input
                  placeholder="Prize Name (e.g. CAR, BIKE)"
                  value={p.name}
                  onChange={e => update(p.roundNo, 'name', e.target.value)}
                  prefix={<span style={{ color: '#D4AF37' }}>🏆</span>}
                />
              </Col>
              <Col xs={24} sm={7}>
                <Input
                  placeholder="Description (e.g. Lucky Draw Diamond)"
                  value={p.description}
                  onChange={e => update(p.roundNo, 'description', e.target.value)}
                />
              </Col>
              <Col xs={24} sm={7}>
                <Input
                  placeholder="Image URL (optional)"
                  value={p.imageUrl}
                  onChange={e => update(p.roundNo, 'imageUrl', e.target.value)}
                  prefix="🖼"
                />
              </Col>
              <Col xs={24} sm={3}>
                <Button block type={saved[p.roundNo] ? 'default' : 'primary'}
                  loading={saving[p.roundNo]}
                  onClick={() => saveOne(p.roundNo)}
                  style={saved[p.roundNo] ? { borderColor: '#52c41a', color: '#52c41a' }
                                          : { background: '#C8102E', borderColor: '#C8102E' }}>
                  {saved[p.roundNo] ? '✓ Saved' : 'Save'}
                </Button>
              </Col>
            </Row>
          </Card>
        );
      })}
    </div>
  );
}

function AddEmployeeForm({ onAdded }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/employees/add', values,
        { headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` } });
      message.success(`Employee "${values.name}" added as #${data.employee.serialNo}`);
      form.resetFields();
      onAdded();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to add employee');
    } finally { setLoading(false); }
  };

  return (
    <Form form={form} layout="inline" onFinish={onFinish} style={{ flexWrap: 'wrap', gap: 8 }}>
      <Form.Item name="name" rules={[{ required: true, message: 'Name required' }]}>
        <Input placeholder="Name of Employee *" style={{ width: 200 }} />
      </Form.Item>
      <Form.Item name="payCode">
        <Input placeholder="Pay Code" style={{ width: 120 }} />
      </Form.Item>
      <Form.Item name="unit">
        <Input placeholder="Unit (PGTL/NGM…)" style={{ width: 110 }} />
      </Form.Item>
      <Form.Item name="gender">
        <Input placeholder="Gender" style={{ width: 90 }} />
      </Form.Item>
      <Form.Item name="department">
        <Input placeholder="Department" style={{ width: 140 }} />
      </Form.Item>
      <Form.Item name="designation">
        <Input placeholder="Designation" style={{ width: 130 }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}
          style={{ backgroundColor: '#C8102E', borderColor: '#C8102E' }}>
          Add Employee
        </Button>
      </Form.Item>
    </Form>
  );
}

function EmployeeTable({ onDeleted }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    axios.get('/api/employees',
      { headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/employees/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` } });
      message.success('Deleted');
      load();
      if (onDeleted) onDeleted();
    } catch { message.error('Delete failed'); }
  };

  const GROUP_COLORS = { 1: 'blue', 2: 'purple', 3: 'green' };
  const cols = [
    { title: '#', dataIndex: 'serialNo', width: 55 },
    { title: 'Group', dataIndex: 'group', width: 80,
      render: g => <Tag color={GROUP_COLORS[g]}>Grp {['A','B','C'][g-1]}</Tag> },
    { title: 'Pay Code', dataIndex: 'payCode', width: 100 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Unit', dataIndex: 'unit', width: 70 },
    { title: 'Gender', dataIndex: 'gender', width: 75 },
    { title: 'Department', dataIndex: 'department' },
    { title: 'Designation', dataIndex: 'designation' },
    { title: 'Won', dataIndex: 'hasWon', width: 70,
      render: v => v ? <Tag color="gold">🏆</Tag> : '—' },
    { title: '', width: 60,
      render: (_, r) => (
        <Popconfirm title="Delete this employee?" onConfirm={() => handleDelete(r._id)}>
          <Button size="small" danger type="link">Del</Button>
        </Popconfirm>
      )
    },
  ];

  return (
    <Table dataSource={data} columns={cols} rowKey="_id" loading={loading}
      pagination={{ pageSize: 20 }} size="small"
      rowClassName={r => r.hasWon ? 'bg-yellow-50' : ''} />
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [page, setPage] = useState('game');
  const [gameState, setGameState] = useState(null);
  const [winners, setWinners] = useState([]);
  const [summary, setSummary] = useState({ total: 0, groups: { 1: 0, 2: 0, 3: 0 } });
  const [prizes, setPrizes] = useState(Array.from({ length: 9 }, (_, i) => ({ roundNo: i + 1, name: '', description: '', imageUrl: '' })));
  const [isEditingPrizes, setIsEditingPrizes] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [prizeForm] = Form.useForm();

  const loadState = useCallback(async () => {
    try {
      const [stateRes, summaryRes, prizesRes] = await Promise.all([
        axios.get('/api/game/state', auth()),
        axios.get('/api/employees/summary', auth()),
        axios.get('/api/prizes', auth()),
      ]);
      setGameState(stateRes.data.state);
      setWinners(stateRes.data.winners);
      setSummary(summaryRes.data);
      if (prizesRes.data.length > 0) {
        const merged = Array.from({ length: 9 }, (_, i) => {
          const found = prizesRes.data.find(p => p.roundNo === i + 1);
          return found || { roundNo: i + 1, name: '', description: '', imageUrl: '' };
        });
        setPrizes(merged);
        prizeForm.setFieldsValue({ prizes: merged });
      }
    } catch (e) {
      if (e.response?.status === 401) navigate('/admin/login');
    }
  }, []);

  useEffect(() => { loadState(); const t = setInterval(loadState, 5000); return () => clearInterval(t); }, []);

  const handleUpload = async ({ file }) => {
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await axios.post('/api/employees/upload', fd, auth());
      message.success(`${data.total} employees uploaded! ~${data.groupSize} per group.`);
      loadState();
    } catch (e) { message.error(e.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
    return false;
  };

  const startGame = async () => {
    try { await axios.post('/api/game/start', {}, auth()); message.success('Game started!'); loadState(); }
    catch (e) { message.error(e.response?.data?.message || 'Error'); }
  };

  const spin = async () => {
    setSpinning(true);
    try {
      await axios.post('/api/game/spin', {}, auth());
      message.success('Spinning...');
      setTimeout(() => { setSpinning(false); loadState(); }, 7500);
    } catch (e) { message.error(e.response?.data?.message || 'Error'); setSpinning(false); }
  };

  const nextRound = async () => {
    try { await axios.post('/api/game/next-round', {}, auth()); message.success('Next round!'); loadState(); }
    catch (e) { message.error(e.response?.data?.message || 'Error'); }
  };

  const resetGame = async () => {
    try { await axios.post('/api/game/reset', {}, auth()); message.success('Game reset'); loadState(); }
    catch (e) { message.error(e.response?.data?.message || 'Error'); }
  };

  const savePrizes = async () => {
    const vals = prizeForm.getFieldValue('prizes');
    try { await axios.post('/api/prizes/batch', { prizes: vals }, auth()); message.success('Prizes saved!'); loadState(); }
    catch { message.error('Failed to save prizes'); }
  };

  const currentRound = gameState?.currentRound || 1;
  const currentGroup = roundToGroup(currentRound);
  const status = gameState?.status || 'idle';
  const isActive = gameState?.isActive || false;

  const winnerColumns = [
    { title: 'Round', dataIndex: 'roundNo', width: 70, render: r => <Tag color="red">R{r}</Tag> },
    { title: 'Group', dataIndex: 'group', width: 90, render: g => <Tag color={GROUP_COLORS[g]}>{GROUP_LABELS[g]}</Tag> },
    { title: '#', dataIndex: 'serialNo', width: 65 },
    { title: 'Name', dataIndex: ['employee', 'name'] },
    { title: 'Department', dataIndex: ['employee', 'department'] },
    { title: 'Prize', dataIndex: ['prize', 'name'], render: v => v || <span className="text-gray-400">—</span> },
  ];

  return (
    <Layout className="min-h-screen">
      <Header style={{ background: '#fff', borderBottom: '2px solid #C8102E', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={LOGO} alt="PG" style={{ height: 40, objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a1a' }}>Grand Diwali Lucky Draw — Admin</span>
        </div>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => window.open('/live', '_blank')}>Live Screen</Button>
          <Button icon={<LogoutOutlined />} danger onClick={() => { localStorage.removeItem('pg_admin_token'); navigate('/admin/login'); }}>Logout</Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={200} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <Menu mode="inline" selectedKeys={[page]} style={{ borderRight: 0, paddingTop: 8 }}
            onClick={({ key }) => setPage(key)}
            items={[
              { key: 'game', icon: <PlayCircleOutlined />, label: 'Game Control' },
              { key: 'prizes', icon: <GiftOutlined />, label: 'Prizes' },
              { key: 'winners', icon: <TrophyOutlined />, label: 'Winners' },
              { key: 'employees', icon: <TeamOutlined />, label: 'Employees' },
            ]}
          />
        </Sider>

        <Content style={{ padding: 24, background: '#f5f5f5' }}>

          {/* GAME CONTROL */}
          {page === 'game' && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                {[
                  { label: 'Total', value: summary.total, color: '#C8102E' },
                  { label: 'Group A', value: summary.groups?.[1] || 0 },
                  { label: 'Group B', value: summary.groups?.[2] || 0 },
                  { label: 'Group C', value: summary.groups?.[3] || 0 },
                ].map(s => (
                  <Col span={6} key={s.label}>
                    <Card><Statistic title={s.label} value={s.value} valueStyle={s.color ? { color: s.color, fontWeight: 700 } : {}} /></Card>
                  </Col>
                ))}
              </Row>

              <Card title="📂 Upload Employees" style={{ marginBottom: 16 }}>
                <p style={{ color: '#888', marginBottom: 12, fontSize: 13 }}>
                  CSV columns: <code>Name, EmployeeId, Department, Designation</code> — serial 1 to N, auto-split into 3 equal groups.
                </p>
                <Upload beforeUpload={f => { handleUpload({ file: f }); return false; }} showUploadList={false} accept=".csv">
                  <Button icon={<UploadOutlined />} loading={uploading} style={{ borderColor: '#C8102E', color: '#C8102E' }} size="large">
                    Upload CSV
                  </Button>
                </Upload>
              </Card>

              <Card
                title={
                  <Space>
                    <span>🎲 Game Control</span>
                    {isActive && <Badge status={status === 'spinning' ? 'processing' : 'success'} text={status === 'spinning' ? 'Spinning...' : status === 'revealed' ? 'Winner Revealed' : 'Ready'} />}
                  </Space>
                }
                extra={<Popconfirm title="Reset entire game?" onConfirm={resetGame}><Button icon={<ReloadOutlined />} danger size="small">Reset</Button></Popconfirm>}
              >
                {isActive ? (
                  <div>
                    <Alert type="info" style={{ marginBottom: 16 }}
                      message={<span style={{ fontSize: 16, fontWeight: 600 }}>Round <span style={{ color: '#C8102E' }}>{currentRound}</span> / 9 &nbsp;|&nbsp; <Tag color={GROUP_COLORS[currentGroup]}>{GROUP_LABELS[currentGroup]}</Tag></span>}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {Array.from({ length: 9 }, (_, i) => {
                        const r = i + 1;
                        const w = winners.find(w => w.roundNo === r);
                        return (
                          <div key={r} style={{ padding: '8px 12px', borderRadius: 8, border: `2px solid ${r === currentRound ? '#C8102E' : w ? '#52c41a' : '#e0e0e0'}`, background: r === currentRound ? '#fff0f0' : w ? '#f6ffed' : '#fafafa', minWidth: 90 }}>
                            <div style={{ fontSize: 11, color: '#888' }}>R{r} · {GROUP_LABELS[roundToGroup(r)]}</div>
                            {w ? <div style={{ fontSize: 11, fontWeight: 600, color: '#52c41a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85 }}>{w.employee?.name}</div>
                              : <div style={{ fontSize: 11, color: '#bbb' }}>{r === currentRound ? '← now' : '—'}</div>}
                          </div>
                        );
                      })}
                    </div>
                    <Space size="middle">
                      <Button
                        type="primary" size="large" icon={<PlayCircleOutlined />}
                        loading={spinning} onClick={spin}
                        disabled={status === 'spinning' || currentRound > 9}
                        style={{ backgroundColor: '#C8102E', borderColor: '#C8102E', height: 52, paddingInline: 36, fontSize: 17 }}
                      >
                        🎰 SPIN Round {currentRound}
                      </Button>
                      <Button
                        size="large" icon={<StepForwardOutlined />} onClick={nextRound}
                        disabled={status !== 'revealed' || currentRound >= 9}
                        style={{ height: 52, paddingInline: 28 }}
                      >
                        Next Round →
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🪔</div>
                    {summary.total === 0
                      ? <p style={{ color: '#888', marginBottom: 16 }}>Upload employees CSV first to start.</p>
                      : <p style={{ color: '#555', marginBottom: 16 }}><strong>{summary.total} employees</strong> ready across 3 groups.</p>
                    }
                    <Button type="primary" size="large" onClick={startGame} disabled={summary.total === 0}
                      style={{ backgroundColor: '#C8102E', borderColor: '#C8102E', height: 56, paddingInline: 56, fontSize: 20 }}>
                      🪔 Start Lucky Draw
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* PRIZES */}
          {page === 'prizes' && (
            <PrizesTab />
          )}

          {/* WINNERS */}
          {page === 'winners' && (
            <Card title={`🏆 Winners (${winners.length} / 9)`} style={{ maxWidth: 900, margin: '0 auto' }}>
              <Table dataSource={winners} columns={winnerColumns} rowKey="_id" pagination={false} locale={{ emptyText: 'No winners yet' }} />
            </Card>
          )}

          {/* EMPLOYEES */}
          {page === 'employees' && (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              {/* Manual Add Form */}
              <Card title="➕ Add Employee Manually" style={{ marginBottom: 16 }}>
                <AddEmployeeForm onAdded={loadState} />
              </Card>

              <Card title={`👥 Employees (${summary.total} total)`}
                extra={
                  <Popconfirm title="Clear ALL employees?" onConfirm={async () => {
                    await axios.delete('/api/employees/all', auth());
                    message.success('Cleared'); loadState();
                  }}>
                    <Button danger size="small">Clear All</Button>
                  </Popconfirm>
                }
              >
                <EmployeeTable onDeleted={loadState} />
              </Card>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
