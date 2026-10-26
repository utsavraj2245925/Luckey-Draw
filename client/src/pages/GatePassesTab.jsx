import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Row, Col, Input, InputNumber, Select, Button, Tag, Space,
  Statistic, Empty, Spin, Modal, message, Tooltip, Pagination, Alert
} from 'antd';
import {
  PrinterOutlined, SearchOutlined, QrcodeOutlined,
  EyeOutlined, CopyOutlined, CheckCircleOutlined,
  FilterOutlined, ReloadOutlined, SettingOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { QRCode } from 'antd';
import axios from 'axios';

const { Option } = Select;
const LOGO = 'https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png';
const GROUP_LABELS = { 1: 'Group A', 2: 'Group B', 3: 'Group C' };
const GROUP_COLORS = { 1: '#1677ff', 2: '#722ed1', 3: '#52c41a' };
const GROUP_BG = { 1: '#eff6ff', 2: '#f5f3ff', 3: '#f0fdf4' };

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` } });

export default function GatePassesTab() {
  const [totalQuantity, setTotalQuantity] = useState(750);
  const [inputQuantity, setInputQuantity] = useState(750);
  const [savingQuantity, setSavingQuantity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [printAllMode, setPrintAllMode] = useState(false);

  const [localNetworkIp, setLocalNetworkIp] = useState('');
  const [qrHost, setQrHost] = useState('');

  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load current game configuration and network IP
  const loadConfig = async () => {
    setLoading(true);
    try {
      const [res, netRes] = await Promise.all([
        axios.get('/api/game/state', auth()),
        axios.get('/api/game/server-info').catch(() => ({ data: {} })),
      ]);
      const total = res.data.state?.totalEmployees || 750;
      setTotalQuantity(total);
      setInputQuantity(total);

      const detectedIp = netRes.data?.localIp;
      if (detectedIp && detectedIp !== 'localhost') {
        setLocalNetworkIp(detectedIp);
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
          setQrHost(`http://${detectedIp}:5173`);
        } else {
          setQrHost(window.location.origin);
        }
      } else {
        setQrHost(window.location.origin);
      }
    } catch {
      setTotalQuantity(750);
      setInputQuantity(750);
      setQrHost(window.location.origin);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Compute group breakdown based on totalQuantity
  const size = Math.ceil(totalQuantity / 3);
  const groupRanges = useMemo(() => ({
    1: { start: 1, end: size, count: size },
    2: { start: size + 1, end: Math.min(size * 2, totalQuantity), count: Math.min(size * 2, totalQuantity) - size },
    3: { start: size * 2 + 1, end: totalQuantity, count: totalQuantity - (size * 2) },
  }), [totalQuantity, size]);

  const handleSaveQuantity = async () => {
    const val = parseInt(inputQuantity, 10);
    if (!val || val < 3) {
      message.error('Please enter a valid quantity of at least 3 people');
      return;
    }
    setSavingQuantity(true);
    try {
      await axios.post('/api/game/set-quantity', { total: val }, auth());
      setTotalQuantity(val);
      setCurrentPage(1);
      message.success(`Successfully configured for ${val} visiting cards (Group A: 1-${Math.ceil(val / 3)}, Group B: ${Math.ceil(val / 3) + 1}-${Math.min(Math.ceil(val / 3) * 2, val)}, Group C: ${Math.ceil(val / 3) * 2 + 1}-${val})`);
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to update quantity');
    } finally {
      setSavingQuantity(false);
    }
  };

  // Generate the cards list from 1 to totalQuantity
  const allCards = useMemo(() => {
    const list = [];
    for (let i = 1; i <= totalQuantity; i++) {
      let group = 1;
      if (i <= size) group = 1;
      else if (i <= size * 2) group = 2;
      else group = 3;

      list.push({
        number: i,
        group,
        token: `PG-2026-${String(i).padStart(4, '0')}`,
      });
    }
    return list;
  }, [totalQuantity, size]);

  // Filtered cards based on search and selected group
  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      const matchesGroup = selectedGroup === 'all' || String(card.group) === String(selectedGroup);
      const q = search.trim();
      const matchesSearch = !q || String(card.number).includes(q) || card.token.includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [allCards, selectedGroup, search]);

  // Paginated cards for on-screen viewing
  const paginatedCards = useMemo(() => {
    if (printAllMode) return filteredCards;
    const start = (currentPage - 1) * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, currentPage, pageSize, printAllMode]);

  const getCardUrl = (num) => {
    const base = (qrHost || window.location.origin).replace(/\/$/, '');
    return `${base}/ticket/${num}`;
  };

  const handlePrint = (all = false) => {
    if (filteredCards.length === 0) {
      message.warning('No cards to print');
      return;
    }
    setPrintAllMode(true);
    setTimeout(() => {
      window.print();
      setPrintAllMode(false);
    }, 300);
  };

  const copyUrl = (num) => {
    const url = getCardUrl(num);
    navigator.clipboard.writeText(url);
    message.success(`Ticket #${num} link copied!`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Configuration & Quantity Card */}
      <Card
        className="no-print"
        title={
          <Space>
            <SettingOutlined style={{ color: '#c8102e' }} />
            <span>⚙️ Visiting Cards Generator — Set Total People Quantity</span>
          </Space>
        }
        style={{ marginBottom: 20, borderLeft: '4px solid #C8102E' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>
              Number of People / Visiting Cards:
            </div>
            <Space size="middle" wrap>
              <InputNumber
                min={3}
                max={5000}
                value={inputQuantity}
                onChange={v => setInputQuantity(v)}
                size="large"
                style={{ width: 180, fontWeight: 700, fontSize: 18 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                loading={savingQuantity}
                onClick={handleSaveQuantity}
                style={{ background: '#C8102E', borderColor: '#C8102E', fontWeight: 700 }}
              >
                Apply & Generate Cards
              </Button>
            </Space>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Enter the exact count (e.g. 750, 576, etc.). Unique QR cards will be numbered from 1 to {totalQuantity}.
            </div>
          </Col>

          <Col xs={24} md={12}>
            <Alert
              type="info"
              message={<span style={{ fontWeight: 700 }}>Group Ranges (Equal 3-Way Auto Split)</span>}
              description={
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  <div><strong>Total:</strong> {totalQuantity} Cards (Numbered 1 to {totalQuantity})</div>
                  <div><Tag color="blue">Group A:</Tag> Numbers <strong>{groupRanges[1].start} – {groupRanges[1].end}</strong> ({groupRanges[1].count} people)</div>
                  <div><Tag color="purple">Group B:</Tag> Numbers <strong>{groupRanges[2].start} – {groupRanges[2].end}</strong> ({groupRanges[2].count} people)</div>
                  <div><Tag color="green">Group C:</Tag> Numbers <strong>{groupRanges[3].start} – {groupRanges[3].end}</strong> ({groupRanges[3].count} people)</div>
                </div>
              }
            />
          </Col>
        </Row>

        {/* QR Code Target Host setting */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={8}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                📱 QR Code Target Domain / IP:
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Used when scanning from mobile phones
              </div>
            </Col>
            <Col xs={24} sm={16}>
              <Space wrap style={{ width: '100%' }}>
                <Input
                  value={qrHost}
                  onChange={e => setQrHost(e.target.value)}
                  style={{ width: 280, fontWeight: 600 }}
                  placeholder="e.g. http://192.168.18.64:5173"
                />
                {localNetworkIp && (
                  <Button
                    size="small"
                    onClick={() => setQrHost(`http://${localNetworkIp}:5173`)}
                  >
                    Use Wi-Fi IP ({localNetworkIp})
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={() => setQrHost(window.location.origin)}
                >
                  Use Browser URL
                </Button>
              </Space>
              <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>
                ℹ️ <strong>Why this matters:</strong> Phones cannot connect to <code>localhost</code>. By using your computer's Wi-Fi IP (<code>http://{localNetworkIp || '192.168.18.64'}:5173</code>), phones on the same Wi-Fi can scan and open the card directly.
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="no-print">
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: 16 }}>
              <Statistic
                title="Total Visiting Cards"
                value={totalQuantity}
                prefix={<QrcodeOutlined style={{ color: '#c8102e', marginRight: 6 }} />}
                valueStyle={{ color: '#c8102e', fontWeight: 800 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: 16 }}>
              <Statistic
                title="Group A Cards"
                value={`${groupRanges[1].start}-${groupRanges[1].end}`}
                valueStyle={{ color: '#1677ff', fontWeight: 700, fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: 16 }}>
              <Statistic
                title="Group B Cards"
                value={`${groupRanges[2].start}-${groupRanges[2].end}`}
                valueStyle={{ color: '#722ed1', fontWeight: 700, fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bodyStyle={{ padding: 16 }}>
              <Statistic
                title="Group C Cards"
                value={`${groupRanges[3].start}-${groupRanges[3].end}`}
                valueStyle={{ color: '#52c41a', fontWeight: 700, fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Action Controls & Filters */}
        <Card bodyStyle={{ padding: '16px 20px' }} style={{ marginBottom: 20 }}>
          <Row gutter={[16, 12]} align="middle" justify="space-between">
            <Col xs={24} md={12}>
              <Space wrap size="middle">
                <Input
                  prefix={<SearchOutlined style={{ color: '#aaa' }} />}
                  placeholder="Search token # (e.g. 42, 192)..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  style={{ width: 220 }}
                  allowClear
                />
                <Select
                  value={selectedGroup}
                  onChange={v => { setSelectedGroup(v); setCurrentPage(1); }}
                  style={{ width: 150 }}
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="all">All Groups ({totalQuantity})</Option>
                  <Option value="1">Group A ({groupRanges[1].count})</Option>
                  <Option value="2">Group B ({groupRanges[2].count})</Option>
                  <Option value="3">Group C ({groupRanges[3].count})</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={loadConfig} />
              </Space>
            </Col>

            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Space wrap>
                <span style={{ color: '#64748b', fontSize: 13, marginRight: 8 }}>
                  Showing <strong>{filteredCards.length}</strong> cards
                </span>
                <Button
                  type="primary"
                  size="large"
                  icon={<PrinterOutlined />}
                  onClick={() => handlePrint(true)}
                  style={{ background: '#C8102E', borderColor: '#C8102E', fontWeight: 700, paddingInline: 24 }}
                >
                  Print Visiting Cards ({filteredCards.length})
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Cards Display Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" tip="Generating unique QR visiting cards..." />
        </div>
      ) : filteredCards.length === 0 ? (
        <Card className="no-print" style={{ textAlign: 'center', padding: 40 }}>
          <Empty description="No cards match your filter." />
        </Card>
      ) : (
        <div id="printable-passes-area">
          <div className="visiting-cards-print-grid">
            {paginatedCards.map((card) => {
              const cardUrl = getCardUrl(card.number);

              return (
                <div
                  key={card.number}
                  className="visiting-card-item"
                  style={{
                    background: '#ffffff',
                    border: '1.5px dashed #94a3b8',
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    height: '100%',
                    minHeight: 170,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Top Header: Logo + Diwali Greeting */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fee2e2', paddingBottom: 6, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img src={LOGO} alt="PG Logo" style={{ height: 26, objectFit: 'contain' }} />
                      <div style={{ lineHeight: 1.1 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#c8102e', letterSpacing: 0.5 }}>
                          🪔 SHUBH DEEPAWALI 🪔
                        </div>
                        <div style={{ fontSize: 8, color: '#991b1b', fontWeight: 600 }}>
                          PG Grand Diwali Lucky Draw 2026
                        </div>
                      </div>
                    </div>
                    <Tag color={GROUP_COLORS[card.group]} style={{ margin: 0, fontWeight: 800, fontSize: 11, borderRadius: 10, padding: '1px 8px' }}>
                      {GROUP_LABELS[card.group]}
                    </Tag>
                  </div>

                  {/* Visiting Card Main Content: QR Code + Lucky Number */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    {/* Left: Scannable QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ padding: 4, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                        <QRCode
                          value={cardUrl}
                          size={76}
                          bordered={false}
                        />
                      </div>
                      <span style={{ fontSize: 8, color: '#64748b', fontWeight: 700, marginTop: 2 }}>
                        Scan for Lucky Draw
                      </span>
                    </div>

                    {/* Right: Unique Lucky Number & Greetings */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1 }}>
                        LUCKY NUMBER
                      </div>
                      <div style={{
                        fontSize: 34,
                        fontWeight: 900,
                        fontFamily: 'Georgia, serif',
                        color: '#c8102e',
                        lineHeight: 1,
                        margin: '2px 0 6px 0',
                      }}>
                        #{card.number}
                      </div>
                      <div style={{ fontSize: 9, color: '#b45309', fontWeight: 600, lineHeight: 1.25, background: '#fef3c7', padding: '3px 6px', borderRadius: 4 }}>
                        ✨ Wishing you & your family joy, prosperity & good health! ✨
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Token ID & Print Cut Guide */}
                  <div style={{
                    marginTop: 8,
                    paddingTop: 4,
                    borderTop: '1px dashed #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 8,
                    color: '#94a3b8',
                  }}>
                    <span>TOKEN: {card.token}</span>
                    <span className="no-print" style={{ display: 'flex', gap: 6 }}>
                      <a onClick={() => { setSelectedCard(card); setIsModalOpen(true); }} style={{ color: '#c8102e', fontWeight: 700 }}>
                        <EyeOutlined /> View
                      </a>
                      <a onClick={() => copyUrl(card.number)} style={{ color: '#64748b' }}>
                        <CopyOutlined /> Link
                      </a>
                    </span>
                    <span className="print-only" style={{ display: 'none', color: '#94a3b8' }}>
                      ✂️ Cut here
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for screen view */}
          {!printAllMode && filteredCards.length > pageSize && (
            <div className="no-print" style={{ textAlign: 'center', marginTop: 24, marginBottom: 20 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredCards.length}
                onChange={(p, s) => { setCurrentPage(p); setPageSize(s); }}
                showSizeChanger
                pageSizeOptions={['20', '30', '50', '100']}
              />
            </div>
          )}
        </div>
      )}

      {/* Single Visiting Card Preview Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Close</Button>,
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => selectedCard && copyUrl(selectedCard.number)}
          >
            Copy Phone Scan Link
          </Button>,
          <Button
            key="open"
            type="primary"
            icon={<EyeOutlined />}
            style={{ background: '#C8102E', borderColor: '#C8102E' }}
            onClick={() => {
              if (selectedCard) {
                window.open(`/ticket/${selectedCard.number}`, '_blank');
              }
            }}
          >
            Open Card Link
          </Button>,
        ]}
        width={420}
        centered
      >
        {selectedCard && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ background: '#c8102e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <img src={LOGO} alt="PG" style={{ height: 34, marginBottom: 4 }} />
              <div style={{ fontWeight: 900, fontSize: 17 }}>🪔 SHUBH DEEPAWALI 🪔</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>PG GRAND DIWALI LUCKY DRAW 2026</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Unique Lucky Number</div>
              <div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'Georgia, serif', color: '#c8102e' }}>
                #{selectedCard.number}
              </div>
              <Tag color={GROUP_COLORS[selectedCard.group]} style={{ fontSize: 14, padding: '3px 14px', marginTop: 4, fontWeight: 800 }}>
                {GROUP_LABELS[selectedCard.group]}
              </Tag>
            </div>

            <div style={{ display: 'inline-block', padding: 12, background: '#fffbeb', borderRadius: 12, border: '1px dashed #f59e0b', marginBottom: 14 }}>
              <QRCode
                value={getCardUrl(selectedCard.number)}
                size={160}
                bordered={false}
              />
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 6 }}>
                {selectedCard.token}
              </div>
            </div>

            <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, color: '#92400e', fontSize: 13, fontWeight: 600 }}>
              ✨ Wishing you and your family a joyous Diwali filled with prosperity, happiness & good health! ✨
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
