import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Search,
  Trash2,
  Loader2,
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clipboard
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   INVOICE PRINT COMPONENT — renders a full A4 invoice sheet
   ═══════════════════════════════════════════════════════════ */
function InvoicePrint({ quote, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '', 'width=850,height=1200');
    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title>Invoice ${quote.quoteNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family:'Inter', sans-serif;
            background:#fff;
            color:#1e293b;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size:A4; margin:0; }
          @media print {
            body { width:210mm; min-height:297mm; }
          }
          .invoice-page {
            width:210mm;
            min-height:297mm;
            background:#fff;
            padding:28mm 22mm 18mm;
            position:relative;
            display:flex;
            flex-direction:column;
          }
          /* Top accent bar */
          .accent-bar {
            position:absolute;
            top:0; left:0; right:0;
            height:12px;
            background:linear-gradient(90deg, #0d9488, #14b8a6 40%, #f59e0b 70%, #ef4444);
          }
          /* Header */
          .inv-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
          .inv-brand .logo-text {
            font-family:'Playfair Display', serif;
            font-size:28px;
            font-weight:700;
            color:#0d9488;
            letter-spacing:-0.5px;
          }
          .inv-brand .logo-sub {
            font-size:9px;
            text-transform:uppercase;
            letter-spacing:2.5px;
            color:#94a3b8;
            margin-top:2px;
          }
          .inv-title-block { text-align:right; }
          .inv-title-block h1 {
            font-family:'Playfair Display', serif;
            font-size:36px;
            font-weight:700;
            color:#1e293b;
            letter-spacing:-1px;
            line-height:1;
          }
          .inv-title-block .inv-number {
            font-size:11px;
            color:#0d9488;
            font-weight:600;
            letter-spacing:1px;
            margin-top:5px;
            text-transform:uppercase;
          }
          /* Divider */
          .divider { height:1px; background:#e2e8f0; margin:18px 0; }
          .divider.heavy { height:2px; background:linear-gradient(90deg, #0d9488, transparent); }
          /* Bill To / Details Row */
          .info-row { display:flex; justify-content:space-between; gap:30px; margin-bottom:24px; }
          .info-col { flex:1; }
          .info-col .info-label {
            font-size:8px;
            text-transform:uppercase;
            letter-spacing:2px;
            color:#0d9488;
            font-weight:600;
            margin-bottom:8px;
            padding-bottom:4px;
            border-bottom:1.5px solid #0d9488;
            display:inline-block;
          }
          .info-col .info-item {
            display:flex;
            align-items:center;
            gap:8px;
            margin-bottom:5px;
            font-size:11px;
            color:#475569;
          }
          .info-col .info-item .lbl { color:#94a3b8; font-size:9px; text-transform:uppercase; letter-spacing:0.8px; min-width:58px; }
          .info-col .info-item .val { color:#1e293b; font-weight:500; }
          .info-col .client-name { font-size:15px; font-weight:600; color:#1e293b; margin-bottom:6px; }
          /* Items Table */
          .items-table { width:100%; border-collapse:collapse; margin-bottom:12px; flex:1; }
          .items-table thead th {
            background:#f8fafc;
            font-size:8px;
            text-transform:uppercase;
            letter-spacing:1.5px;
            color:#64748b;
            font-weight:600;
            text-align:left;
            padding:10px 12px;
            border-bottom:2px solid #e2e8f0;
          }
          .items-table thead th:last-child { text-align:right; }
          .items-table thead th.center { text-align:center; }
          .items-table tbody tr { border-bottom:1px solid #f1f5f9; }
          .items-table tbody tr:last-child { border-bottom:none; }
          .items-table tbody td {
            padding:11px 12px;
            font-size:11px;
            color:#475569;
            vertical-align:middle;
          }
          .items-table tbody td.center { text-align:center; }
          .items-table tbody td.right { text-align:right; font-weight:600; color:#1e293b; }
          .items-table tbody td.desc { color:#1e293b; font-weight:500; }
          .items-table .row-num { color:#cbd5e1; font-size:10px; font-weight:600; }
          /* Totals */
          .totals-wrap { display:flex; justify-content:flex-end; margin-top:8px; }
          .totals-box { width:260px; }
          .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:11px; color:#64748b; border-bottom:1px solid #f1f5f9; }
          .totals-row .t-label { font-weight:500; }
          .totals-row .t-val { font-weight:600; color:#1e293b; }
          .totals-row.discount .t-val { color:#ef4444; }
          .totals-row.tax .t-val { color:#0d9488; }
          .totals-row.grand {
            border-bottom:none;
            border-top:2px solid #1e293b;
            margin-top:6px;
            padding-top:10px;
          }
          .totals-row.grand .t-label { font-size:13px; font-weight:700; color:#1e293b; }
          .totals-row.grand .t-val { font-size:18px; font-weight:700; color:#0d9488; }
          /* Terms & Notes */
          .bottom-section { display:flex; gap:24px; margin-top:20px; }
          .terms-box {
            flex:1;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:8px;
            padding:14px 16px;
          }
          .terms-box .terms-title {
            font-size:8px;
            text-transform:uppercase;
            letter-spacing:1.5px;
            color:#0d9488;
            font-weight:600;
            margin-bottom:6px;
          }
          .terms-box .terms-text { font-size:10px; color:#64748b; line-height:1.5; }
          /* Footer */
          .inv-footer {
            margin-top:auto;
            padding-top:16px;
            border-top:1px solid #e2e8f0;
            display:flex;
            justify-content:space-between;
            align-items:center;
          }
          .inv-footer .footer-left { font-size:9px; color:#94a3b8; }
          .inv-footer .footer-right { font-size:9px; color:#94a3b8; text-align:right; }
          .status-badge {
            display:inline-block;
            padding:3px 10px;
            border-radius:20px;
            font-size:8px;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:1px;
          }
          .status-draft { background:#fef3c7; color:#92400e; }
          .status-sent { background:#dbeafe; color:#1e40af; }
          .status-accepted { background:#d1fae5; color:#065f46; }
        </style>
      </head>
      <body>
        <div class="invoice-page">
          ${content}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const statusClass = quote.status === 'draft' ? 'status-draft' : quote.status === 'sent' ? 'status-sent' : 'status-accepted';

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'16px',width:'100%',maxWidth:'900px',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 40px 80px rgba(0,0,0,0.2)',position:'relative'}}>
        {/* Modal Controls */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 24px',borderBottom:'1px solid #e2e8f0',background:'#fafbfc',borderRadius:'16px 16px 0 0',position:'sticky',top:0,zIndex:10}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{background:'linear-gradient(135deg,#0d9488,#14b8a6)',padding:'8px',borderRadius:'8px',display:'flex'}}>
              <FileText color="#fff" size={18}/>
            </div>
            <div>
              <p style={{fontWeight:600,color:'#1e293b',fontSize:'15px'}}>{quote.title}</p>
              <p style={{fontSize:'12px',color:'#64748b'}}>#{quote.quoteNumber}</p>
            </div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={handlePrint} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 18px',background:'linear-gradient(135deg,#0d9488,#14b8a6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,fontSize:'13px',cursor:'pointer',boxShadow:'0 3px 10px rgba(13,148,136,0.3)'}}>
              <Download size={15}/> Print / Save PDF
            </button>
            <button onClick={onClose} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'36px',height:'36px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',color:'#64748b'}}>
              <X size={18}/>
            </button>
          </div>
        </div>

        {/* A4 Invoice Preview */}
        <div style={{padding:'24px',background:'#f0f4f8',display:'flex',justifyContent:'center'}}>
          <div ref={printRef} style={{width:'210mm',minHeight:'297mm',background:'#fff',padding:'28mm 22mm 18mm',position:'relative',boxShadow:'0 4px 24px rgba(0,0,0,0.1)',borderRadius:'4px'}}>
            
            {/* Top accent bar */}
            <div style={{position:'absolute',top:0,left:0,right:0,height:'12px',background:'linear-gradient(90deg, #0d9488, #14b8a6 40%, #f59e0b 70%, #ef4444)',borderRadius:'4px 4px 0 0'}}/>

            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',marginTop:'8px'}}>
              <div>
                <p style={{fontFamily:"'Playfair Display', serif",fontSize:'28px',fontWeight:700,color:'#0d9488',letterSpacing:'-0.5px'}}>Jonix</p>
                <p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'2.5px',color:'#94a3b8',marginTop:'2px'}}>Arabia</p>
              </div>
              <div style={{textAlign:'right'}}>
                <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:'36px',fontWeight:700,color:'#1e293b',letterSpacing:'-1px',lineHeight:1}}>INVOICE</h1>
                <p style={{fontSize:'11px',color:'#0d9488',fontWeight:600,letterSpacing:'1px',marginTop:'5px',textTransform:'uppercase'}}>#{quote.quoteNumber}</p>
                <span className={statusClass} style={{display:'inline-block',marginTop:'6px',padding:'3px 10px',borderRadius:'20px',fontSize:'8px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',background: quote.status==='draft'?'#fef3c7':quote.status==='sent'?'#dbeafe':'#d1fae5',color: quote.status==='draft'?'#92400e':quote.status==='sent'?'#1e40af':'#065f46'}}>{quote.status}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{height:'2px',background:'linear-gradient(90deg, #0d9488, transparent)',margin:'18px 0'}}/>

            {/* Info Row */}
            <div style={{display:'flex',justifyContent:'space-between',gap:'30px',marginBottom:'24px'}}>
              {/* Bill To */}
              <div style={{flex:1}}>
                <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:600,marginBottom:'8px',paddingBottom:'4px',borderBottom:'1.5px solid #0d9488',display:'inline-block'}}>Bill To</p>
                <p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'6px'}}>{quote.clientName || 'N/A'}</p>
                <p style={{fontSize:'11px',color:'#475569',marginBottom:'4px'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.8px',marginRight:'6px'}}>Email</span>{quote.clientEmail || '—'}</p>
                <p style={{fontSize:'11px',color:'#475569'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.8px',marginRight:'6px'}}>Phone</span>{quote.clientPhone || '—'}</p>
              </div>
              {/* Invoice Details */}
              <div style={{flex:1,textAlign:'right'}}>
                <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:600,marginBottom:'8px',paddingBottom:'4px',borderBottom:'1.5px solid #0d9488',display:'inline-block'}}>Invoice Details</p>
                <p style={{fontSize:'11px',color:'#475569',marginBottom:'4px'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.8px',marginRight:'6px'}}>Date</span><span style={{fontWeight:500,color:'#1e293b'}}>{quote.createdAt?.toDate ? new Date(quote.createdAt.toDate()).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'N/A'}</span></p>
                <p style={{fontSize:'11px',color:'#475569',marginBottom:'4px'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.8px',marginRight:'6px'}}>Valid</span><span style={{fontWeight:500,color:'#1e293b'}}>{quote.validUntil || '—'}</span></p>
                <p style={{fontSize:'11px',color:'#475569'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.8px',marginRight:'6px'}}>Terms</span><span style={{fontWeight:500,color:'#1e293b'}}>{quote.terms || '—'}</span></p>
              </div>
            </div>

            {/* Items Table */}
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  <th style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#64748b',fontWeight:600,textAlign:'left',padding:'10px 12px',borderBottom:'2px solid #e2e8f0',width:'5%'}}>#</th>
                  <th style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#64748b',fontWeight:600,textAlign:'left',padding:'10px 12px',borderBottom:'2px solid #e2e8f0'}}>Description</th>
                  <th style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#64748b',fontWeight:600,textAlign:'center',padding:'10px 12px',borderBottom:'2px solid #e2e8f0',width:'12%'}}>Qty</th>
                  <th style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#64748b',fontWeight:600,textAlign:'right',padding:'10px 12px',borderBottom:'2px solid #e2e8f0',width:'18%'}}>Unit Price</th>
                  <th style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#64748b',fontWeight:600,textAlign:'right',padding:'10px 12px',borderBottom:'2px solid #e2e8f0',width:'18%'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items || []).map((item, i) => (
                  <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                    <td style={{padding:'11px 12px',fontSize:'10px',color:'#cbd5e1',fontWeight:600}}>{String(i+1).padStart(2,'0')}</td>
                    <td style={{padding:'11px 12px',fontSize:'11px',color:'#1e293b',fontWeight:500}}>{item.description}</td>
                    <td style={{padding:'11px 12px',fontSize:'11px',color:'#475569',textAlign:'center'}}>{item.quantity}</td>
                    <td style={{padding:'11px 12px',fontSize:'11px',color:'#475569',textAlign:'right'}}>EGP {Number(item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                    <td style={{padding:'11px 12px',fontSize:'11px',color:'#1e293b',fontWeight:600,textAlign:'right'}}>EGP {(item.quantity * item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'8px'}}>
              <div style={{width:'260px'}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:'11px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}>
                  <span style={{fontWeight:500}}>Subtotal</span>
                  <span style={{fontWeight:600,color:'#1e293b'}}>EGP {(quote.subtotal||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                </div>
                {quote.discount > 0 && (
                  <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:'11px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}>
                    <span style={{fontWeight:500}}>Discount ({quote.discount}%)</span>
                    <span style={{fontWeight:600,color:'#ef4444'}}>-EGP {(quote.discountAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:'11px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}>
                  <span style={{fontWeight:500}}>Tax ({quote.tax}%)</span>
                  <span style={{fontWeight:600,color:'#0d9488'}}>+EGP {(quote.taxAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',fontSize:'13px',borderTop:'2px solid #1e293b',marginTop:'6px'}}>
                  <span style={{fontWeight:700,color:'#1e293b'}}>Total</span>
                  <span style={{fontWeight:700,color:'#0d9488',fontSize:'18px'}}>EGP {(quote.total||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                </div>
              </div>
            </div>

            {/* Terms & Notes */}
            <div style={{display:'flex',gap:'24px',marginTop:'24px'}}>
              <div style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'14px 16px'}}>
                <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#0d9488',fontWeight:600,marginBottom:'6px'}}>Payment Terms</p>
                <p style={{fontSize:'10px',color:'#64748b',lineHeight:1.5}}>{quote.terms || 'Net 30'}</p>
              </div>
              {quote.notes && (
                <div style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'14px 16px'}}>
                  <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#0d9488',fontWeight:600,marginBottom:'6px'}}>Notes</p>
                  <p style={{fontSize:'10px',color:'#64748b',lineHeight:1.5}}>{quote.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{marginTop:'auto',paddingTop:'20px',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'32px'}}>
              <p style={{fontSize:'9px',color:'#94a3b8'}}>Thank you for your business.</p>
              <p style={{fontSize:'9px',color:'#94a3b8'}}>Generated by Jonixy CRM • Confidential</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function QuoteGeneratorPage() {
  const { currentUser, userRole } = useAuth();
  const [deals, setDeals] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── View / PDF modals ──
  const [viewQuote, setViewQuote] = useState(null);   // opens the View modal
  const [pdfQuote, setPdfQuote]   = useState(null);   // opens the PDF/print modal

  const initialForm = {
    dealId: '', quoteNumber: '', title: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    discount: 0, tax: 10, notes: '', validUntil: '', terms: 'Net 30'
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (currentUser) { loadDeals(); loadQuotes(); }
  }, [currentUser, userRole]);

  async function loadDeals() {
    try {
      let q;
      if (userRole === 'admin') {
        q = query(collection(db, 'sales'));
      } else {
        q = query(collection(db, 'sales'), where('createdBy', '==', currentUser.uid));
      }
      const snap = await getDocs(q);
      const allDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDeals(allDeals.filter(d => d.archived !== true));
    } catch (e) { console.error('Error loading deals:', e); }
  }

  async function loadQuotes() {
    try {
      setLoading(true);
      let q;
      if (userRole === 'admin') {
        q = query(collection(db, 'quotes'));
      } else {
        q = query(collection(db, 'quotes'), where('createdBy', '==', currentUser.uid));
      }
      const snap = await getDocs(q);
      setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error('Error loading quotes:', e); }
    finally { setLoading(false); }
  }

  async function handleCreateQuote() {
    const hasInvalidItem = form.items.some(
      (i) => !i.description || i.unitPrice === '' || i.unitPrice === null || i.unitPrice === undefined || isNaN(Number(i.unitPrice)) || Number(i.unitPrice) < 0
    );
    if (!form.dealId || !form.title || hasInvalidItem) { alert('Please fill in all required fields correctly.'); return; }
    setIsSubmitting(true);
    try {
      const deal = deals.find((d) => d.id === form.dealId);
      if (!deal) { alert('Deal not found.'); setIsSubmitting(false); return; }

      const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
      const discountAmount = subtotal * (form.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (form.tax / 100);
      const total = taxableAmount + taxAmount;

      const clientName = deal.clientName || deal.businessName || deal.name || 'Unknown Client';
      const clientEmail = deal.email || deal.clientEmail || '';
      const clientPhone = deal.phone || deal.clientPhone || '';

      await addDoc(collection(db, 'quotes'), {
        dealId: form.dealId, clientName, clientEmail, clientPhone,
        quoteNumber: form.quoteNumber || `QT-${Date.now()}`,
        title: form.title,
        items: form.items.map(item => ({ description: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
        subtotal, discount: form.discount, discountAmount,
        tax: form.tax, taxAmount, total,
        notes: form.notes, validUntil: form.validUntil, terms: form.terms,
        status: 'draft', createdBy: currentUser.uid,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });

      setForm(initialForm); setSelectedDeal(null); setShowForm(false);
      await loadQuotes();
      alert('Quote created successfully!');
    } catch (e) {
      console.error('Error creating quote:', e.code, e.message, e);
      alert(`Failed to create quote: ${e.message || 'Unknown error'}`);
    } finally { setIsSubmitting(false); }
  }

  const handleAddItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }] });
  const handleRemoveItem = (index) => { if (form.items.length === 1) return; setForm({ ...form, items: form.items.filter((_, i) => i !== index) }); };
  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: field === 'description' ? value : value === '' ? '' : Number(value) };
    setForm({ ...form, items: newItems });
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch = q.clientName?.toLowerCase().includes(search.toLowerCase()) || q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) || q.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const subtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const discountAmount = subtotal * (form.discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (form.tax / 100);
  const total = taxableAmount + taxAmount;

  /* ── helpers ── */
  const fmtDate = (ts) => { try { return new Date(ts.toDate()).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); } catch { return 'N/A'; } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">

      {/* ─── View Modal ─── */}
      {viewQuote && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(15,23,42,0.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'16px',width:'100%',maxWidth:'680px',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 32px 64px rgba(0,0,0,0.18)'}}>
            {/* Modal Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px',borderBottom:'1px solid #e2e8f0',background:'#fafbfc',borderRadius:'16px 16px 0 0'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{background:'linear-gradient(135deg,#0d9488,#14b8a6)',padding:'9px',borderRadius:'10px',display:'flex'}}><FileText color="#fff" size={20}/></div>
                <div>
                  <p style={{fontWeight:700,color:'#1e293b',fontSize:'16px'}}>{viewQuote.title}</p>
                  <p style={{fontSize:'12px',color:'#64748b'}}>#{viewQuote.quoteNumber}</p>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>setPdfQuote(viewQuote)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',background:'linear-gradient(135deg,#0d9488,#14b8a6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
                  <Download size={14}/> PDF
                </button>
                <button onClick={()=>setViewQuote(null)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'36px',height:'36px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',color:'#64748b'}}><X size={18}/></button>
              </div>
            </div>
            {/* Modal Body */}
            <div style={{padding:'24px'}}>
              {/* Status + Meta */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
                <span style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'20px',fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',background: viewQuote.status==='draft'?'#fef3c7':viewQuote.status==='sent'?'#dbeafe':'#d1fae5',color: viewQuote.status==='draft'?'#92400e':viewQuote.status==='sent'?'#1e40af':'#065f46'}}>
                  <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'currentColor'}}/>{viewQuote.status}
                </span>
                <span style={{fontSize:'12px',color:'#94a3b8'}}>{fmtDate(viewQuote.createdAt)}</span>
              </div>

              {/* Client Info */}
              <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'18px',marginBottom:'24px'}}>
                <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:600,marginBottom:'10px'}}>Client Information</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{background:'#e0f2fe',padding:'6px',borderRadius:'8px',display:'flex'}}><Building2 size={14} color="#0284c7"/></div>
                    <div><p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Client</p><p style={{fontSize:'13px',fontWeight:600,color:'#1e293b'}}>{viewQuote.clientName||'—'}</p></div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{background:'#e0f2fe',padding:'6px',borderRadius:'8px',display:'flex'}}><Mail size={14} color="#0284c7"/></div>
                    <div><p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Email</p><p style={{fontSize:'12px',color:'#475569'}}>{viewQuote.clientEmail||'—'}</p></div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{background:'#e0f2fe',padding:'6px',borderRadius:'8px',display:'flex'}}><Phone size={14} color="#0284c7"/></div>
                    <div><p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Phone</p><p style={{fontSize:'12px',color:'#475569'}}>{viewQuote.clientPhone||'—'}</p></div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{marginBottom:'24px'}}>
                <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:600,marginBottom:'10px'}}>Line Items</p>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#f1f5f9'}}>
                      {['#','Description','Qty','Unit Price','Amount'].map((h,i)=>(
                        <th key={i} style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',color:'#64748b',fontWeight:600,padding:'10px 12px',borderBottom:'2px solid #e2e8f0',textAlign: i===0||i===1?'left':'right'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(viewQuote.items||[]).map((item,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'10px 12px',fontSize:'11px',color:'#cbd5e1',fontWeight:600}}>{String(i+1).padStart(2,'0')}</td>
                        <td style={{padding:'10px 12px',fontSize:'13px',color:'#1e293b',fontWeight:500}}>{item.description}</td>
                        <td style={{padding:'10px 12px',fontSize:'13px',color:'#475569',textAlign:'right'}}>{item.quantity}</td>
                        <td style={{padding:'10px 12px',fontSize:'13px',color:'#475569',textAlign:'right'}}>EGP {Number(item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                        <td style={{padding:'10px 12px',fontSize:'13px',color:'#1e293b',fontWeight:600,textAlign:'right'}}>EGP {(item.quantity*item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <div style={{width:'280px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'13px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}>
                    <span>Subtotal</span><span style={{fontWeight:600,color:'#1e293b'}}>EGP {(viewQuote.subtotal||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                  </div>
                  {viewQuote.discount > 0 && (
                    <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'13px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}>
                      <span>Discount ({viewQuote.discount}%)</span><span style={{fontWeight:600,color:'#ef4444'}}>-EGP {(viewQuote.discountAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                    </div>
                  )}
                  <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'13px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}>
                    <span>Tax ({viewQuote.tax}%)</span><span style={{fontWeight:600,color:'#0d9488'}}>+EGP {(viewQuote.taxAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',borderTop:'2px solid #1e293b',marginTop:'6px'}}>
                    <span style={{fontWeight:700,color:'#1e293b',fontSize:'15px'}}>Total</span>
                    <span style={{fontWeight:700,color:'#0d9488',fontSize:'20px'}}>EGP {(viewQuote.total||0).toLocaleString('en',{minimumFractionDigits:2})}</span>
                  </div>
                </div>
              </div>

              {/* Terms / Notes */}
              {(viewQuote.terms || viewQuote.notes) && (
                <div style={{display:'flex',gap:'16px',marginTop:'24px'}}>
                  {viewQuote.terms && (
                    <div style={{flex:1,background:'#f0fdfc',border:'1px solid #a7f3d0',borderRadius:'10px',padding:'14px'}}>
                      <p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#0d9488',fontWeight:600,marginBottom:'4px'}}>Payment Terms</p>
                      <p style={{fontSize:'13px',color:'#1e293b',fontWeight:500}}>{viewQuote.terms}</p>
                    </div>
                  )}
                  {viewQuote.notes && (
                    <div style={{flex:1,background:'#fefce8',border:'1px solid #fde047',borderRadius:'10px',padding:'14px'}}>
                      <p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#ca8a04',fontWeight:600,marginBottom:'4px'}}>Notes</p>
                      <p style={{fontSize:'13px',color:'#1e293b'}}>{viewQuote.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PDF Print Modal ─── */}
      {pdfQuote && <InvoicePrint quote={pdfQuote} onClose={()=>setPdfQuote(null)}/>}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl">
              <FileText className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quote Generator</h1>
              <p className="text-gray-500">Create and manage professional quotes</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg">
            <Plus size={20} />{showForm ? 'Close Form' : 'New Quote'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Quote</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deal <span className="text-red-500">*</span></label>
              <select value={form.dealId} onChange={(e) => { const deal = deals.find(d => d.id === e.target.value); setForm({...form, dealId: e.target.value}); setSelectedDeal(deal||null); }} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                <option value="">Select a deal</option>
                {deals.map(deal => <option key={deal.id} value={deal.id}>{deal.businessName||deal.clientName||deal.name||'Unknown'} — EGP {(deal.amount||0).toLocaleString()}</option>)}
              </select>
              {deals.length === 0 && <p className="text-xs text-red-500 mt-1">No active deals found.</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quote Number</label>
              <input type="text" value={form.quoteNumber} onChange={e=>setForm({...form,quoteNumber:e.target.value})} placeholder="Auto-generated if left blank" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quote Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g., Website Development Services" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
          </div>
          {selectedDeal && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-1">Selected Deal: {selectedDeal.businessName||selectedDeal.clientName||selectedDeal.name}</p>
              <p className="text-xs text-blue-600">{selectedDeal.email||selectedDeal.clientEmail||'No email'} • {selectedDeal.phone||selectedDeal.clientPhone||'No phone'}</p>
            </div>
          )}
          {/* Line Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-12 gap-3 mb-2 px-1">
              <span className="col-span-5 text-xs font-semibold text-gray-500 uppercase">Description</span>
              <span className="col-span-2 text-xs font-semibold text-gray-500 uppercase">Qty</span>
              <span className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Unit Price (EGP)</span>
              <span className="col-span-2"></span>
            </div>
            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <input type="text" placeholder="Item description" value={item.description} onChange={e=>handleItemChange(index,'description',e.target.value)} className="col-span-5 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"/>
                  <input type="number" placeholder="1" value={item.quantity} onChange={e=>handleItemChange(index,'quantity',e.target.value)} className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" min="1"/>
                  <input type="number" placeholder="0.00" value={item.unitPrice} onChange={e=>handleItemChange(index,'unitPrice',e.target.value)} className="col-span-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" min="0" step="0.01"/>
                  <button type="button" onClick={()=>handleRemoveItem(index)} disabled={form.items.length===1} className="col-span-2 flex justify-center px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"><Plus size={18}/> Add Item</button>
          </div>
          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-semibold">EGP {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><span className="text-gray-600">Discount:</span><input type="number" value={form.discount} onChange={e=>setForm({...form,discount:Math.min(100,Math.max(0,Number(e.target.value)))})} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" min="0" max="100"/><span className="text-gray-600">%</span></div>
                <span className="font-semibold text-red-600">-EGP {discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><span className="text-gray-600">Tax:</span><input type="number" value={form.tax} onChange={e=>setForm({...form,tax:Math.min(100,Math.max(0,Number(e.target.value)))})} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" min="0" max="100"/><span className="text-gray-600">%</span></div>
                <span className="font-semibold text-green-600">+EGP {taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t-2 border-gray-300 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-orange-600">EGP {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          {/* Bottom Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until</label><input type="date" value={form.validUntil} onChange={e=>setForm({...form,validUntil:e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
              <select value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                {['Due Upon Receipt','Net 7','Net 15','Net 30','Net 45','Net 60'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label><input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g., Thank you for your business" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/></div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleCreateQuote} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? <><Loader2 size={18} className="animate-spin"/>Creating...</> : 'Create Quote'}
            </button>
            <button type="button" onClick={()=>{setShowForm(false);setForm(initialForm);setSelectedDeal(null);}} className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Search by client, quote number, or title..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all','draft','sent','accepted'].map(status => (
              <button key={status} type="button" onClick={()=>setFilterStatus(status)} className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${filterStatus===status?'bg-orange-500 text-white shadow-md':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {status.charAt(0).toUpperCase()+status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-16"><Loader2 size={44} className="animate-spin text-orange-500 mx-auto mb-4"/><p className="text-gray-500">Loading quotes...</p></div>
        ) : filteredQuotes.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4"><FileText size={40} className="text-gray-400"/></div>
            <p className="text-gray-700 font-semibold text-lg">{search||filterStatus!=='all'?'No matching quotes':'No quotes yet'}</p>
            <p className="text-gray-400 text-sm mt-1">{search||filterStatus!=='all'?'Try adjusting your search or filter.':'Click "New Quote" to create your first quote.'}</p>
          </div>
        ) : (
          filteredQuotes.map(quote => (
            <div key={quote.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div><h3 className="text-lg font-bold text-gray-900">{quote.title}</h3><p className="text-sm text-gray-500">#{quote.quoteNumber}</p></div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${quote.status==='draft'?'bg-yellow-100 text-yellow-800':quote.status==='sent'?'bg-blue-100 text-blue-800':'bg-green-100 text-green-800'}`}>{quote.status}</span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600"><strong>Client:</strong> {quote.clientName||'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Items:</strong> {quote.items?.length||0}</p>
                <p className="text-sm text-gray-600"><strong>Terms:</strong> {quote.terms||'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Valid Until:</strong> {quote.validUntil||'Not set'}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-4 border border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-orange-600">EGP {quote.total?.toFixed(2)||'0.00'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setViewQuote(quote)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium text-sm">
                  <Eye size={16}/> View
                </button>
                <button type="button" onClick={()=>setPdfQuote(quote)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm">
                  <Download size={16}/> PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}