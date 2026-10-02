import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, Plus, Tags, Search } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCats(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      await api.post('/categories', { name: newCat });
      setNewCat('');
      fetchCats();
    } catch (err) {
      alert(err.response?.data?.error || 'Category already exists');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? This might affect organization registration.')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCats();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="dashboard-title">System Categories</h2>
        <p className="dashboard-subtitle">Manage organization types available for registration.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '2rem' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '1.5rem' }}>
            <Plus size={20} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add New Category</h3>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>CATEGORY NAME</label>
              <input
                className="form-control"
                placeholder="e.g. Hospital, School, Mall"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} type="submit">
              Register Category
            </button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
              <Tags size={20} />
              <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Categories</h3>
            </div>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCats.length > 0 ? (
                  filteredCats.map((cat) => (
                    <tr key={cat.categoryId}>
                      <td style={{ fontWeight: 600 }}>{cat.name}</td>
                      <td>
                        <span className={`badge badge-low`}>
                          {cat.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(cat.categoryId)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--high)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {loading ? 'Fetching categories...' : 'No categories found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
