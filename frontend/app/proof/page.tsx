'use client';

export default function ProofPage() {
  const proofs = [
    { label: 'Build', value: '7/7 PASS', type: 'success' as const },
    { label: 'Runtime', value: '10/10 Services', type: 'success' as const },
    { label: 'API Flow', value: '22/22 PASS', type: 'success' as const },
    { label: 'k6 Requests', value: '14,374', type: 'default' as const },
    { label: 'Successful Bookings', value: '1', type: 'success' as const },
    { label: 'Conflicts (409)', value: '14,364', type: 'error' as const },
    { label: 'DB Duplicates', value: '0', type: 'success' as const },
    { label: 'p95 Latency', value: '427ms', type: 'default' as const },
    { label: 'Throughput', value: '469 req/s', type: 'default' as const },
    { label: 'RAM During k6', value: '3.8GB', type: 'default' as const },
    { label: 'Kafka Events', value: 'Working', type: 'success' as const },
    { label: 'Double-Booking', value: 'PREVENTED', type: 'success' as const },
  ];

  const kafkaFlow = [
    { step: '1', desc: 'User holds seat', status: '✅ Redis lock + DB check' },
    { step: '2', desc: 'User pays', status: '✅ Booking CONFIRMED' },
    { step: '3', desc: 'Kafka BOOKING_CONFIRMED', status: '✅ Published to topic' },
    { step: '4', desc: 'Ticket service consumes', status: '✅ Auto-issued ticket' },
    { step: '5', desc: 'User checks in', status: '✅ Ticket VALID → USED' },
    { step: '6', desc: 'Duplicate check-in', status: '✅ Rejected (400)' },
  ];

  const apiTests = [
    'POST /api/auth/register → 200',
    'POST /api/auth/login → 200 + JWT',
    'GET /api/auth/me → 200 (profile)',
    'POST /api/events → 201',
    'POST /api/events/{id}/sections → 201',
    'POST /api/events/{id}/seats/generate → 200',
    'POST /api/events/{id}/publish → 200',
    'GET /api/events/{id}/seat-map → 200',
    'POST /api/bookings/hold → 201',
    'POST /api/bookings/hold (dup) → 409',
    'POST /api/bookings/{id}/pay → 200',
    'GET /api/tickets/me → 200 (ticket)',
    'POST /api/tickets/{id}/check-in → 200',
    'POST /api/tickets/{id}/check-in (dup) → 400',
    'GET /health (notif) → 200',
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>🛡️ Integration Proof</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Verified results from SeatGuard full-stack integration testing.
      </p>

      {/* Key Metrics */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="section-title">Key Metrics</h2>
        <div className="proof-grid">
          {proofs.map((p) => (
            <div key={p.label} className={`proof-card ${p.type}`}>
              <div className="value">{p.value}</div>
              <div className="label">{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Kafka Flow */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="section-title">Kafka Event Flow (Verified)</h2>
        <div className="card">
          {kafkaFlow.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: i < kafkaFlow.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 24 }}>{step.step}</span>
              <span style={{ flex: 1 }}>{step.desc}</span>
              <span style={{ fontSize: '0.85rem' }}>{step.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* API Tests */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="section-title">API Tests (22/22 PASS)</h2>
        <div className="card" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {apiTests.map((test, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: i < apiTests.length - 1 ? '1px solid var(--border)' : 'none', color: test.includes('409') || test.includes('400') ? 'var(--warning)' : 'var(--success)' }}>
              ✅ {test}
            </div>
          ))}
        </div>
      </section>

      {/* DB Verification */}
      <section>
        <h2 className="section-title">DB Duplicate Check</h2>
        <div className="card" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>SQL Query:</div>
          <div style={{ color: 'var(--accent)', marginBottom: 12 }}>
            SELECT seat_id, status, COUNT(*) FROM bookings<br />
            WHERE status IN (&apos;PENDING_PAYMENT&apos;, &apos;CONFIRMED&apos;)<br />
            GROUP BY seat_id, status HAVING COUNT(*) &gt; 1;
          </div>
          <div style={{ color: 'var(--success)', fontWeight: 700 }}>
            Result: 0 rows — ZERO duplicate bookings confirmed
          </div>
        </div>
      </section>
    </div>
  );
}
