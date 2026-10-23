import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, CATEGORIES } from '../services/api';

function today() {
  return new Date().toISOString().slice(0, 10);
}

// One page used for both "add" (/expenses/new) and "edit" (/expenses/:id/edit)
export default function ExpenseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: today(), note: '' });
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      try {
        const e = await api.getExpense(id);
        setForm({
          title: e.title,
          amount: String(e.amount),
          category: e.category,
          date: e.date.slice(0, 10),
          note: e.note || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Title is required');
    if (!form.amount || Number(form.amount) <= 0) return setError('Amount must be greater than 0');

    setSubmitting(true);
    try {
      const body = { ...form, amount: Number(form.amount) };
      if (isEdit) await api.updateExpense(id, body);
      else await api.createExpense(body);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return <p className="state-message">Loading...</p>;

  return (
    <main className="container narrow">
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h1>{isEdit ? 'Edit expense' : 'Add expense'}</h1>

        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={100} />

        <label htmlFor="amount">Amount (₹)</label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={handleChange}
        />

        <label htmlFor="category">Category</label>
        <select id="category" name="category" value={form.category} onChange={handleChange}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />

        <label htmlFor="note">Note (optional)</label>
        <textarea id="note" name="note" rows="3" maxLength={300} value={form.note} onChange={handleChange} />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="row">
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </button>
          <Link to="/" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
