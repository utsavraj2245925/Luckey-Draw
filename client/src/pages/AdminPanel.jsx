import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Menu, Button, Upload, Table, Tag, Form, Input, InputNumber,
  message, Popconfirm, Card, Statistic, Row, Col, Badge, Space, Alert, Modal, Select, Tooltip
} from 'antd';
import {
  UploadOutlined, PlayCircleOutlined, StepForwardOutlined,
  TrophyOutlined, TeamOutlined, GiftOutlined, LogoutOutlined,
  ReloadOutlined, EyeOutlined, DeleteOutlined, EditOutlined,
  FileExcelOutlined, DownloadOutlined, SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

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

function CardsTab() {
  const [total, setTotal]       = React.useState('');
  const [config, setConfig]     = React.useState(null);
  const [saving, setSaving]     = React.useState(false);
  const [showCards, setShow]    = React.useState(false);
  const [previewCard, setPreviewCard] = React.useState(null); // holds the card number
  const token = localStorage.getItem('pg_admin_token');
  const headers = { Authorization: `Bearer ${token}` };
  const { QRCodeSVG } = window.QRCode || {};

  React.useEffect(() => {
    axios.get('/api/cards/config', { headers }).then(r => {
      setConfig(r.data);
      if (r.data?.totalCards) { setTotal(String(r.data.totalCards)); setShow(true); }
    }).catch(() => {});
  }, []);

  const saveConfig = async () => {
    const n = parseInt(total);
    if (!n || n < 1) return message.warning('Enter a valid number');
    setSaving(true);
    try {
      const r = await axios.post('/api/cards/config', { totalCards: n }, { headers });
      setConfig(r.data);
      setShow(true);
      message.success(`${n} cards configured!`);
    } catch (e) { message.error('Failed to save'); }
    setSaving(false);
  };

  const doPrint = () => window.print();

  const totalCards = config?.totalCards || 0;
  const groupSize  = config?.groupSize  || 0;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#cards-print-root) { display: none !important; }
          #cards-print-root { display: block !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 8mm; }
        }
        #cards-print-root { display: none; }
        .visit-card {
          width: 85mm; height: 54mm;
          display: inline-flex; flex-direction: column;
          align-items: center; justify-content: space-between;
          padding: 5mm 6mm;
          border: 1.5px solid #D4AF37;
          border-radius: 4mm;
          box-sizing: border-box;
          background: #fff;
          page-break-inside: avoid;
          font-family: Arial, sans-serif;
          margin: 2mm;
          vertical-align: top;
        }
      `}</style>

      {/* Admin UI — hidden during print */}
      <div className="no-print">
        <h2 style={{ marginBottom: 16 }}>🃏 QR Visiting Cards</h2>

        {/* Config row */}
        <Card style={{ marginBottom: 20 }}>
          <Row gutter={12} align="middle" wrap>
            <Col>
              <InputNumber
                min={1} max={9999} size="large"
                value={total ? parseInt(total) : undefined}
                onChange={v => setTotal(String(v || ''))}
                placeholder="Total headcount e.g. 573"
                style={{ width: 240 }}
              />
            </Col>
            <Col>
              <Button type="primary" size="large" loading={saving} onClick={saveConfig}
                style={{ background: '#C8102E', borderColor: '#C8102E' }}>
                ✅ Set & Configure
              </Button>
            </Col>
            {totalCards > 0 && (
              <Col>
                <Button size="large" onClick={doPrint}
                  style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#000', fontWeight: 700 }}>
                  🖨️ Print All {totalCards} Cards
                </Button>
              </Col>
            )}
          </Row>
          {totalCards > 0 && (
            <div style={{ marginTop: 10, color: '#666', fontSize: 13 }}>
              Group A: <b>1 – {groupSize}</b> &nbsp;|&nbsp;
              Group B: <b>{groupSize + 1} – {groupSize * 2}</b> &nbsp;|&nbsp;
              Group C: <b>{groupSize * 2 + 1} – {totalCards}</b>
            </div>
          )}
        </Card>

        {/* Preview grid */}
        {showCards && totalCards > 0 && (
          <>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Preview — {totalCards} Cards</span>
              <span style={{ color: '#888', fontSize: 13 }}>(showing first 12 · all {totalCards} will print)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {Array.from({ length: Math.min(12, totalCards) }, (_, i) => i + 1).map(num => (
                <div key={num} onClick={() => setPreviewCard(num)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', display: 'inline-flex' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  title="Click to preview"
                >
                  <CardFace num={num} total={totalCards} groupSize={groupSize} />
                </div>
              ))}
              {totalCards > 12 && (
                <div style={{
                  width: 260, height: 165, border: '2px dashed #ddd', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#aaa', fontSize: 14, flexDirection: 'column', gap: 4
                }}>
                  <span style={{ fontSize: 28 }}>+{totalCards - 12}</span>
                  <span>more cards</span>
                  <span style={{ fontSize: 12 }}>will print</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Print area — all cards */}
      {showCards && totalCards > 0 && (
        <div id="cards-print-root">
          {Array.from({ length: totalCards }, (_, i) => i + 1).map(num => (
            <CardFace key={num} num={num} total={totalCards} groupSize={groupSize} print />
          ))}
        </div>
      )}

      <Modal
        open={previewCard !== null}
        onCancel={() => setPreviewCard(null)}
        footer={null}
        centered
        width={520}
        title={`Card Preview — Scan QR to verify`}
      >
        {previewCard && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '20px 0' }}>
            {/* Big card preview */}
            <div style={{
              transform: 'scale(1.6)', transformOrigin: 'top center',
              marginBottom: 80,
            }}>
              <CardFace num={previewCard} total={totalCards} groupSize={groupSize} />
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <Button
                disabled={previewCard <= 1}
                onClick={() => setPreviewCard(p => p - 1)}
              >← Prev</Button>
              <span style={{ fontWeight: 700, fontSize: 16, minWidth: 80, textAlign: 'center' }}>
                #{previewCard} of {totalCards}
              </span>
              <Button
                disabled={previewCard >= totalCards}
                onClick={() => setPreviewCard(p => p + 1)}
              >Next →</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// Single card face — used both in preview and print
function CardFace({ num, total, groupSize, print }) {
  const DIWALI_IMG = 'https://cdn.pixabay.com/photo/2017/10/17/18/37/diwali-2861073_640.png';

  const cardStyle = print ? {
    display: 'inline-flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'space-between',
    width: '85mm', height: '54mm', padding: '4mm 5mm',
    border: '2px solid #D4AF37', borderRadius: '3mm',
    boxSizing: 'border-box', background: '#fff',
    fontFamily: 'Arial, sans-serif', margin: '2mm',
    verticalAlign: 'top', pageBreakInside: 'avoid',
  } : {
    display: 'inline-flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'space-between',
    width: 260, height: 165, padding: '10px 14px',
    border: '2px solid #D4AF37', borderRadius: 10,
    background: '#fff', boxShadow: '0 4px 16px rgba(212,175,55,0.25)',
    fontFamily: 'Arial, sans-serif', boxSizing: 'border-box',
  };

  return (
    <div style={cardStyle}>

      {/* TOP ROW: PG Logo + Title */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img
          src="https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png"
          alt="PG" style={{ height: print ? '9mm' : 26, objectFit: 'contain' }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: print ? '7pt' : 10, color: '#C8102E', fontWeight: 900, letterSpacing: 0.5 }}>
            GRAND DIWALI LUCKY DRAW
          </div>
          <div style={{ fontSize: print ? '5pt' : 8, color: '#888' }}>2026 · PG Group</div>
        </div>
        <span style={{ fontSize: print ? '16pt' : 24 }}>🪔</span>
      </div>

      {/* MIDDLE ROW: Greeting + QR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: print ? '9pt' : 13, fontWeight: 800, color: '#D4AF37', fontFamily: 'Georgia, serif' }}>
            🪔 शुभ दीपावली 🪔
          </div>
          <div style={{ fontSize: print ? '6pt' : 9, color: '#C8102E', fontWeight: 600, marginTop: 3 }}>
            Happy Diwali
          </div>
          <div style={{ fontSize: print ? '5pt' : 8, color: '#888', marginTop: 2 }}>
            PG Group — Celebrating Together
          </div>
          <div style={{ fontSize: print ? '5pt' : 8, color: '#555', marginTop: 3, fontStyle: 'italic', lineHeight: 1.3 }}>
            PG Family Wishing you a bright new chapter and a prosperous year ahead.
          </div>
        </div>

        {/* QR only — no number text */}
        <div style={{ flexShrink: 0, padding: print ? '0 0 0 3mm' : '0 0 0 10px' }}>
          <QRCodeSVGWrapper value={String(num)} size={print ? 52 : 68} />
        </div>
      </div>

      {/* BOTTOM: scan instruction */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: print ? '4.5pt' : 7, color: '#aaa', borderTop: '1px solid #f0e0b0', paddingTop: print ? '1mm' : 4 }}>
          Scan QR to know your lucky draw number
        </div>
      </div>

    </div>
  );
}

// QR wrapper that works whether qrcode.react is imported or not
function QRCodeSVGWrapper({ value, size }) {
  return <QRCodeSVG value={String(value)} size={size} level="M" includeMargin={false} />;
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

function EmployeesTab({ summary, onRefresh }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [uploadMode, setUploadMode] = useState('replace');
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // Edit employee modal
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    axios.get('/api/employees', auth())
      .then(r => setData(r.data))
      .catch(() => message.error('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async ({ file }) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', uploadMode);
    try {
      const { data: res } = await axios.post('/api/employees/upload', fd, auth());
      message.success(res.message || `${res.total} employees uploaded successfully!`);
      setSelectedRowKeys([]);
      load();
      if (onRefresh) onRefresh();
    } catch (e) {
      message.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "Name of Employee,Pay Code,Unit,Gender,Department,Designation\n" +
      "Rahul Sharma,PT200001,PGTL,MALE,PAINT SHOP,Manager\n" +
      "Priya Patel,PT200002,NGM,FEMALE,QUALITY,Executive\n" +
      "Amit Kumar,PT200003,PGTL,MALE,PRODUCTION,Supervisor\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/employees/${id}`, auth());
      message.success('Employee deleted directly from database');
      load();
      if (onRefresh) onRefresh();
    } catch (e) {
      message.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const { data: res } = await axios.post('/api/employees/batch-delete', { ids: selectedRowKeys }, auth());
      message.success(res.message || 'Selected employees deleted from database');
      setSelectedRowKeys([]);
      load();
      if (onRefresh) onRefresh();
    } catch (e) {
      message.error(e.response?.data?.message || 'Batch delete failed');
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await axios.delete('/api/employees/all', auth());
      message.success('All employees permanently cleared from database');
      setData([]);
      setSelectedRowKeys([]);
      load();
      if (onRefresh) onRefresh();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to clear employees');
    } finally {
      setClearingAll(false);
    }
  };

  const openEditModal = (record) => {
    setEditingEmployee(record);
    editForm.setFieldsValue({
      name: record.name,
      payCode: record.payCode,
      unit: record.unit,
      gender: record.gender,
      department: record.department,
      designation: record.designation,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setSavingEdit(true);
      await axios.put(`/api/employees/${editingEmployee._id}`, values, auth());
      message.success('Employee updated in database');
      setEditModalVisible(false);
      setEditingEmployee(null);
      load();
      if (onRefresh) onRefresh();
    } catch (e) {
      if (e.response?.data?.message) {
        message.error(e.response.data.message);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchesGroup = selectedGroup === 'all' || String(item.group) === String(selectedGroup);
    if (!matchesGroup) return false;
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.payCode && item.payCode.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q)) ||
      (item.designation && item.designation.toLowerCase().includes(q)) ||
      (item.unit && item.unit.toLowerCase().includes(q)) ||
      (String(item.serialNo).includes(q))
    );
  });

  const GROUP_COLORS = { 1: 'blue', 2: 'purple', 3: 'green' };
  const cols = [
    { title: '#', dataIndex: 'serialNo', width: 60, sorter: (a, b) => a.serialNo - b.serialNo },
    {
      title: 'Group',
      dataIndex: 'group',
      width: 90,
      render: g => <Tag color={GROUP_COLORS[g] || 'default'}>Grp {['A', 'B', 'C'][g - 1] || g}</Tag>,
      filters: [
        { text: 'Group A', value: 1 },
        { text: 'Group B', value: 2 },
        { text: 'Group C', value: 3 },
      ],
      onFilter: (value, record) => record.group === value,
    },
    { title: 'Pay Code', dataIndex: 'payCode', width: 110 },
    { title: 'Name', dataIndex: 'name', ellipsis: true },
    { title: 'Unit', dataIndex: 'unit', width: 85 },
    { title: 'Gender', dataIndex: 'gender', width: 85 },
    { title: 'Department', dataIndex: 'department', ellipsis: true },
    { title: 'Designation', dataIndex: 'designation', ellipsis: true },
    {
      title: 'Won',
      dataIndex: 'hasWon',
      width: 75,
      render: v => (v ? <Tag color="gold">🏆 Won</Tag> : <span style={{ color: '#bbb' }}>—</span>),
    },
    {
      title: 'Action',
      width: 140,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEditModal(r)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this employee?"
            description={`Delete ${r.name} (#${r.serialNo}) directly from database?`}
            onConfirm={() => handleDelete(r._id)}
            okText="Yes, Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button size="small" danger type="link" icon={<DeleteOutlined />}>
              Del
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      {/* 1. Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: 'Total Employees', value: summary?.total || data.length, color: '#C8102E' },
          { label: 'Group A', value: summary?.groups?.[1] || 0, color: '#1677ff' },
          { label: 'Group B', value: summary?.groups?.[2] || 0, color: '#722ed1' },
          { label: 'Group C', value: summary?.groups?.[3] || 0, color: '#52c41a' },
        ].map(s => (
          <Col span={6} key={s.label}>
            <Card bodyStyle={{ padding: '16px 20px' }}>
              <Statistic
                title={<span style={{ fontWeight: 600 }}>{s.label}</span>}
                value={s.value}
                valueStyle={s.color ? { color: s.color, fontWeight: 700 } : {}}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 2. Relocated Upload Employees (Excel / CSV) */}
      <Card
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            <span style={{ fontWeight: 600 }}>Upload Employees (Excel / CSV)</span>
          </Space>
        }
        extra={
          <Button icon={<DownloadOutlined />} size="small" onClick={downloadSampleTemplate}>
            Download Sample CSV
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <p style={{ color: '#666', marginBottom: 14, fontSize: 13 }}>
          Upload your <b>Excel (.xlsx, .xls)</b> or <b>CSV</b> file. Serial numbers (1 to N) and 3 equal groups (A, B, C) are automatically assigned.
          <br />
          <span style={{ color: '#888' }}>
            Supported columns: <code>Name of Employee</code> (or <code>Name</code>), <code>Pay Code</code>, <code>Unit</code>, <code>Gender</code>, <code>Department</code>, <code>Designation</code>.
          </span>
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <Upload
            beforeUpload={f => { handleUpload({ file: f }); return false; }}
            showUploadList={false}
            accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              style={{ backgroundColor: '#C8102E', borderColor: '#C8102E', color: '#fff' }}
              size="large"
            >
              {uploading ? 'Processing & Uploading...' : 'Upload Excel / CSV'}
            </Button>
          </Upload>

          <Space align="center">
            <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>Upload Mode:</span>
            <Select
              value={uploadMode}
              onChange={setUploadMode}
              style={{ width: 230 }}
              options={[
                { value: 'replace', label: '🔄 Replace Database (Fresh list)' },
                { value: 'append', label: '➕ Append to Existing List' },
              ]}
            />
          </Space>
        </div>
      </Card>

      {/* 3. Add Employee Manually */}
      <Card title="➕ Add Employee Manually" style={{ marginBottom: 16 }}>
        <AddEmployeeForm onAdded={() => { load(); if (onRefresh) onRefresh(); }} />
      </Card>

      {/* 4. CRUD Table */}
      <Card
        title={`👥 Employees (${filteredData.length} ${filteredData.length !== data.length ? `filtered of ${data.length}` : 'total'})`}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => { load(); if (onRefresh) onRefresh(); }}
              loading={loading}
            >
              Refresh
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Delete ${selectedRowKeys.length} selected employee(s)?`}
                description="This will permanently delete them directly from the database and recalculate serial numbers."
                onConfirm={handleBatchDelete}
                okText="Yes, Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button danger type="primary" loading={batchDeleting} size="small" icon={<DeleteOutlined />}>
                  Delete Selected ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Permanently Clear ALL Employees?"
              description="This will delete every employee and winner record directly from the MongoDB database!"
              onConfirm={handleClearAll}
              okText="Yes, Delete All"
              okType="danger"
              cancelText="Cancel"
            >
              <Button danger size="small" loading={clearingAll}>Clear All</Button>
            </Popconfirm>
          </Space>
        }
      >
        {/* Search & Filter Toolbar */}
        <Row gutter={12} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Search by Name, Pay Code, Dept, Unit..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'All Groups' },
                { value: '1', label: 'Group A only' },
                { value: '2', label: 'Group B only' },
                { value: '3', label: 'Group C only' },
              ]}
            />
          </Col>
          {searchText && (
            <Col xs={24} sm={24} md={6}>
              <Button onClick={() => setSearchText('')} size="small">
                Reset Filter
              </Button>
            </Col>
          )}
        </Row>

        <Table
          rowSelection={rowSelection}
          dataSource={filteredData}
          columns={cols}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
          size="small"
          rowClassName={r => (r.hasWon ? 'bg-yellow-50' : '')}
        />
      </Card>

      {/* 5. Edit Employee Modal */}
      <Modal
        title={`✏️ Edit Employee (#${editingEmployee?.serialNo || ''} - ${editingEmployee?.name || ''})`}
        open={editModalVisible}
        onOk={handleSaveEdit}
        confirmLoading={savingEdit}
        onCancel={() => { setEditModalVisible(false); setEditingEmployee(null); }}
        okText="Save Changes to Database"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Employee Name" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="payCode" label="Pay Code">
                <Input placeholder="e.g. PT200016" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="Unit">
                <Input placeholder="e.g. PGTL / NGM" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="gender" label="Gender">
                <Select
                  allowClear
                  placeholder="Select Gender"
                  options={[
                    { value: 'MALE', label: 'MALE' },
                    { value: 'FEMALE', label: 'FEMALE' },
                    { value: 'OTHER', label: 'OTHER' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department">
                <Input placeholder="e.g. PAINT SHOP, IDU" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="designation" label="Designation">
            <Input placeholder="e.g. Manager, Executive, Operator" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
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

  const startGame = async () => {
    try { 
      await axios.post('/api/game/start', {}, auth()); 
      message.success('Game started!'); 
      loadState(); 
    }
    catch (e) { 
      console.error('Start Game Error:', e.response?.data || e);
      message.error(e.response?.data?.message || 'Error starting game'); 
    }
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
              { key: 'cards', icon: <span style={{ fontSize: 16 }}>🃏</span>, label: 'Cards' },
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
                            {w ? <div style={{ fontSize: 11, fontWeight: 600, color: '#52c41a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85 }}>#{w.winnerNumber}</div>
                              : <div style={{ fontSize: 11, color: '#bbb' }}>{r === currentRound ? '← now' : '—'}</div>}
                          </div>
                        );
                      })}
                    </div>

                    {gameState?.status === 'revealed' && (
                      <div style={{
                        margin: '16px 0',
                        padding: '14px 20px',
                        background: '#fff8e6',
                        border: '2px dashed #D4AF37',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#8B6914', fontSize: 14 }}>
                            ⚠️ Winner not present?
                          </div>
                          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                            If the card holder is absent or card is missing, spin again for a new winner.
                            The previous number will be excluded.
                          </div>
                        </div>
                        <Button
                          danger
                          size="large"
                          loading={spinning}
                          onClick={async () => {
                            setSpinning(true);
                            try {
                              await axios.post('/api/game/spin-again', {}, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` }
                              });
                              message.info('Spinning again for Round ' + gameState.currentRound);
                            } catch (e) {
                              message.error(e.response?.data?.message || 'Error');
                            }
                            setSpinning(false);
                          }}
                          style={{ whiteSpace: 'nowrap', minWidth: 140 }}
                        >
                          🔄 Spin Again
                        </Button>
                      </div>
                    )}

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
                      ? <p style={{ color: '#888', marginBottom: 16 }}>Configure cards first to start.</p>
                      : <p style={{ color: '#555', marginBottom: 16 }}><strong>{summary.total} cards</strong> ready across 3 groups.</p>
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

          {/* CARDS */}
          {page === 'cards' && (
            <CardsTab />
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
            <EmployeesTab summary={summary} onRefresh={loadState} />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
