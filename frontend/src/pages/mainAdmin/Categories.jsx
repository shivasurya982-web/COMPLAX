import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, Plus } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');

  const fetchCats = async () => {
    const response = await api.get('/categories');
    setCategories(response.data);
  };

  useEffect(() => { fetchCats(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat) return;
    try {
      await api.post('/categories', { name: newCat });
      setNewCat('');
      fetchCats();
    } catch (err) { alert('Already exists'); }
  };

  const handleDelete = async (id) => {
    await api.delete(`/categories/${id}`);
    fetchCats();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Categories</h2>

      <div className="card" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              className="form-control"
              placeholder="New Category Name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
          </div>
          <button className="btn-primary" style={{ padding: '0 32px' }} type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.categoryId}>
                  <td>{cat.name}</td>
                  <td>{cat.status}</td>
                  <td>
                    <button onClick={() => handleDelete(cat.categoryId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Categories;
