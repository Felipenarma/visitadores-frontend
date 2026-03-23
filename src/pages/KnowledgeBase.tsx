import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Search, X } from 'lucide-react';
import { knowledgeApi, businessLinesApi } from '../api';

interface KBEntry {
  id: number;
  title: string;
  category: string;
  content: string;
  business_line_id: number | null;
  business_line_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface Category {
  value: string;
  label: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  productos: 'bg-blue-100 text-blue-800',
  protocolos: 'bg-green-100 text-green-800',
  faq: 'bg-purple-100 text-purple-800',
  general: 'bg-gray-100 text-gray-800',
};

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businessLines, setBusinessLines] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KBEntry | null>(null);
  const [form, setForm] = useState({ title: '', category: 'productos', content: '', business_line_id: '' as string, is_active: true });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [entriesData, catsData, blData] = await Promise.all([
        knowledgeApi.getAll(filterCategory || undefined),
        knowledgeApi.getCategories(),
        businessLinesApi.getAll(),
      ]);
      setEntries(entriesData);
      setCategories(catsData);
      setBusinessLines(blData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadData(); }, [filterCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        category: form.category,
        content: form.content,
        business_line_id: form.business_line_id ? parseInt(form.business_line_id) : null,
        is_active: form.is_active,
      };
      if (editing) {
        await knowledgeApi.update(editing.id, payload);
      } else {
        await knowledgeApi.create(payload);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', category: 'productos', content: '', business_line_id: '', is_active: true });
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: KBEntry) => {
    setEditing(entry);
    setForm({
      title: entry.title,
      category: entry.category,
      content: entry.content,
      business_line_id: entry.business_line_id ? String(entry.business_line_id) : '',
      is_active: entry.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta entrada?')) return;
    await knowledgeApi.delete(id);
    loadData();
  };

  const filtered = entries.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
          <p className="text-gray-500 text-sm mt-1">Información de apoyo para el agente IA</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ title: '', category: 'productos', content: '', business_line_id: '', is_active: true }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Agregar
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-9 w-full" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input w-48">
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {categories.map(cat => {
          const count = entries.filter(e => e.category === cat.value).length;
          return (
            <div key={cat.value} className="bg-white border border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setFilterCategory(filterCategory === cat.value ? '' : cat.value)}>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{cat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Entries list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay entradas en la base de conocimiento</p>
            <p className="text-gray-400 text-sm mt-1">Agrega información sobre productos, protocolos o preguntas frecuentes</p>
          </div>
        ) : filtered.map(entry => (
          <div key={entry.id} className={`bg-white border rounded-xl p-4 ${entry.is_active ? 'border-gray-200' : 'border-red-200 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.general}`}>
                    {entry.category}
                  </span>
                  {entry.business_line_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{entry.business_line_name}</span>
                  )}
                  {!entry.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Inactivo</span>}
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{entry.content}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(entry)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editing ? 'Editar entrada' : 'Nueva entrada'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input w-full" placeholder="Ej: Información sobre Producto X" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input w-full">
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Línea de negocio (opcional)</label>
                  <select value={form.business_line_id} onChange={e => setForm({ ...form, business_line_id: e.target.value })} className="input w-full">
                    <option value="">General</option>
                    {businessLines.map(bl => <option key={bl.id} value={bl.id}>{bl.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Contenido</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input w-full" rows={8} placeholder="Escribe aquí toda la información que quieres que el agente conozca..." required />
                <p className="text-xs text-gray-400 mt-1">El agente usará esta información para responder a los visitadores</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Activo (visible para el agente)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
