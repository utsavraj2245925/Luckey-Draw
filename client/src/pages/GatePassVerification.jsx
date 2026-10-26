import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, QRCode, Tag, Button, Spin, Result } from 'antd';
import { PrinterOutlined, CheckCircleFilled, TrophyFilled } from '@ant-design/icons';
import axios from 'axios';

const LOGO = 'https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png';

const GROUP_LABELS = { 1: 'Group A', 2: 'Group B', 3: 'Group C' };
const GROUP_COLORS = { 1: '#1677ff', 2: '#722ed1', 3: '#52c41a' };

export default function GatePassVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Try ticket endpoint first (by number), then fallback to pass endpoint
    const endpoint = !isNaN(id) ? `/api/game/ticket/${id}` : `/api/employees/public-pass/${id}`;
    axios.get(endpoint)
      .then(res => {
        setData(res.data);
        setError(null);
      })
      .catch(() => {
        // Fallback
        axios.get(`/api/employees/public-pass/${id}`)
          .then(res => {
            setData(res.data);
            setError(null);
          })
          .catch(err => {
            setError(err.response?.data?.message || 'Ticket verification failed');
          });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbeb' }}>
        <Spin size="large" tip="Verifying Diwali Lucky Draw Card..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#fffbeb' }}>
        <Card style={{ maxWidth: 440, width: '100%', textAlign: 'center', borderRadius: 16 }}>
          <Result
            status="error"
            title="Card Not Found"
            subTitle={error || 'Invalid or unregistered ticket QR code.'}
            extra={<Button onClick={() => navigate('/live')}>View Live Lucky Draw Screen</Button>}
          />
        </Card>
      </div>
    );
  }

  const ticketNumber = data.ticketNumber || data.employee?.serialNo || id;
  const group = data.group || data.employee?.group || 1;
  const winner = data.winner;
  const cardUrl = window.location.href;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, sans-serif'
    }}>
      
      {/* Visiting Card Mobile Presentation */}
      <div
        id="printable-gate-pass"
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 45px rgba(200, 16, 46, 0.15)',
          overflow: 'hidden',
          border: '2px solid #fdba74',
        }}
      >
        {/* Header Ribbon */}
        <div style={{
          background: 'linear-gradient(90deg, #991b1b 0%, #c8102e 50%, #b91c1c 100%)',
          color: '#fff',
          padding: '20px 24px',
          textAlign: 'center',
        }}>
          <img
            src={LOGO}
            alt="PG Logo"
            style={{ height: 42, marginBottom: 8, background: '#fff', borderRadius: 6, padding: '2px 8px' }}
          />
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0.5 }}>
            🪔 SHUBH DEEPAWALI 🪔
          </div>
          <div style={{ fontSize: 12, opacity: 0.95, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>
            PG Group Diwali Lucky Draw 2026
          </div>
        </div>

        {/* Festival Greeting Sub-header */}
        <div style={{
          background: '#fffbeb',
          borderBottom: '1px solid #fed7aa',
          padding: '12px 20px',
          textAlign: 'center',
          color: '#9a3412',
          fontSize: 13,
          fontWeight: 600,
        }}>
          ✨ Wishing you and your family a joyous Diwali filled with prosperity, happiness & good health! ✨
        </div>

        {/* Card Body */}
        <div style={{ padding: '24px' }}>
          
          {/* Lucky Draw Number Centerpiece */}
          <div style={{
            background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
            border: '2px dashed #fca5a5',
            borderRadius: 16,
            padding: '20px',
            textAlign: 'center',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1.5 }}>
              YOUR UNIQUE LUCKY NUMBER
            </div>
            <div style={{
              fontSize: 64,
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
              color: '#c8102e',
              lineHeight: 1.1,
              margin: '8px 0',
            }}>
              #{ticketNumber}
            </div>
            <div>
              <Tag
                color={GROUP_COLORS[group]}
                style={{ fontSize: 15, padding: '4px 16px', fontWeight: 800, borderRadius: 20 }}
              >
                {GROUP_LABELS[group] || `Group ${group}`}
              </Tag>
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: '#fafafa',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            marginBottom: 20,
          }}>
            <QRCode
              value={cardUrl}
              size={160}
              bordered={false}
              color="#1e293b"
            />
            <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              CARD TOKEN: PG-2026-#{String(ticketNumber).padStart(4, '0')}
            </div>
          </div>

          {/* Winner status if won */}
          {winner ? (
            <div style={{
              background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
              borderRadius: 14,
              padding: 16,
              textAlign: 'center',
              border: '2px solid #eab308',
              marginBottom: 16,
              boxShadow: '0 8px 20px rgba(234,179,8,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 900, color: '#854d0e', fontSize: 18 }}>
                <TrophyFilled style={{ color: '#ca8a04', fontSize: 24 }} />
                CONGRATULATIONS WINNER!
              </div>
              <div style={{ fontSize: 14, color: '#713f12', marginTop: 6, fontWeight: 700 }}>
                Ticket #{ticketNumber} won Round {winner.roundNo}!
              </div>
              <div style={{ fontSize: 18, color: '#c8102e', fontWeight: 900, marginTop: 4 }}>
                🏆 {winner.prize?.name || 'Grand Diwali Prize'}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: '12px 16px',
              textAlign: 'center',
              color: '#166534',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
            }}>
              <CheckCircleFilled style={{ color: '#22c55e' }} />
              Active in Diwali Lucky Draw • Keep card safe for the spin!
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              block
              size="large"
              onClick={() => window.print()}
              style={{ background: '#c8102e', borderColor: '#c8102e', fontWeight: 700, height: 46 }}
            >
              Print Card
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: 11,
          color: '#94a3b8',
          borderTop: '1px solid #e2e8f0',
        }}>
          PG Group • Official Diwali Lucky Draw Card • Non-transferable
        </div>
      </div>
    </div>
  );
}
