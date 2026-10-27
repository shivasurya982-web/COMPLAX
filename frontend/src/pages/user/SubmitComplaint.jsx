import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Send,
  Building2,
  Tags,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  MapPin,
  User,
  Phone,
  FileText,
  ArrowLeft
} from 'lucide-react';

import ComplaintSuggestionInput from '../../components/ComplaintSuggestionInput';

const SubmitComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reporterName, setReporterName] = useState(user?.fullName || '');
  const [reporterPhone, setReporterPhone] = useState(user?.phone || '');
  const [locationDetails, setLocationDetails] = useState('');
  const [complaintText, setComplaintText] = useState('');
  
  // Dataset verified record state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [assignedCategory, setAssignedCategory] = useState(user?.category || 'General');

  // AI Prediction state for unassisted complaints
  const [predictedPriority, setPredictedPriority] = useState('Medium');
  const [confidence, setConfidence] = useState(0.5);
  const [predicting, setPredicting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);

  // Debounced live AI Priority prediction (only when no dataset suggestion is chosen)
  useEffect(() => {
    if (selectedRecord) return; // Do not run ML prediction when user picked an authoritative dataset record

    if (!complaintText.trim() || complaintText.trim().length < 8) {
      setPredictedPriority('Medium');
      setConfidence(0.5);
      return;
    }

    const timer = setTimeout(async () => {
      setPredicting(true);
      try {
        const res = await api.post('/complaints/predict', {
          complaint: complaintText,
          organizationId: user?.organizationId || 'default'
        });
        if (res.data?.priority) {
          setPredictedPriority(res.data.priority);
          setConfidence(res.data.confidence || 0.85);
        }
      } catch (err) {
        console.error('Prediction failed, using fallback');
      } finally {
        setPredicting(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [complaintText, user?.organizationId, selectedRecord]);

  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
    setComplaintText(record.displayText || record.complaint);
    if (record.category) {
      setAssignedCategory(record.category);
    }
  };

  const handleClearRecord = () => {
    setSelectedRecord(null);
    setAssignedCategory(user?.category || 'General');
  };

  const getLocationPlaceholder = () => {
    switch (user?.category) {
      case 'Hostel':
      case 'College Hostel':
        return 'e.g. Block B, Room 302, 3rd Floor';
      case 'Apartment':
      case 'Residential Building':
        return 'e.g. Tower 2, Flat 405, 4th Floor';
      case 'Office':
        return 'e.g. Wing A, 2nd Floor, Cabin 204';
      default:
        return 'e.g. Room 302 or specific area/floor';
    }
  };

  const effectivePriority = selectedRecord ? selectedRecord.priority : predictedPriority;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!complaintText.trim()) {
      setError('Please provide a description of the problem.');
      return;
    }
    if (!locationDetails.trim()) {
      setError('Please provide the location or room number.');
      return;
    }
    if (!reporterName.trim() || !reporterPhone.trim()) {
      setError('Reporter name and contact phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: user.userId,
        userName: reporterName.trim(),
        userPhone: reporterPhone.trim(),
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        category: assignedCategory,
        locationDetails: locationDetails.trim(),
        complaint: complaintText.trim(),
        priority: effectivePriority,
        selectedRecordId: selectedRecord?.recordId || null
      };

      const res = await api.post('/complaints', payload);
      setSuccessComplaint(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successComplaint) {
    return (
      <div className="animate-fade" style={{ maxWidth: '680px', margin: '2rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: '#10B981'
          }}>
            <CheckCircle size={40} />
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Complaint Submitted Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Your issue has been logged with <strong>{user?.organizationName}</strong>. The organization administrator and team have been notified.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            border: '1px solid var(--border)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Complaint ID:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>{successComplaint.complaintId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI Assigned Priority:</span>
              <span className={`badge badge-${successComplaint.priority?.toLowerCase()}`}>{successComplaint.priority}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status:</span>
              <span className="status-text status-pending">{successComplaint.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location:</span>
              <span style={{ fontWeight: 600 }}>{successComplaint.locationDetails}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setSuccessComplaint(null);
                setComplaintText('');
                setLocationDetails('');
              }}
              className="btn-primary"
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            >
              Submit Another Issue
            </button>
            <button
              onClick={() => navigate('/user/my-complaints')}
              className="btn-primary"
            >
              Track in My Complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  // effectivePriority is already correctly defined above (line 107) with dataset record awareness

  return (
    <div className="animate-fade" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="dashboard-title" style={{ margin: 0 }}>Submit New Complaint</h2>
          <p className="dashboard-subtitle" style={{ margin: 0 }}>Report an issue to {user?.organizationName}. Our ML engine automatically categorizes and prioritizes issues.</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#EF4444',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem'
        }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="card" style={{ position: 'relative', overflow: 'visible' }}>
        <form onSubmit={handleSubmit}>
          {/* Organization context strip */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Organization:</span>
              <strong style={{ fontSize: '0.9rem' }}>{user?.organizationName}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tags size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category:</span>
              <strong style={{ fontSize: '0.9rem' }}>{user?.category}</strong>
            </div>
          </div>

          {/* Reporter details */}
          <div className="responsive-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="var(--primary)" /> YOUR NAME
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Full Name"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="var(--primary)" /> CONTACT PHONE NUMBER
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +91 9876543210"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="var(--primary)" /> EXACT LOCATION / ROOM NUMBER
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={getLocationPlaceholder()}
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              required
            />
          </div>

          {/* Complaint description with live dataset suggestions */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <ComplaintSuggestionInput
              value={complaintText}
              onChange={setComplaintText}
              onSelectRecord={handleSelectRecord}
              onClearRecord={handleClearRecord}
              selectedRecord={selectedRecord}
              organizationId={user?.organizationId}
              rows={4}
              placeholder="Describe what is broken, leaking, or needs attention. Live suggestions will appear as you type..."
              required
            />
          </div>

          {/* Live AI Priority Prediction & Dataset Priority Strip */}
          <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: selectedRecord 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(224, 109, 67, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(224, 109, 67, 0.05) 0%, rgba(107, 70, 193, 0.05) 100%)',
            border: selectedRecord ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Assigned Priority:</span>
                <span className={`badge badge-${effectivePriority?.toLowerCase()}`} style={{ fontWeight: 700 }}>
                  {effectivePriority} Priority
                </span>
                {selectedRecord ? (
                  <span style={{
                    fontSize: '0.725rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10B981',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}>
                    Authoritative Dataset Match
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({Math.round(confidence * 100)}% ML Confidence)
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {selectedRecord
                  ? `Priority locked directly to dataset record "${selectedRecord.displayText}" (${selectedRecord.recordId}). Category set to ${assignedCategory}.`
                  : 'Determined automatically using the organization’s trained Machine Learning model.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/user/dashboard')}
              className="btn-primary"
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting Issue...' : <>Submit Complaint <Send size={18} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
