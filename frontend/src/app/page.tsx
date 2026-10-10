'use client';

import { useState, useEffect } from 'react';
import { HardHat, Info, Plus, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('../components/MapComponent'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-gray-100">Loading Map...</div> }
);

interface Project {
  id: number;
  title: string;
  department: string;
  contractor: string;
  status: string;
  startDate: string;
  endDate: string;
  lat: number;
  lng: number;
  description: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Auth State
  const [user, setUser] = useState<{ id: number, role: string, name: string, token: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ email: '', password: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingPermits, setPendingPermits] = useState<Project[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: '', department: 'Telecom', contractor: '', startDate: '', endDate: '', lat: 12.9716, lng: 77.5946, description: ''
  });

  const fetchPendingPermits = () => {
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/pending`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingPermits(data);
        } else {
          setPendingPermits([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch pending", err);
        setPendingPermits([]);
      });
  };

  useEffect(() => {
    if (user) {
        fetchPendingPermits();
        // Poll every 5 seconds for demo purposes
        const interval = setInterval(fetchPendingPermits, 5000);
        return () => clearInterval(interval);
    } else {
        setPendingPermits([]);
    }
  }, [user]);

  const approvePermit = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) {
        alert("Approved! It is now on the public map.");
        fetchPendingPermits();
        fetchProjects();
      }
    } catch(err) {
      alert("Error approving");
    }
  };

  const fetchProjects = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`)
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error("Failed to fetch projects", err));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCreds)
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...data.user, token: data.token });
        setShowLoginModal(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleApplyPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    // Hit the "Dig Once" Algorithm API
    const conflictRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/check-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject)
    });
    const conflictData = await conflictRes.json();
    
    if (conflictData.conflict) {
      setConflictWarning(conflictData.message);
      return;
    } 

    // If no conflict, ACTUALLY submit it to the backend using Auth token
    if (!user) {
      alert("Please login first to submit permits!");
      setShowModal(false);
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(newProject)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Permit Submitted to Government for Approval! No physical conflicts detected.");
        setShowModal(false);
        fetchPendingPermits(); // Instantly update the counter
      } else {
        alert(data.message || "Failed to submit");
      }
    } catch(err) {
      alert("Network Error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col h-screen overflow-hidden">
      <header className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardHat /> CivicSync
          </h1>
          <p className="text-sm opacity-80">Public Works Transparency Portal</p>
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="mr-4 flex items-center gap-4">
              <span className="text-sm font-semibold">Welcome, {user.name} ({user.role})</span>
              {user.role === 'contractor' && (
                <>
                  <button onClick={() => setShowReviewModal(true)} className="bg-blue-800 text-blue-100 px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 border border-blue-700">
                    My Pending ({pendingPermits?.length || 0})
                  </button>
                  <button onClick={() => setShowModal(true)} className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100">
                    <Plus size={18} /> Apply for Permit
                  </button>
                </>
              )}
              {user.role === 'gov' && (
                <button onClick={() => setShowReviewModal(true)} className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-300 relative">
                  Review Permits
                  {pendingPermits && pendingPermits.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce">
                      {pendingPermits.length}
                    </span>
                  )}
                </button>
              )}
              <button onClick={() => setUser(null)} className="text-sm underline hover:text-gray-300">Logout</button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="bg-blue-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 mr-4 border border-blue-400">
              Contractor / Gov Login
            </button>
          )}
          
          <div className="bg-blue-800 p-2 rounded-lg text-center">
            <p className="text-xs font-semibold uppercase text-blue-300">Active Works</p>
            <p className="text-xl font-bold">{projects.length}</p>
          </div>
          <div className="bg-green-800 p-2 rounded-lg text-center">
            <p className="text-xs font-semibold uppercase text-green-300">Taxpayer Saved (Dig Once)</p>
            <p className="text-xl font-bold">₹2.4 Cr</p>
          </div>
        </div>
      </header>

      <div className="flex-1 relative flex">
        <div className="flex-1 relative z-0">
          <MapComponent projects={projects} selectedProject={selectedProject} setSelectedProject={setSelectedProject} />
        </div>

        <div className="absolute top-4 left-4 w-[340px] bg-white text-gray-900 rounded-xl shadow-2xl p-5 flex flex-col gap-4 max-h-[90%] overflow-y-auto z-[1000] border border-gray-100">
          <div>
            <h2 className="font-extrabold text-xl text-gray-900 border-b border-gray-200 pb-2">Ongoing Projects</h2>
            <p className="text-xs font-medium text-gray-500 mt-1.5">Live updates from municipal contractors</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {projects.map(p => (
              <div 
                key={p.id} 
                className={`border rounded-xl p-3 hover:shadow-md cursor-pointer transition-all duration-200 flex gap-3 items-center ${selectedProject?.id === p.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                onClick={() => setSelectedProject(p)}
              >
                <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                  <img src={`https://picsum.photos/seed/${p.id}/100/100`} alt="Project thumbnail" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-sm text-gray-900 truncate" title={p.title}>{p.title}</h3>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 flex-shrink-0">{p.department}</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-500 mb-2">{p.startDate} to {p.endDate}</p>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${p.status === 'completed' ? 'bg-green-500' : p.status === 'planned' ? 'bg-gray-400' : 'bg-blue-600'}`} style={{ width: p.status === 'completed' ? '100%' : p.status === 'planned' ? '0%' : '40%' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex gap-2 items-start text-blue-800">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-2">
                <p>
                  <strong>WhatsApp Alerts:</strong> Send 'ALERTS' to our WhatsApp bot to get notified when new projects are scheduled near your commute!
                </p>
                <button className="bg-green-600 text-white px-3 py-1.5 rounded-md w-full font-semibold hover:bg-green-700 transition">
                  Connect WhatsApp Bot
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-gray-100">
            <h2 className="text-2xl font-extrabold mb-2 text-gray-900">Official Portal Login</h2>
            <p className="text-xs font-medium text-gray-500 mb-6">Contractor Demo Login: contractor@abc.com / password123</p>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input type="email" placeholder="Email Address" className="border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" required onChange={e => setLoginCreds({...loginCreds, email: e.target.value})} />
              <input type="password" placeholder="Password" className="border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" required onChange={e => setLoginCreds({...loginCreds, password: e.target.value})} />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contractor Permit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">Apply for Excavation Permit</h2>
            <form onSubmit={handleApplyPermit} className="flex flex-col gap-4">
              <input type="text" placeholder="Project Title" className="border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" required onChange={e => setNewProject({...newProject, title: e.target.value})} />
              
              <div className="flex gap-3">
                <select className="border border-gray-300 bg-gray-50 text-gray-900 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2" onChange={e => setNewProject({...newProject, department: e.target.value})}>
                  <option value="Telecom">Telecom</option>
                  <option value="Water Board">Water Board</option>
                  <option value="PWD">PWD</option>
                </select>
                <input type="text" placeholder="Contractor ID" className="border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-1/2" required onChange={e => setNewProject({...newProject, contractor: e.target.value})} />
              </div>

              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Start Date</label>
                  <input type="date" className="border border-gray-300 bg-gray-50 text-gray-900 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" required onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
                </div>
                <div className="w-1/2">
                  <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">End Date</label>
                  <input type="date" className="border border-gray-300 bg-gray-50 text-gray-900 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" required onChange={e => setNewProject({...newProject, endDate: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-1/2">
                    <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Latitude</label>
                    <input type="number" step="0.0001" placeholder="e.g. 12.9716" className="border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" value={newProject.lat} onChange={e => setNewProject({...newProject, lat: parseFloat(e.target.value)})} />
                </div>
                <div className="w-1/2">
                    <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">Longitude</label>
                    <input type="number" step="0.0001" placeholder="e.g. 77.5946" className="border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" value={newProject.lng} onChange={e => setNewProject({...newProject, lng: parseFloat(e.target.value)})} />
                </div>
              </div>

              {conflictWarning && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg shadow-sm mt-2">
                  <div className="flex items-start">
                    <AlertTriangle className="text-red-500 mr-2 flex-shrink-0" size={20} />
                    <div className="text-sm">
                        <strong className="block text-red-900 mb-1">🚨 DIG ONCE ALERT</strong> 
                        {conflictWarning}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">Submit Permit</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Gov Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-gray-100 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900">Review Pending Permits</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-500 hover:text-gray-900 font-bold">X</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
              {!pendingPermits || pendingPermits.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No pending permits to review!</p>
              ) : (
                pendingPermits.map(permit => (
                  <div key={permit.id} className="border border-yellow-200 bg-yellow-50 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{permit.title}</h3>
                      <p className="text-sm text-gray-600">Contractor: {permit.contractor} | Dept: {permit.department}</p>
                      <p className="text-xs text-gray-500 mt-1">Dates: {permit.startDate} to {permit.endDate}</p>
                    </div>
                    {user?.role === 'gov' ? (
                      <button 
                        onClick={() => approvePermit(permit.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="text-sm font-bold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">Pending Gov Approval</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
