import re

with open('src/pages/Users.jsx', 'r') as f:
    content = f.read()

# 1. Update state
content = content.replace(
    "const [formData, setFormData] = useState({ name: '', role: 'Normal User' });",
    "const [formData, setFormData] = useState({ name: '', role: 'Normal User', email: '', password: '' });"
)

# 2. Update openModal
content = content.replace(
    """  const openModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({ name: u.name, role: u.role });
    } else {
      setEditingUser(null);
      setFormData({ name: '', role: 'Normal User' });
    }
    setIsModalOpen(true);
  };""",
    """  const openModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({ name: u.name, role: u.role, email: '', password: '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', role: 'Normal User', email: '', password: '' });
    }
    setIsModalOpen(true);
  };"""
)

# 3. Update saveUser
content = content.replace(
    """  const saveUser = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase.from('profiles').update({ name: formData.name, role: formData.role }).eq('id', editingUser.id);
      if (error) throw error;
      toast('User updated');
      setIsModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast('Failed to update user', 'error');
    }
  };""",
    """  const saveUser = async () => {
    try {
      if (editingUser) {
        const { error } = await supabase.from('profiles').update({ name: formData.name, role: formData.role }).eq('id', editingUser.id);
        if (error) throw error;
        toast('User updated');
      } else {
        if (!formData.email || !formData.password || !formData.name) {
          toast('Name, email, and password are required', 'error');
          return;
        }
        if (formData.password.length < 6) {
          toast('Password must be at least 6 characters', 'error');
          return;
        }
        
        // Use Supabase Auth to create user
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name }
          }
        });
        
        if (error) throw error;
        
        if (data?.user) {
          // Upsert the profile with selected role
          const { error: profErr } = await supabase.from('profiles').upsert([
            { id: data.user.id, name: formData.name, role: formData.role }
          ]);
          if (profErr) throw profErr;
        }
        toast('User created! They may need to verify their email.');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast(e.message || 'Failed to save user', 'error');
    }
  };"""
)

# 4. Add "Add User" button
content = content.replace(
    """      <div className="page-header">
        <h2>User Management</h2>
      </div>""",
    """      <div className="page-header">
        <h2>User Management</h2>
        <button className="btn btn-red" onClick={() => openModal()}>+ Add User</button>
      </div>"""
)

# 5. Update Modal JSX
content = content.replace(
    """            <div className="form-group"><label>Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="form-group"><label>Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                {['Admin', 'Power User', 'Normal User'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>""",
    """            <div className="form-group"><label>Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" /></div>
            {!editingUser && (
              <>
                <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" /></div>
                <div className="form-group"><label>Password</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="At least 6 characters" /></div>
              </>
            )}
            <div className="form-group"><label>Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                {['Admin', 'Power User', 'Normal User'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>"""
)

content = content.replace("<h3>Edit User</h3>", "<h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>")

with open('src/pages/Users.jsx', 'w') as f:
    f.write(content)
