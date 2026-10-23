import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, CATEGORIES } from '../services/api';

const PAGE_SIZE = 8;

function formatMoney(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);

  const [expenses, setExpenses] = useState({ items: [], total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, byCategory: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, sum] = await Promise.all([
        api.listExpenses({ page, limit: PAGE_SIZE, category, month }),
        api.summary({ category, month }),
      ]);
      setExpenses(list);
      setSummary(sum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, category, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      // go back a page if we just deleted the last item on this page
      if (expenses.items.length === 1 && page > 1) setPage(page - 1);
      else loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  const maxCategoryTotal = Math.max(...summary.byCategory.map((c) => c.total), 1);

  return (
    <main className="container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/expenses/new" className="btn">
          + Add expense
        </Link>
      </div>

      <section className="filters card">
        <div>
          <label htmlFor="filter-category">Category</label>
          <select id="filter-category" value={category} onChange={changeFilter(setCategory)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-month">Month</label>
          <input id="filter-month" type="month" value={month} onChange={changeFilter(setMonth)} />
        </div>
      </section>

      {error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={loadData}>
            Try again
          </button>
        </div>
      )}

      {loading && <p className="state-message">Loading expenses...</p>}

      {!loading && !error && (
        <>
          <section className="summary">
            <div className="card total-card">
              <p className="muted">Total spent</p>
              <p className="total">{formatMoney(summary.total)}</p>
            </div>
            <div className="card category-card">
              <p className="muted">By category</p>
              {summary.byCategory.length === 0 ? (
                <p className="muted">No data yet</p>
              ) : (
                summary.byCategory.map((c) => (
                  <div key={c.category} className="bar-row">
                    <span className="bar-label">{c.category}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(c.total / maxCategoryTotal) * 100}%` }} />
                    </div>
                    <span className="bar-value">{formatMoney(c.total)}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {expenses.items.length === 0 ? (
            <div className="card empty">
              <p>No expenses found.</p>
              <Link to="/expenses/new" className="btn">
                Add your first expense
              </Link>
            </div>
          ) : (
            <>
              <div className="card table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th className="num">Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.items.map((e) => (
                      <tr key={e._id}>
                        <td>{formatDate(e.date)}</td>
                        <td>
                          {e.title}
                          {e.note && <div className="muted small">{e.note}</div>}
                        </td>
                        <td>
                          <span className="tag">{e.category}</span>
                        </td>
                        <td className="num">{formatMoney(e.amount)}</td>
                        <td className="actions">
                          <Link to={`/expenses/${e._id}/edit`}>Edit</Link>
                          <button className="link-btn danger" onClick={() => handleDelete(e._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
                <span>
                  Page {expenses.page || page} of {expenses.totalPages || 1}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={page >= (expenses.totalPages || 1)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
