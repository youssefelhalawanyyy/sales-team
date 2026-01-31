import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText, Plus, Download, Eye, Search, Trash2, Loader2, X,
  Building2, Mail, Phone, Edit, CheckCircle, Send
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   PRODUCT CATALOG
   ═══════════════════════════════════════════════════════════ */
const JONIX_PRODUCTS = [
  {
    id: 'cube-pro',
    name: 'JONIX CUBE PROFESSIONAL',
    price: 2000,
    currency: '€',
    specs: {
      dimensions: '215 × 215 × 260 mm',
      weight: '2.8 kg',
      airflow: '40 m³/h',
      coverage: 'Up to 85 m²',
      power: '10 W / 230 V – 50 Hz',
      finish: 'Stainless steel'
    },
    features: [
      'Cold plasma ionization technology',
      'Silent operation',
      'Low energy consumption',
      'No filters to replace',
      'Advanced cold plasma technology',
      'Premium Quality'
    ],
    use: 'Medical environments (clinics, surgeries, dental, etc.), Beauty centers and waiting areas, Enclosed medical spaces'
  },
  {
    id: 'cube',
    name: 'JONIX CUBE',
    price: 1400,
    currency: '€',
    specs: {
      dimensions: '215 × 215 × 260 mm',
      weight: '2.8 kg',
      airflow: '40 m³/h',
      coverage: 'Up to 85 m²',
      power: '10 W / 230 V – 50 Hz',
      finish: 'Stainless steel'
    },
    features: [
      'Cold plasma ionization technology',
      'Silent operation',
      'Low energy consumption',
      'No filters to replace',
      'Advanced cold plasma technology',
      'Premium Quality'
    ],
    use: 'Medical environments (clinics, surgeries, dental, etc.), Beauty centers and waiting areas, Enclosed medical spaces'
  },
  {
    id: 'steel-4c',
    name: 'JONIX STEEL 4C',
    price: 6000,
    currency: '€',
    specs: {
      dimensions: '320 × 260 × 400 mm',
      weight: '9 kg',
      airflow: '160 m³/h',
      coverage: 'Up to 500 m²',
      power: '37 W / 230 V – 50 Hz'
    },
    features: [
      'Industrial-grade construction',
      'Food-safe sanitisation',
      'High ion output',
      'Continuous disinfection',
      'Advanced cold plasma technology',
      'Premium Quality'
    ],
    use: 'Food processing facilities, Cold rooms & restaurants, High-traffic venues'
  },
  {
    id: 'duct-2f',
    name: 'JONIX DUCT 2F',
    price: 2000,
    currency: '€',
    specs: {
      dimensions: '290 × 350 × 700 mm',
      weight: '5 kg',
      airflow: 'Up to 2,000 m³/h',
      power: '20 W / 230 V – 50 Hz'
    },
    features: [
      'Installed inside air ducts',
      'Treats all supplied air',
      'Ideal for HVAC systems',
      'Advanced cold plasma technology',
      'Premium Quality'
    ],
    use: 'HVAC & ventilation ducts, Medium-size facilities, Offices, clinics, gyms'
  },
  {
    id: 'duct-4f',
    name: 'JONIX DUCT 4F',
    price: 4000,
    currency: '€',
    specs: {
      dimensions: '290 × 350 × 700 mm',
      weight: '6 kg',
      airflow: 'Up to 4,000 m³/h',
      power: '40 W / 230 V – 50 Hz'
    },
    features: [
      'Designed for large air volumes',
      'Multi-room coverage',
      'Low operating cost',
      'Advanced cold plasma technology',
      'Premium Quality'
    ],
    use: 'Large HVAC systems, Commercial & industrial buildings, Malls and hospitals'
  },
  {
    id: 'other',
    name: 'Other / Custom Product',
    price: 0,
    currency: '€',
    isCustom: true
  }
];

/* ═══════════════════════════════════════════════════════════
   STATUS CHANGE MODAL
   ═══════════════════════════════════════════════════════════ */
function StatusChangeModal({ quote, onClose, onUpdate }) {
  const [newStatus, setNewStatus] = useState(quote.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: '📝', color: '#f59e0b', desc: 'Quote is being prepared' },
    { value: 'sent', label: 'Sent', icon: '📤', color: '#3b82f6', desc: 'Quote has been sent to client' },
    { value: 'accepted', label: 'Accepted', icon: '✅', color: '#10b981', desc: 'Client has accepted the quote' }
  ];

  const handleUpdateStatus = async () => {
    if (newStatus === quote.status) {
      onClose();
      return;
    }
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'quotes', quote.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:101,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'16px',width:'100%',maxWidth:'480px',boxShadow:'0 32px 64px rgba(0,0,0,0.2)'}}>
        <div style={{padding:'24px',borderBottom:'1px solid #e2e8f0'}}>
          <h3 style={{fontSize:'20px',fontWeight:700,color:'#1e293b',marginBottom:'4px'}}>Update Quote Status</h3>
          <p style={{fontSize:'13px',color:'#64748b'}}>#{quote.quoteNumber} • {quote.title}</p>
        </div>
        <div style={{padding:'24px'}}>
          <div style={{display:'grid',gap:'12px'}}>
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setNewStatus(option.value)}
                style={{
                  display:'flex',alignItems:'center',gap:'12px',padding:'16px 20px',
                  background: newStatus === option.value ? `${option.color}15` : '#f8fafc',
                  border: newStatus === option.value ? `2px solid ${option.color}` : '2px solid #e2e8f0',
                  borderRadius:'12px',cursor:'pointer',transition:'all 0.2s',textAlign:'left'
                }}
              >
                <span style={{fontSize:'24px'}}>{option.icon}</span>
                <div style={{flex:1}}>
                  <p style={{fontSize:'15px',fontWeight:600,color:'#1e293b'}}>{option.label}</p>
                  <p style={{fontSize:'12px',color:'#64748b',marginTop:'2px'}}>{option.desc}</p>
                </div>
                {newStatus === option.value && <CheckCircle size={20} color={option.color} fill={option.color} />}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:'20px 24px',borderTop:'1px solid #e2e8f0',display:'flex',gap:'12px'}}>
          <button
            onClick={handleUpdateStatus}
            disabled={isUpdating || newStatus === quote.status}
            style={{
              flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px',
              background: newStatus === quote.status ? '#e2e8f0' : 'linear-gradient(135deg,#0d9488,#14b8a6)',
              color: newStatus === quote.status ? '#94a3b8' : '#fff',border:'none',borderRadius:'8px',
              fontWeight:600,fontSize:'14px',cursor: newStatus === quote.status ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1
            }}
          >
            {isUpdating ? <><Loader2 size={16} className="animate-spin"/>Updating...</> : 'Update Status'}
          </button>
          <button onClick={onClose} style={{flex:1,padding:'12px',background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0',borderRadius:'8px',fontWeight:600,fontSize:'14px',cursor:'pointer'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EDIT QUOTE MODAL
   ═══════════════════════════════════════════════════════════ */
function EditQuoteModal({ quote, onClose, onUpdate }) {
  const [form, setForm] = useState({
    title: quote.title,
    items: quote.items || [],
    discount: quote.discount || 0,
    tax: quote.tax || 10,
    notes: quote.notes || '',
    validUntil: quote.validUntil || '',
    terms: quote.terms || 'Net 30'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, productId: '', notes: '' }] });
  };

  const handleRemoveItem = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    if (field === 'productId') {
      const product = JONIX_PRODUCTS.find(p => p.id === value);
      if (product && !product.isCustom) {
        newItems[index] = { ...newItems[index], productId: value, description: product.name, unitPrice: product.price };
      } else {
        newItems[index] = { ...newItems[index], productId: value, description: '', unitPrice: 0 };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: field === 'description' || field === 'notes' ? value : value === '' ? '' : Number(value) };
    }
    setForm({ ...form, items: newItems });
  };

  const handleUpdateQuote = async () => {
    const hasInvalidItem = form.items.some(i => !i.description || i.unitPrice === '' || isNaN(Number(i.unitPrice)) || Number(i.unitPrice) < 0);
    if (!form.title || hasInvalidItem) { alert('Please fill in all required fields correctly.'); return; }
    setIsSubmitting(true);
    try {
      const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
      const discountAmount = subtotal * (form.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (form.tax / 100);
      const total = taxableAmount + taxAmount;

      await updateDoc(doc(db, 'quotes', quote.id), {
        title: form.title,
        items: form.items.map(item => ({ description: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), productId: item.productId || '', notes: item.notes || '' })),
        subtotal, discount: form.discount, discountAmount, tax: form.tax, taxAmount, total,
        notes: form.notes, validUntil: form.validUntil, terms: form.terms,
        updatedAt: serverTimestamp()
      });

      onUpdate();
      onClose();
      alert('Quote updated successfully!');
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Failed to update quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const discountAmount = subtotal * (form.discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (form.tax / 100);
  const total = taxableAmount + taxAmount;

  return (
    <div style={{position:'fixed',inset:0,zIndex:101,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',overflowY:'auto'}}>
      <div style={{background:'#fff',borderRadius:'16px',width:'100%',maxWidth:'900px',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 64px rgba(0,0,0,0.2)',margin:'auto'}}>
        <div style={{padding:'24px',borderBottom:'1px solid #e2e8f0',position:'sticky',top:0,background:'#fff',zIndex:10,borderRadius:'16px 16px 0 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><h3 style={{fontSize:'20px',fontWeight:700,color:'#1e293b',marginBottom:'4px'}}>Edit Quote</h3><p style={{fontSize:'13px',color:'#64748b'}}>#{quote.quoteNumber}</p></div>
            <button onClick={onClose} style={{width:'36px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer'}}><X size={18} color="#64748b"/></button>
          </div>
        </div>

        <div style={{padding:'24px'}}>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#1e293b',marginBottom:'8px'}}>Quote Title <span style={{color:'#ef4444'}}>*</span></label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{width:'100%',padding:'12px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'14px'}} placeholder="e.g., Air Purification System Installation"/>
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#1e293b',marginBottom:'12px'}}>Line Items <span style={{color:'#ef4444'}}>*</span></label>
            <div style={{display:'grid',gridTemplateColumns:'2fr 3fr 1fr 2fr 40px',gap:'8px',marginBottom:'8px',padding:'0 4px'}}>
              <span style={{fontSize:'11px',fontWeight:600,color:'#64748b',textTransform:'uppercase'}}>Product</span>
              <span style={{fontSize:'11px',fontWeight:600,color:'#64748b',textTransform:'uppercase'}}>Description</span>
              <span style={{fontSize:'11px',fontWeight:600,color:'#64748b',textTransform:'uppercase'}}>Qty</span>
              <span style={{fontSize:'11px',fontWeight:600,color:'#64748b',textTransform:'uppercase'}}>Unit Price (€)</span>
              <span></span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {form.items.map((item, index) => (
                <div key={index}>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 3fr 1fr 2fr 40px',gap:'8px',alignItems:'start'}}>
                    <select value={item.productId || ''} onChange={e => handleItemChange(index, 'productId', e.target.value)} style={{padding:'10px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px',background:'#fff'}}>
                      <option value="">Select product...</option>
                      {JONIX_PRODUCTS.map(product => <option key={product.id} value={product.id}>{product.name} {!product.isCustom && `(€${product.price})`}</option>)}
                    </select>
                    <input type="text" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Item description" disabled={item.productId && item.productId !== 'other'} style={{padding:'10px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px',background: item.productId && item.productId !== 'other' ? '#f8fafc' : '#fff'}}/>
                    <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} placeholder="1" min="1" style={{padding:'10px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px'}}/>
                    <input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} placeholder="0.00" min="0" step="0.01" disabled={item.productId && item.productId !== 'other'} style={{padding:'10px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px',background: item.productId && item.productId !== 'other' ? '#f8fafc' : '#fff'}}/>
                    <button onClick={() => handleRemoveItem(index)} disabled={form.items.length === 1} style={{width:'40px',height:'40px',display:'flex',alignItems:'center',justifyContent:'center',background:'#fef2f2',border:'1px solid #fee2e2',borderRadius:'8px',cursor: form.items.length === 1 ? 'not-allowed' : 'pointer',opacity: form.items.length === 1 ? 0.4 : 1}}><Trash2 size={16} color="#ef4444"/></button>
                  </div>
                  <div style={{marginTop:'8px',paddingLeft:'4px'}}>
                    <input type="text" value={item.notes || ''} onChange={e => handleItemChange(index, 'notes', e.target.value)} placeholder="Additional notes (optional)" style={{width:'100%',padding:'8px 12px',border:'1px solid #e2e8f0',borderRadius:'6px',fontSize:'12px',color:'#64748b'}}/>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleAddItem} style={{marginTop:'12px',display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',background:'#f0fdfa',color:'#0d9488',border:'1px solid #99f6e4',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer'}}><Plus size={16}/> Add Item</button>
          </div>

          <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'20px',marginBottom:'20px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'12px',fontSize:'14px'}}>
              <span style={{color:'#64748b'}}>Subtotal:</span><span style={{fontWeight:600,color:'#1e293b'}}>€ {subtotal.toFixed(2)}</span>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{color:'#64748b'}}>Discount:</span><input type="number" value={form.discount} onChange={e => setForm({...form, discount: Math.min(100, Math.max(0, Number(e.target.value)))})} min="0" max="100" style={{width:'60px',padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:'6px',fontSize:'13px'}}/><span style={{color:'#64748b'}}>%</span></div>
              <span style={{fontWeight:600,color:'#ef4444'}}>-€ {discountAmount.toFixed(2)}</span>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{color:'#64748b'}}>Tax:</span><input type="number" value={form.tax} onChange={e => setForm({...form, tax: Math.min(100, Math.max(0, Number(e.target.value)))})} min="0" max="100" style={{width:'60px',padding:'4px 8px',border:'1px solid #e2e8f0',borderRadius:'6px',fontSize:'13px'}}/><span style={{color:'#64748b'}}>%</span></div>
              <span style={{fontWeight:600,color:'#0d9488'}}>+€ {taxAmount.toFixed(2)}</span>
              <span style={{fontSize:'16px',fontWeight:700,color:'#1e293b',paddingTop:'12px',borderTop:'2px solid #e2e8f0'}}>Total:</span>
              <span style={{fontSize:'18px',fontWeight:700,color:'#0d9488',paddingTop:'12px',borderTop:'2px solid #e2e8f0'}}>€ {total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
            <div><label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#1e293b',marginBottom:'8px'}}>Valid Until</label><input type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} style={{width:'100%',padding:'10px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px'}}/></div>
            <div><label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#1e293b',marginBottom:'8px'}}>Payment Terms</label><select value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} style={{width:'100%',padding:'10px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px',background:'#fff'}}>{['Due Upon Receipt','Net 7','Net 15','Net 30','Net 45','Net 60'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#1e293b',marginBottom:'8px'}}>Additional Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional information for the client..." rows="3" style={{width:'100%',padding:'10px',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'13px',resize:'vertical'}}/>
          </div>

          <div style={{display:'flex',gap:'12px'}}>
            <button onClick={handleUpdateQuote} disabled={isSubmitting} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px',background:'linear-gradient(135deg,#0d9488,#14b8a6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,fontSize:'14px',cursor:'pointer',opacity: isSubmitting ? 0.6 : 1}}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin"/>Updating...</> : 'Update Quote'}
            </button>
            <button onClick={onClose} style={{flex:1,padding:'12px',background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0',borderRadius:'8px',fontWeight:600,fontSize:'14px',cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INVOICE PRINT COMPONENT
   ═══════════════════════════════════════════════════════════ */
function InvoicePrint({ quote, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '', 'width=900,height=1200');
    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title>Invoice ${quote.quoteNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Inter', sans-serif; background:#fff; color:#1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size:A4; margin:0; }
          @media print { body { width:210mm; min-height:297mm; } }
          .invoice-page { width:210mm; min-height:297mm; background:#fff; padding:28mm 22mm 18mm; position:relative; display:flex; flex-direction:column; }
          .accent-bar { position:absolute; top:0; left:0; right:0; height:16px; background:linear-gradient(135deg, #0d9488 0%, #14b8a6 25%, #06b6d4 50%, #0284c7 75%, #0ea5e9 100%); }
          .inv-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-top:8px; }
          .inv-brand .logo-text { font-family:'Playfair Display', serif; font-size:32px; font-weight:700; background:linear-gradient(135deg, #0d9488, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing:-0.8px; }
          .inv-brand .logo-sub { font-size:10px; text-transform:uppercase; letter-spacing:3px; color:#64748b; margin-top:4px; font-weight:500; }
          .inv-title-block { text-align:right; }
          .inv-title-block h1 { font-family:'Playfair Display', serif; font-size:40px; font-weight:700; color:#1e293b; letter-spacing:-1.2px; line-height:1; }
          .inv-title-block .inv-number { font-size:12px; color:#0d9488; font-weight:600; letter-spacing:1.5px; margin-top:6px; text-transform:uppercase; }
          .inv-title-block .inv-title { font-size:13px; color:#64748b; font-weight:500; margin-top:4px; }
          .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; margin-top:8px; }
          .status-draft { background:#fef3c7; color:#92400e; border:1px solid #fde047; }
          .status-sent { background:#dbeafe; color:#1e40af; border:1px solid #93c5fd; }
          .status-accepted { background:#d1fae5; color:#065f46; border:1px solid #6ee7b7; }
          .divider { height:1px; background:#e2e8f0; margin:20px 0; }
          .divider.heavy { height:2px; background:linear-gradient(90deg, #0d9488, #0ea5e9, transparent); margin:24px 0; }
          .info-row { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-bottom:28px; }
          .info-col .info-label { font-size:9px; text-transform:uppercase; letter-spacing:2.5px; color:#0d9488; font-weight:700; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #0d9488; display:inline-block; }
          .info-col .client-name { font-size:16px; font-weight:700; color:#1e293b; margin-bottom:8px; }
          .info-col .info-item { display:flex; align-items:center; gap:10px; margin-bottom:6px; font-size:11px; color:#475569; }
          .info-col .info-item .icon { width:16px; height:16px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; border-radius:4px; color:#0d9488; }
          .items-section { margin-bottom:16px; }
          .items-section-title { font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#0d9488; font-weight:700; margin-bottom:12px; padding-bottom:4px; border-bottom:2px solid #e2e8f0; }
          .items-table { width:100%; border-collapse:collapse; margin-bottom:8px; background:#fff; }
          .items-table thead th { background:linear-gradient(135deg, #f0fdfa, #ecfeff); font-size:9px; text-transform:uppercase; letter-spacing:1.8px; color:#0d9488; font-weight:700; text-align:left; padding:12px 14px; border-bottom:2px solid #0d9488; }
          .items-table thead th:last-child { text-align:right; }
          .items-table thead th.center { text-align:center; }
          .items-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background 0.2s; }
          .items-table tbody tr:hover { background:#f8fafc; }
          .items-table tbody tr:last-child { border-bottom:2px solid #e2e8f0; }
          .items-table tbody td { padding:12px 14px; font-size:11px; color:#475569; vertical-align:top; }
          .items-table tbody td.center { text-align:center; }
          .items-table tbody td.right { text-align:right; font-weight:700; color:#1e293b; font-size:12px; }
          .items-table tbody td.desc { color:#1e293b; font-weight:600; font-size:12px; }
          .items-table tbody td.desc-detail { color:#64748b; font-size:10px; font-weight:400; line-height:1.5; padding-top:4px; }
          .items-table .row-num { color:#cbd5e1; font-size:11px; font-weight:700; width:40px; }
          .product-badge { display:inline-block; padding:2px 8px; background:#ecfeff; color:#0891b2; border-radius:12px; font-size:8px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
          .totals-wrap { display:flex; justify-content:flex-end; margin-top:12px; }
          .totals-box { width:300px; background:linear-gradient(135deg, #f8fafc, #f0fdfa); border:2px solid #e2e8f0; border-radius:12px; padding:20px; }
          .totals-row { display:flex; justify-content:space-between; padding:8px 0; font-size:11px; color:#64748b; border-bottom:1px solid #e2e8f0; }
          .totals-row .t-label { font-weight:600; }
          .totals-row .t-val { font-weight:700; color:#1e293b; font-size:12px; }
          .totals-row.discount .t-val { color:#ef4444; }
          .totals-row.tax .t-val { color:#0d9488; }
          .totals-row.grand { border-bottom:none; border-top:3px solid #0d9488; margin-top:8px; padding-top:12px; }
          .totals-row.grand .t-label { font-size:14px; font-weight:700; color:#1e293b; text-transform:uppercase; letter-spacing:1px; }
          .totals-row.grand .t-val { font-size:20px; font-weight:700; background:linear-gradient(135deg, #0d9488, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .bottom-section { display:flex; gap:20px; margin-top:24px; }
          .terms-box { flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #0d9488; border-radius:8px; padding:16px 18px; }
          .terms-box .terms-title { font-size:9px; text-transform:uppercase; letter-spacing:2px; color:#0d9488; font-weight:700; margin-bottom:8px; }
          .terms-box .terms-text { font-size:10px; color:#64748b; line-height:1.6; }
          .inv-footer { margin-top:auto; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
          .inv-footer .footer-left { font-size:10px; color:#94a3b8; font-style:italic; }
          .inv-footer .footer-right { font-size:9px; color:#94a3b8; text-align:right; }
          .footer-contact { font-size:9px; color:#64748b; margin-top:4px; }
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
      <div style={{background:'#fff',borderRadius:'16px',width:'100%',maxWidth:'960px',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 40px 80px rgba(0,0,0,0.2)',position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 24px',borderBottom:'1px solid #e2e8f0',background:'#fafbfc',borderRadius:'16px 16px 0 0',position:'sticky',top:0,zIndex:10}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{background:'linear-gradient(135deg,#0d9488,#14b8a6)',padding:'8px',borderRadius:'8px',display:'flex'}}><FileText color="#fff" size={18}/></div>
            <div><p style={{fontWeight:600,color:'#1e293b',fontSize:'15px'}}>{quote.title}</p><p style={{fontSize:'12px',color:'#64748b'}}>#{quote.quoteNumber}</p></div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={handlePrint} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 18px',background:'linear-gradient(135deg,#0d9488,#14b8a6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,fontSize:'13px',cursor:'pointer',boxShadow:'0 3px 10px rgba(13,148,136,0.3)'}}><Download size={15}/> Print / Save PDF</button>
            <button onClick={onClose} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'36px',height:'36px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',color:'#64748b'}}><X size={18}/></button>
          </div>
        </div>

        <div style={{padding:'24px',background:'#f0f4f8',display:'flex',justifyContent:'center'}}>
          <div ref={printRef} style={{width:'210mm',minHeight:'297mm',background:'#fff',padding:'28mm 22mm 18mm',position:'relative',boxShadow:'0 4px 24px rgba(0,0,0,0.1)',borderRadius:'4px',display:'flex',flexDirection:'column'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'16px',background:'linear-gradient(135deg, #0d9488 0%, #14b8a6 25%, #06b6d4 50%, #0284c7 75%, #0ea5e9 100%)',borderRadius:'4px 4px 0 0'}}/>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px',paddingTop:'8px'}}>
              <div>
                <p style={{fontFamily:"'Playfair Display', serif",fontSize:'32px',fontWeight:700,background:'linear-gradient(135deg, #0d9488, #0ea5e9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',letterSpacing:'-0.8px'}}>Jonix</p>
                <p style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'3px',color:'#64748b',marginTop:'4px',fontWeight:500}}>Arabia</p>
              </div>
              <div style={{textAlign:'right'}}>
                <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:'40px',fontWeight:700,color:'#1e293b',letterSpacing:'-1.2px',lineHeight:1}}>INVOICE</h1>
                <p style={{fontSize:'12px',color:'#0d9488',fontWeight:600,letterSpacing:'1.5px',marginTop:'6px',textTransform:'uppercase'}}>#{quote.quoteNumber}</p>
                <p style={{fontSize:'13px',color:'#64748b',fontWeight:500,marginTop:'4px'}}>{quote.title}</p>
                <span className={statusClass} style={{display:'inline-block',marginTop:'8px',padding:'4px 12px',borderRadius:'20px',fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1.2px',background: quote.status==='draft'?'#fef3c7':quote.status==='sent'?'#dbeafe':'#d1fae5',color: quote.status==='draft'?'#92400e':quote.status==='sent'?'#1e40af':'#065f46',border: quote.status==='draft'?'1px solid #fde047':quote.status==='sent'?'1px solid #93c5fd':'1px solid #6ee7b7'}}>{quote.status}</span>
              </div>
            </div>

            <div style={{height:'2px',background:'linear-gradient(90deg, #0d9488, #0ea5e9, transparent)',margin:'24px 0'}}/>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',marginBottom:'28px'}}>
              <div>
                <p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'2.5px',color:'#0d9488',fontWeight:700,marginBottom:'12px',paddingBottom:'6px',borderBottom:'2px solid #0d9488',display:'inline-block'}}>Bill To</p>
                <p style={{fontSize:'16px',fontWeight:700,color:'#1e293b',marginBottom:'8px'}}>{quote.clientName || 'N/A'}</p>
                {quote.clientEmail && <p style={{fontSize:'11px',color:'#475569',marginBottom:'6px',display:'flex',alignItems:'center',gap:'10px'}}><span style={{width:'16px',height:'16px',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0fdfa',borderRadius:'4px',color:'#0d9488'}}>✉</span>{quote.clientEmail}</p>}
                {quote.clientPhone && <p style={{fontSize:'11px',color:'#475569',display:'flex',alignItems:'center',gap:'10px'}}><span style={{width:'16px',height:'16px',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0fdfa',borderRadius:'4px',color:'#0d9488'}}>☎</span>{quote.clientPhone}</p>}
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'2.5px',color:'#0d9488',fontWeight:700,marginBottom:'12px',paddingBottom:'6px',borderBottom:'2px solid #0d9488',display:'inline-block'}}>Invoice Details</p>
                <p style={{fontSize:'11px',color:'#475569',marginBottom:'6px'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',marginRight:'8px'}}>Date</span><span style={{fontWeight:600,color:'#1e293b'}}>{quote.createdAt?.toDate ? new Date(quote.createdAt.toDate()).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'N/A'}</span></p>
                {quote.validUntil && <p style={{fontSize:'11px',color:'#475569',marginBottom:'6px'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',marginRight:'8px'}}>Valid Until</span><span style={{fontWeight:600,color:'#1e293b'}}>{quote.validUntil}</span></p>}
                <p style={{fontSize:'11px',color:'#475569'}}><span style={{color:'#94a3b8',fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',marginRight:'8px'}}>Terms</span><span style={{fontWeight:600,color:'#1e293b'}}>{quote.terms || 'Net 30'}</span></p>
              </div>
            </div>

            <div style={{marginBottom:'16px'}}>
              <p style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:700,marginBottom:'12px',paddingBottom:'4px',borderBottom:'2px solid #e2e8f0'}}>Line Items</p>
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'8px',background:'#fff'}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg, #f0fdfa, #ecfeff)'}}>
                    <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.8px',color:'#0d9488',fontWeight:700,textAlign:'left',padding:'12px 14px',borderBottom:'2px solid #0d9488',width:'5%'}}>#</th>
                    <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.8px',color:'#0d9488',fontWeight:700,textAlign:'left',padding:'12px 14px',borderBottom:'2px solid #0d9488'}}>Description</th>
                    <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.8px',color:'#0d9488',fontWeight:700,textAlign:'center',padding:'12px 14px',borderBottom:'2px solid #0d9488',width:'10%'}}>Qty</th>
                    <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.8px',color:'#0d9488',fontWeight:700,textAlign:'right',padding:'12px 14px',borderBottom:'2px solid #0d9488',width:'18%'}}>Unit Price</th>
                    <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.8px',color:'#0d9488',fontWeight:700,textAlign:'right',padding:'12px 14px',borderBottom:'2px solid #0d9488',width:'18%'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(quote.items || []).map((item, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                      <td style={{padding:'12px 14px',fontSize:'11px',color:'#cbd5e1',fontWeight:700,width:'40px'}}>{String(i+1).padStart(2,'0')}</td>
                      <td style={{padding:'12px 14px',fontSize:'12px',color:'#1e293b',fontWeight:600,verticalAlign:'top'}}>
                        {item.description}
                        {item.productId && item.productId !== 'other' && (
                          <div style={{marginTop:'4px'}}><span style={{display:'inline-block',padding:'2px 8px',background:'#ecfeff',color:'#0891b2',borderRadius:'12px',fontSize:'8px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>{JONIX_PRODUCTS.find(p => p.id === item.productId)?.name}</span></div>
                        )}
                        {item.notes && <div style={{color:'#64748b',fontSize:'10px',fontWeight:400,lineHeight:1.5,paddingTop:'4px'}}>{item.notes}</div>}
                      </td>
                      <td style={{padding:'12px 14px',fontSize:'11px',color:'#475569',textAlign:'center',verticalAlign:'top'}}>{item.quantity}</td>
                      <td style={{padding:'12px 14px',fontSize:'11px',color:'#475569',textAlign:'right',verticalAlign:'top'}}>€ {Number(item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                      <td style={{padding:'12px 14px',fontSize:'12px',color:'#1e293b',fontWeight:700,textAlign:'right',verticalAlign:'top'}}>€ {(item.quantity * item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'12px'}}>
              <div style={{width:'300px',background:'linear-gradient(135deg, #f8fafc, #f0fdfa)',border:'2px solid #e2e8f0',borderRadius:'12px',padding:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:'11px',color:'#64748b',borderBottom:'1px solid #e2e8f0'}}><span style={{fontWeight:600}}>Subtotal</span><span style={{fontWeight:700,color:'#1e293b',fontSize:'12px'}}>€ {(quote.subtotal||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>
                {quote.discount > 0 && <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:'11px',color:'#64748b',borderBottom:'1px solid #e2e8f0'}}><span style={{fontWeight:600}}>Discount ({quote.discount}%)</span><span style={{fontWeight:700,color:'#ef4444',fontSize:'12px'}}>-€ {(quote.discountAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:'11px',color:'#64748b',borderBottom:'1px solid #e2e8f0'}}><span style={{fontWeight:600}}>Tax ({quote.tax}%)</span><span style={{fontWeight:700,color:'#0d9488',fontSize:'12px'}}>+€ {(quote.taxAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0 0',fontSize:'14px',borderTop:'3px solid #0d9488',marginTop:'8px'}}><span style={{fontWeight:700,color:'#1e293b',textTransform:'uppercase',letterSpacing:'1px'}}>Total</span><span style={{fontWeight:700,fontSize:'20px',background:'linear-gradient(135deg, #0d9488, #0ea5e9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>€ {(quote.total||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>
              </div>
            </div>

            {(quote.terms || quote.notes) && (
              <div style={{display:'flex',gap:'20px',marginTop:'24px'}}>
                {quote.terms && <div style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderLeft:'4px solid #0d9488',borderRadius:'8px',padding:'16px 18px'}}><p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:700,marginBottom:'8px'}}>Payment Terms</p><p style={{fontSize:'10px',color:'#64748b',lineHeight:1.6}}>{quote.terms}</p></div>}
                {quote.notes && <div style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderLeft:'4px solid #0ea5e9',borderRadius:'8px',padding:'16px 18px'}}><p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'2px',color:'#0ea5e9',fontWeight:700,marginBottom:'8px'}}>Notes</p><p style={{fontSize:'10px',color:'#64748b',lineHeight:1.6}}>{quote.notes}</p></div>}
              </div>
            )}

            <div style={{marginTop:'auto',paddingTop:'20px',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'32px'}}>
              <p style={{fontSize:'10px',color:'#94a3b8',fontStyle:'italic'}}>Thank you for your business.</p>
              <div style={{textAlign:'right'}}><p style={{fontSize:'9px',color:'#94a3b8'}}>Generated by Jonix CRM • Confidential</p><p style={{fontSize:'9px',color:'#64748b',marginTop:'4px'}}>www.jonix.com • info@jonix.com</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW QUOTE MODAL
   ═══════════════════════════════════════════════════════════ */
function ViewQuoteModal({ quote, onClose, onPDF, onEdit, onStatusChange }) {
  const fmtDate = (ts) => {
    try { return new Date(ts.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return 'N/A'; }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(15,23,42,0.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'16px',width:'100%',maxWidth:'720px',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 32px 64px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px',borderBottom:'1px solid #e2e8f0',background:'#fafbfc',borderRadius:'16px 16px 0 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{background:'linear-gradient(135deg,#0d9488,#14b8a6)',padding:'9px',borderRadius:'10px',display:'flex'}}><FileText color="#fff" size={20}/></div>
            <div><p style={{fontWeight:700,color:'#1e293b',fontSize:'16px'}}>{quote.title}</p><p style={{fontSize:'12px',color:'#64748b'}}>#{quote.quoteNumber}</p></div>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={onEdit} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#f0fdfa',color:'#0d9488',border:'1px solid #99f6e4',borderRadius:'8px',fontWeight:600,fontSize:'13px',cursor:'pointer'}}><Edit size={14}/> Edit</button>
            <button onClick={onStatusChange} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',borderRadius:'8px',fontWeight:600,fontSize:'13px',cursor:'pointer'}}><Send size={14}/> Status</button>
            <button onClick={onPDF} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',background:'linear-gradient(135deg,#0d9488,#14b8a6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,fontSize:'13px',cursor:'pointer'}}><Download size={14}/> PDF</button>
            <button onClick={onClose} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'36px',height:'36px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',color:'#64748b'}}><X size={18}/></button>
          </div>
        </div>

        <div style={{padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'20px',fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',background: quote.status==='draft'?'#fef3c7':quote.status==='sent'?'#dbeafe':'#d1fae5',color: quote.status==='draft'?'#92400e':quote.status==='sent'?'#1e40af':'#065f46',border: quote.status==='draft'?'1px solid #fde047':quote.status==='sent'?'1px solid #93c5fd':'1px solid #6ee7b7'}}>
              <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'currentColor'}}/>{quote.status}
            </span>
            <span style={{fontSize:'12px',color:'#94a3b8'}}>{fmtDate(quote.createdAt)}</span>
          </div>

          <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'18px',marginBottom:'24px'}}>
            <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:600,marginBottom:'12px'}}>Client Information</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{background:'#e0f2fe',padding:'6px',borderRadius:'8px',display:'flex'}}><Building2 size={14} color="#0284c7"/></div>
                <div><p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Client</p><p style={{fontSize:'13px',fontWeight:600,color:'#1e293b'}}>{quote.clientName||'—'}</p></div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{background:'#e0f2fe',padding:'6px',borderRadius:'8px',display:'flex'}}><Mail size={14} color="#0284c7"/></div>
                <div><p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Email</p><p style={{fontSize:'12px',color:'#475569'}}>{quote.clientEmail||'—'}</p></div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{background:'#e0f2fe',padding:'6px',borderRadius:'8px',display:'flex'}}><Phone size={14} color="#0284c7"/></div>
                <div><p style={{fontSize:'9px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px'}}>Phone</p><p style={{fontSize:'12px',color:'#475569'}}>{quote.clientPhone||'—'}</p></div>
              </div>
            </div>
          </div>

          <div style={{marginBottom:'24px'}}>
            <p style={{fontSize:'8px',textTransform:'uppercase',letterSpacing:'2px',color:'#0d9488',fontWeight:600,marginBottom:'10px'}}>Line Items</p>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f1f5f9'}}>
                  <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',color:'#64748b',fontWeight:600,padding:'10px 12px',borderBottom:'2px solid #e2e8f0',textAlign:'left'}}>#</th>
                  <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',color:'#64748b',fontWeight:600,padding:'10px 12px',borderBottom:'2px solid #e2e8f0',textAlign:'left'}}>Description</th>
                  <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',color:'#64748b',fontWeight:600,padding:'10px 12px',borderBottom:'2px solid #e2e8f0',textAlign:'right'}}>Qty</th>
                  <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',color:'#64748b',fontWeight:600,padding:'10px 12px',borderBottom:'2px solid #e2e8f0',textAlign:'right'}}>Unit Price</th>
                  <th style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',color:'#64748b',fontWeight:600,padding:'10px 12px',borderBottom:'2px solid #e2e8f0',textAlign:'right'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items||[]).map((item,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                    <td style={{padding:'10px 12px',fontSize:'11px',color:'#cbd5e1',fontWeight:600}}>{String(i+1).padStart(2,'0')}</td>
                    <td style={{padding:'10px 12px',fontSize:'13px',color:'#1e293b',fontWeight:500}}>
                      {item.description}
                      {item.notes && <div style={{fontSize:'11px',color:'#64748b',marginTop:'4px'}}>{item.notes}</div>}
                    </td>
                    <td style={{padding:'10px 12px',fontSize:'13px',color:'#475569',textAlign:'right'}}>{item.quantity}</td>
                    <td style={{padding:'10px 12px',fontSize:'13px',color:'#475569',textAlign:'right'}}>€ {Number(item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                    <td style={{padding:'10px 12px',fontSize:'13px',color:'#1e293b',fontWeight:600,textAlign:'right'}}>€ {(item.quantity*item.unitPrice).toLocaleString('en',{minimumFractionDigits:2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div style={{width:'280px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'13px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}><span>Subtotal</span><span style={{fontWeight:600,color:'#1e293b'}}>€ {(quote.subtotal||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>
              {quote.discount > 0 && <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'13px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}><span>Discount ({quote.discount}%)</span><span style={{fontWeight:600,color:'#ef4444'}}>-€ {(quote.discountAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:'13px',color:'#64748b',borderBottom:'1px solid #f1f5f9'}}><span>Tax ({quote.tax}%)</span><span style={{fontWeight:600,color:'#0d9488'}}>+€ {(quote.taxAmount||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',borderTop:'2px solid #1e293b',marginTop:'6px'}}><span style={{fontWeight:700,color:'#1e293b',fontSize:'15px'}}>Total</span><span style={{fontWeight:700,color:'#0d9488',fontSize:'20px'}}>€ {(quote.total||0).toLocaleString('en',{minimumFractionDigits:2})}</span></div>
            </div>
          </div>

          {(quote.terms || quote.notes) && (
            <div style={{display:'flex',gap:'16px',marginTop:'24px'}}>
              {quote.terms && <div style={{flex:1,background:'#f0fdfc',border:'1px solid #a7f3d0',borderRadius:'10px',padding:'14px'}}><p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#0d9488',fontWeight:600,marginBottom:'4px'}}>Payment Terms</p><p style={{fontSize:'13px',color:'#1e293b',fontWeight:500}}>{quote.terms}</p></div>}
              {quote.notes && <div style={{flex:1,background:'#fefce8',border:'1px solid #fde047',borderRadius:'10px',padding:'14px'}}><p style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1.5px',color:'#ca8a04',fontWeight:600,marginBottom:'4px'}}>Notes</p><p style={{fontSize:'13px',color:'#1e293b'}}>{quote.notes}</p></div>}
            </div>
          )}
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

  const [viewQuote, setViewQuote] = useState(null);
  const [pdfQuote, setPdfQuote] = useState(null);
  const [editQuote, setEditQuote] = useState(null);
  const [statusQuote, setStatusQuote] = useState(null);

  const initialForm = {
    dealId: '', quoteNumber: '', title: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, productId: '', notes: '' }],
    discount: 0, tax: 10, notes: '', validUntil: '', terms: 'Net 30'
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (currentUser) { loadDeals(); loadQuotes(); }
  }, [currentUser, userRole]);

  async function loadDeals() {
    try {
      let q;
      if (userRole === 'admin') { q = query(collection(db, 'sales')); }
      else { q = query(collection(db, 'sales'), where('createdBy', '==', currentUser.uid)); }
      const snap = await getDocs(q);
      const allDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDeals(allDeals.filter(d => d.archived !== true));
    } catch (e) { console.error('Error loading deals:', e); }
  }

  async function loadQuotes() {
    try {
      setLoading(true);
      let q;
      if (userRole === 'admin') { q = query(collection(db, 'quotes')); }
      else { q = query(collection(db, 'quotes'), where('createdBy', '==', currentUser.uid)); }
      const snap = await getDocs(q);
      setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error('Error loading quotes:', e); }
    finally { setLoading(false); }
  }

  async function handleCreateQuote() {
    const hasInvalidItem = form.items.some(i => !i.description || i.unitPrice === '' || isNaN(Number(i.unitPrice)) || Number(i.unitPrice) < 0);
    if (!form.dealId || !form.title || hasInvalidItem) { alert('Please fill in all required fields correctly.'); return; }
    setIsSubmitting(true);
    try {
      const deal = deals.find(d => d.id === form.dealId);
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
        quoteNumber: form.quoteNumber || `QT-${Date.now()}`, title: form.title,
        items: form.items.map(item => ({ description: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), productId: item.productId || '', notes: item.notes || '' })),
        subtotal, discount: form.discount, discountAmount, tax: form.tax, taxAmount, total,
        notes: form.notes, validUntil: form.validUntil, terms: form.terms,
        status: 'draft', createdBy: currentUser.uid,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });

      setForm(initialForm); setSelectedDeal(null); setShowForm(false);
      await loadQuotes();
      alert('Quote created successfully!');
    } catch (e) {
      console.error('Error creating quote:', e);
      alert(`Failed to create quote: ${e.message || 'Unknown error'}`);
    } finally { setIsSubmitting(false); }
  }

  const handleAddItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, productId: '', notes: '' }] });
  const handleRemoveItem = (index) => { if (form.items.length === 1) return; setForm({ ...form, items: form.items.filter((_, i) => i !== index) }); };
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    if (field === 'productId') {
      const product = JONIX_PRODUCTS.find(p => p.id === value);
      if (product && !product.isCustom) {
        newItems[index] = { ...newItems[index], productId: value, description: product.name, unitPrice: product.price };
      } else {
        newItems[index] = { ...newItems[index], productId: value, description: '', unitPrice: 0 };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: field === 'description' || field === 'notes' ? value : value === '' ? '' : Number(value) };
    }
    setForm({ ...form, items: newItems });
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.clientName?.toLowerCase().includes(search.toLowerCase()) || q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) || q.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const subtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const discountAmount = subtotal * (form.discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (form.tax / 100);
  const total = taxableAmount + taxAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      {viewQuote && <ViewQuoteModal quote={viewQuote} onClose={() => setViewQuote(null)} onPDF={() => { setPdfQuote(viewQuote); setViewQuote(null); }} onEdit={() => { setEditQuote(viewQuote); setViewQuote(null); }} onStatusChange={() => { setStatusQuote(viewQuote); setViewQuote(null); }} />}
      {pdfQuote && <InvoicePrint quote={pdfQuote} onClose={() => setPdfQuote(null)} />}
      {editQuote && <EditQuoteModal quote={editQuote} onClose={() => setEditQuote(null)} onUpdate={() => { loadQuotes(); setEditQuote(null); }} />}
      {statusQuote && <StatusChangeModal quote={statusQuote} onClose={() => setStatusQuote(null)} onUpdate={() => { loadQuotes(); setStatusQuote(null); }} />}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl"><FileText className="text-white" size={28} /></div>
            <div><h1 className="text-3xl font-bold text-gray-900">Quote Generator</h1><p className="text-gray-500">Create and manage professional quotes</p></div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg"><Plus size={20} />{showForm ? 'Close Form' : 'New Quote'}</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Quote</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deal <span className="text-red-500">*</span></label>
              <select value={form.dealId} onChange={(e) => { const deal = deals.find(d => d.id === e.target.value); setForm({...form, dealId: e.target.value}); setSelectedDeal(deal||null); }} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                <option value="">Select a deal</option>
                {deals.map(deal => <option key={deal.id} value={deal.id}>{deal.businessName||deal.clientName||deal.name||'Unknown'} — € {(deal.amount||0).toLocaleString()}</option>)}
              </select>
              {deals.length === 0 && <p className="text-xs text-red-500 mt-1">No active deals found.</p>}
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Quote Number</label><input type="text" value={form.quoteNumber} onChange={e=>setForm({...form,quoteNumber:e.target.value})} placeholder="Auto-generated if left blank" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/></div>
          </div>
          <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-2">Quote Title <span className="text-red-500">*</span></label><input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g., Air Purification System Installation" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/></div>
          {selectedDeal && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"><p className="text-sm font-semibold text-blue-800 mb-1">Selected Deal: {selectedDeal.businessName||selectedDeal.clientName||selectedDeal.name}</p><p className="text-xs text-blue-600">{selectedDeal.email||selectedDeal.clientEmail||'No email'} • {selectedDeal.phone||selectedDeal.clientPhone||'No phone'}</p></div>}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-12 gap-3 mb-2 px-1">
              <span className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Product</span>
              <span className="col-span-4 text-xs font-semibold text-gray-500 uppercase">Description</span>
              <span className="col-span-1 text-xs font-semibold text-gray-500 uppercase">Qty</span>
              <span className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Unit Price (€)</span>
              <span className="col-span-1"></span>
            </div>
            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index}>
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <select value={item.productId || ''} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="col-span-3 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white">
                      <option value="">Select product...</option>
                      {JONIX_PRODUCTS.map(product => <option key={product.id} value={product.id}>{product.name} {!product.isCustom && `(€${product.price})`}</option>)}
                    </select>
                    <input type="text" placeholder="Item description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} disabled={item.productId && item.productId !== 'other'} className="col-span-4 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm disabled:bg-gray-50"/>
                    <input type="number" placeholder="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="col-span-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" min="1"/>
                    <input type="number" placeholder="0.00" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} disabled={item.productId && item.productId !== 'other'} className="col-span-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm disabled:bg-gray-50" min="0" step="0.01"/>
                    <button type="button" onClick={()=>handleRemoveItem(index)} disabled={form.items.length===1} className="col-span-1 flex justify-center px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 size={18}/></button>
                  </div>
                  <input type="text" value={item.notes || ''} onChange={e => handleItemChange(index, 'notes', e.target.value)} placeholder="Additional notes (optional)" className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"><Plus size={18}/> Add Item</button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-semibold">€ {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-gray-600">Discount:</span><input type="number" value={form.discount} onChange={e=>setForm({...form,discount:Math.min(100,Math.max(0,Number(e.target.value)))})} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" min="0" max="100"/><span className="text-gray-600">%</span></div><span className="font-semibold text-red-600">-€ {discountAmount.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-gray-600">Tax:</span><input type="number" value={form.tax} onChange={e=>setForm({...form,tax:Math.min(100,Math.max(0,Number(e.target.value)))})} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" min="0" max="100"/><span className="text-gray-600">%</span></div><span className="font-semibold text-green-600">+€ {taxAmount.toFixed(2)}</span></div>
              <div className="pt-3 border-t-2 border-gray-300 flex justify-between"><span className="text-lg font-bold text-gray-900">Total:</span><span className="text-lg font-bold text-orange-600">€ {total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until</label><input type="date" value={form.validUntil} onChange={e=>setForm({...form,validUntil:e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label><select value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">{['Due Upon Receipt','Net 7','Net 15','Net 30','Net 45','Net 60'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label><input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g., Thank you for your business" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/></div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleCreateQuote} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">{isSubmitting ? <><Loader2 size={18} className="animate-spin"/>Creating...</> : 'Create Quote'}</button>
            <button type="button" onClick={()=>{setShowForm(false);setForm(initialForm);setSelectedDeal(null);}} className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-all">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Search by client, quote number, or title..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/></div>
          <div className="flex gap-2 flex-wrap">{['all','draft','sent','accepted'].map(status => <button key={status} type="button" onClick={()=>setFilterStatus(status)} className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${filterStatus===status?'bg-orange-500 text-white shadow-md':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</button>)}</div>
        </div>
      </div>

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
                <div className="flex justify-between items-center"><span className="text-gray-600 font-medium">Total Amount:</span><span className="text-2xl font-bold text-orange-600">€ {quote.total?.toFixed(2)||'0.00'}</span></div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setViewQuote(quote)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium text-sm"><Eye size={16}/> View</button>
                <button type="button" onClick={()=>setEditQuote(quote)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium text-sm"><Edit size={16}/> Edit</button>
                <button type="button" onClick={()=>setPdfQuote(quote)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"><Download size={16}/> PDF</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}