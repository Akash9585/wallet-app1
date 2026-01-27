import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, X, LogOut, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

function App() {
  const [view, setView] = useState('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [currentOtp, setCurrentOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phoneForOtp, setPhoneForOtp] = useState('');
  const [userId, setUserId] = useState('');
  
  // data from user input
  const [userData, setUserData] = useState({
    salary: 50000,
    car: 0,
    childCare: 0,
    household: 0,
    leisure: 0,
    otherExpenses: 0
  });
  
  const [balance, setBalance] = useState(24000);
  
  // pie chart data
  const [transactions, setTransactions] = useState([
    { name: 'Main expenses', value: 19 },
    { name: 'Car', value: 55 },
    { name: 'Child care', value: 15 },
    { name: 'Household products', value: 20 },
    { name: 'Leisure', value: 45 },
    { name: 'Other expenses', value: 100 }
  ]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isIncome, setIsIncome] = useState(true);
  const [formData, setFormData] = useState({ 
    amount: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    category: '', 
    notes: '' 
  });
  const [showLogout, setShowLogout] = useState(false);
  const [loading, setLoading] = useState(false);

  //  Express Real Time OTP
  const sendOTP = async () => {
    if (phone.length !== 10) {
      alert(' 10 digit number Enter Plese');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/send-otp', {
        phone: '+91' + phone
      });
      
      setCurrentOtp(response.data.otp);
      setPhoneForOtp(phone);
      setOtpSent(true);
      setOtp('');
      setCountdown(60);
    } catch (error) {
      alert(' run in server (node server.js)');
    } finally {
      setLoading(false);
    }
  };

  // Countdown
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            setOtpSent(false);
            setCurrentOtp('');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  //  Verify OTP
  const verifyOTP = async () => {
    if (otp.length !== 4) {
      alert('Enter your 4 dight OTP number');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/verify-otp', {
        phone: '+91' + phoneForOtp,
        otp
      });
      
      if (response.data.success) {
        setUserId(response.data.userId);
        setView('data-input'); //  Go to data input screen
        alert(' Login successful! Enter your expenses');
      }
    } catch (error) {
      alert(` ${error.response?.data?.error || 'Invalid OTP'}`);
    } finally {
      setLoading(false);
    }
  };

  //   Save user data & generate pie chart
  const saveUserData = () => {
    const totalExpenses = Object.values(userData).reduce((sum, val) => 
      sum + parseFloat(val || 0), 0
    ) - parseFloat(userData.salary || 0);
    
    setBalance(parseFloat(userData.salary || 50000) - totalExpenses);
    
    // pie chart data
    const newTransactions = [
      { name: 'Main expenses', value: parseFloat(userData.household || 0) },
      { name: 'Car', value: parseFloat(userData.car || 0) },
      { name: 'Child care', value: parseFloat(userData.childCare || 0) },
      { name: 'Household products', value: parseFloat(userData.household || 0) },
      { name: 'Leisure', value: parseFloat(userData.leisure || 0) },
      { name: 'Other expenses', value: parseFloat(userData.otherExpenses || 0) }
    ];
    
    setTransactions(newTransactions);
    setView('dashboard');
    alert(' Data saved! Welcome to dashboard');
  };

  const addTransaction = async () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      alert('Enter Valid amount ');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/transactions', {
        userId,
        type: isIncome ? 'income' : 'expense',
        amount,
        date: formData.date,
        category: formData.category,
        notes: formData.notes
      });

      setBalance(isIncome ? balance + amount : balance - amount);
      setModalOpen(false);
      setFormData({ amount: '', date: format(new Date(), 'yyyy-MM-dd'), category: '', notes: '' });
      alert(' Transaction added!');
    } catch (error) {
      alert(' Transaction failed');
    }
  };

  //   1. LOGIN SCREEN
  if (view === 'login') return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">💰 Wallet</h1>
          <p className="text-gray-700 font-medium text-lg">
            {otpSent ? `Verify +91${phone}` : 'Enter mobile number'}
          </p>
        </div>
        
        <div className="space-y-6">
          {!otpSent ? (
            <>
              <div className="relative">
                <input 
                  type="tel" 
                  placeholder="**********" 
                  className="w-full p-5 pl-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-400 focus:border-emerald-500 text-center text-xl font-bold"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))}
                  maxLength={10}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">+91</span>
              </div>
              <button 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50"
                onClick={sendOTP}
                disabled={phone.length !== 10 || loading}
              >
                {loading ? '⏳ Sending...' : ' Send Real OTP'}
              </button>
            </>
          ) : (
            <>
              <div className="p-6 bg-gradient-to-r from-emerald-400 to-teal-500 border-4 border-white rounded-3xl text-center shadow-2xl mb-6">
                <div className="text-white font-bold text-lg mb-3"> YOUR OTP</div>
                <div className="text-4xl font-black text-white drop-shadow-2xl tracking-widest mb-2">
                  {currentOtp || '----'}
                </div>
                <div className="text-white/90 text-sm">Expires: {countdown}s</div>
              </div>
              
              <input 
                type="text" 
                placeholder="Enter OTP above" 
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-400 focus:border-emerald-500 text-center text-2xl font-black tracking-[0.4em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
                maxLength={4}
                autoFocus
              />
              <button 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50"
                onClick={verifyOTP}
                disabled={otp.length !== 4 || loading}
              >
                {loading ? ' Verifying...' : ' Verify & Continue'}
              </button>
              <button 
                className="w-full text-gray-600 hover:text-gray-800 font-bold py-3 text-sm border-t border-gray-200"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setPhone('');
                  setCurrentOtp('');
                  setCountdown(0);
                }}
              >
                ← Change Number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // 🔥 2. DATA INPUT SCREEN
  if (view === 'data-input') return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">📊 Enter Expenses</h1>
          <p className="text-gray-600">Your monthly spending</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">💼 First Month Salary</label>
            <input 
              type="number" 
              placeholder="50000" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg"
              value={userData.salary}
              onChange={(e) => setUserData({...userData, salary: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">🚗 Car</label>
            <input 
              type="number" 
              placeholder="5500" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg"
              value={userData.car}
              onChange={(e) => setUserData({...userData, car: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">👶 Child Care</label>
            <input 
              type="number" 
              placeholder="1500" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg"
              value={userData.childCare}
              onChange={(e) => setUserData({...userData, childCare: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">🏠 Household Products</label>
            <input 
              type="number" 
              placeholder="2000" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg"
              value={userData.household}
              onChange={(e) => setUserData({...userData, household: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">🎉 Leisure</label>
            <input 
              type="number" 
              placeholder="4500" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg"
              value={userData.leisure}
              onChange={(e) => setUserData({...userData, leisure: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">📊 Other Expenses</label>
            <input 
              type="number" 
              placeholder="10000" 
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg"
              value={userData.otherExpenses}
              onChange={(e) => setUserData({...userData, otherExpenses: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t space-y-2">
            <button 
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl"
              onClick={saveUserData}
            >
               Save & View Dashboard
            </button>
            <button 
              className="w-full bg-gray-100 text-gray-700 p-4 rounded-xl font-semibold"
              onClick={() => setView('login')}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  //   3. DASHBOARD
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">💰 Wallet</h1>
        <div className="flex items-center gap-4 p-3 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg">
          <span className="text-sm font-medium">Stats</span>
          <button className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md" onClick={() => setModalOpen(true)}>
            <Plus size={20} />
          </button>
          <button className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all" onClick={() => setShowLogout(true)}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h2 className="font-bold text-3xl mb-4 text-emerald-600">₹{balance.toLocaleString()}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>USD</span><span>₹84.53</span></div>
              <div className="flex justify-between"><span>EUR</span><span>₹90.48</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-2xl">Statistics</h2>
            <select className="px-4 py-2 bg-gray-100 rounded-xl">
              <option>January</option>
            </select>
            <select className="px-4 py-2 bg-gray-100 rounded-xl">
              <option>2026</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={transactions} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {transactions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {transactions.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm">{t.name}</span>
                    <span className="ml-auto font-bold">₹{t.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t">
                <div className="flex justify-between text-lg font-bold text-green-600">
                  <span>Salary:</span>
                  <span>₹{parseFloat(userData.salary || 50000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ADD TRANSACTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Add Transaction</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-2 mb-6">
              <button className={`px-6 py-3 rounded-full font-semibold w-full ${isIncome ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700'}`} onClick={() => setIsIncome(true)}>
                 Income
              </button>
              <button className={`px-6 py-3 rounded-full font-semibold w-full ${!isIncome ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700'}`} onClick={() => setIsIncome(false)}>
                  Expense
              </button>
            </div>
            
            <div className="space-y-4">
              <input type="number" placeholder="0.00" className="w-full p-4 text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-gray-200 focus:border-emerald-500" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-gray-500" />
                <input type="date" className="flex-1 p-3 bg-gray-50 rounded-xl" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              
              <select className="w-full p-4 bg-gray-50 rounded-xl" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="">Category</option>
                <option>Main expenses</option>
                <option>Car</option>
                <option>Child care</option>
              </select>
              
              <textarea placeholder="Notes" className="w-full p-4 bg-gray-50 rounded-xl h-20 resize-none" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              
              <div className="flex gap-4">
                <button className="flex-1 bg-gray-100 p-4 rounded-xl font-semibold hover:bg-gray-200" onClick={() => setModalOpen(false)}>CANCEL</button>
                <button className="flex-1 bg-emerald-500 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl" onClick={addTransaction}>ADD</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-8">Byes! See you next time.</p>
            <div className="flex gap-4">
              <button className="flex-1 bg-gray-100 p-3 rounded-xl font-semibold hover:bg-gray-200" onClick={() => setShowLogout(false)}>GO BACK</button>
              <button className="flex-1 bg-red-500 text-white p-3 rounded-xl font-semibold hover:bg-red-600" onClick={() => {
                setView('login');
                setPhone('');
                setOtp('');
                setOtpSent(false);
                setUserId('');
                setCurrentOtp('');
                setCountdown(0);
              }}>LOGOUT</button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

export default App;