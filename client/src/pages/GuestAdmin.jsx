import { useState } from 'react';
import { Button, Card, Popconfirm, Upload, message, Tag } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import useGuestDraw from '../hooks/useGuestDraw';
import GuestCards from '../components/GuestCards';

const API = '/api/guests';
// ASSUMPTION: your admin JWT is stored in localStorage under "token". Change the key if different.
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` } });

export default function GuestAdmin() {
  const { guests, state, rolling, spinning, refresh } = useGuestDraw();
  const [uploading, setUploading] = useState(false);
  const done = state.roundsDone >= state.maxRounds;
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('pg_admin_token')}` });


  const upload = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/upload`, { 
        ...auth(),
        method: 'POST',
         body: fd 
        });
      const data = await r.json();
      if (!r.ok) {
        message.error(data.errors ? data.errors.join(' | ') : data.message);
      } else {
        message.success(`${data.count} guests uploaded`);
        refresh();
      }
    } finally {
      setUploading(false);
    }
    return false; // stop antd's own upload
  };

  const call = async (path) => {
    const r = await fetch(`${API}/${path}`, { method: 'POST', headers: authHeader() });
    const data = await r.json();
    if (!r.ok) message.error(data.message || 'Failed');
    else if (path === 'reset') refresh();
  };

  return (
    <div className="p-6 space-y-4">
      <Card title="Guest Draw — Admin">
        <div className="flex flex-wrap gap-3 items-center">
          <Upload accept=".xlsx,.xls,.csv" showUploadList={false} beforeUpload={upload}>
            <Button icon={<UploadOutlined />} loading={uploading}>
              Upload Guest Sheet
            </Button>
          </Upload>

          <Button
            type="primary"
            size="large"
            disabled={!guests.length || spinning || done}
            onClick={() => call('spin')}
          >
            {done ? 'All 3 Rounds Done' : spinning ? 'Spinning…' : `SPIN Round ${state.roundsDone + 1}`}
          </Button>

          <Popconfirm title="Clear all winners and start over?" onConfirm={() => call('reset')}>
            <Button danger disabled={spinning || !state.roundsDone}>
              Reset Winners
            </Button>
          </Popconfirm>

          <Tag color="blue">{guests.length} guests</Tag>
          <Tag color="gold">
            {state.roundsDone}/{state.maxRounds} rounds
          </Tag>
        </div>
        <p className="text-gray-500 mt-3 text-sm">
          Sheet columns: <b>Name</b> and <b>Number</b> (first sheet; uploading replaces the current guest list).
          Live screen: <code>/guest-live</code>
        </p>
      </Card>

      <Card title="Winners">
        <div className="flex gap-3 flex-wrap">
          {state.winners.length === 0 && <span className="text-gray-400">No winners yet</span>}
          {state.winners.map((w) => (
            <Tag key={w._id} color="gold" className="text-base py-1 px-3">
              Round {w.wonRound}: {w.guestNumber} — {w.name}
            </Tag>
          ))}
        </div>
      </Card>

      <Card title="Guests">
        <GuestCards guests={guests} rollingId={spinning ? rolling?._id : null} />
      </Card>
    </div>
  );
}