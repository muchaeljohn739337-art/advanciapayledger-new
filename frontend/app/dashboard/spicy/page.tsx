"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SpicyDashboard() {
  const [user, setUser] = useState<any>({ firstName: 'John', lastName: 'Smith', facility: { name: 'Metro Health' } });
  
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCrypto, setToCrypto] = useState('SOL');
  const [fiatAmount, setFiatAmount] = useState('1000');
  const [cryptoResult, setCryptoResult] = useState('');
  
  const [prices, setPrices] = useState({
    SOL: { usd: 147.50, eur: 135.70, name: 'Solana', symbol: '◎', color: 'from-purple-500 to-pink-500' },
    ETH: { usd: 3250.00, eur: 2990.00, name: 'Ethereum', symbol: 'Ξ', color: 'from-blue-500 to-purple-500' },
    BTC: { usd: 68500.00, eur: 63020.00, name: 'Bitcoin', symbol: '₿', color: 'from-yellow-500 to-orange-500' },
    USDC: { usd: 1.00, eur: 0.92, name: 'USD Coin', symbol: '$', color: 'from-green-500 to-emerald-500' },
  });
  
  const usdToEur = 0.92;

  useEffect(() => {
    calculateCrypto();
  }, [fiatAmount, fromCurrency, toCrypto]);

  const calculateCrypto = () => {
    const amount = parseFloat(fiatAmount) || 0;
    const price = fromCurrency === 'USD' 
      ? prices[toCrypto as keyof typeof prices].usd 
      : prices[toCrypto as keyof typeof prices].eur;
    
    const result = amount / price;
    setCryptoResult(result.toFixed(6));
  };

  const convertToUSD = (amount: number) => {
    return fromCurrency === 'EUR' ? amount / usdToEur : amount;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 via-blue-900 to-purple-900 border-r border-white/10 shadow-2xl z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Advancia Pay</h1>
              <p className="text-xs text-white/60">Healthcare Platform</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem href="/dashboard" icon="📊" label="Dashboard" active />
          <NavItem href="/converter" icon="💱" label="Currency Exchange" badge="HOT" />
          <NavItem href="/transactions" icon="💳" label="Transactions" badge="12" />
          <NavItem href="/wallet" icon="👛" label="Crypto Wallet" />
          <NavItem href="/invoices" icon="📄" label="Invoices" />
          <NavItem href="/reports" icon="📈" label="Analytics" />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white text-center">
            <p className="text-sm mb-2">💎 Upgrade to Pro</p>
            <button className="w-full bg-white text-purple-600 py-2 rounded-lg font-bold text-sm hover:shadow-lg transition">
              Unlock Features
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-72 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome back, {user.firstName}! 👋
                </h1>
                <p className="text-gray-600 mt-1">Your financial command center</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Balance</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    $247,523
                  </div>
                </div>
                <button className="relative p-3 hover:bg-gray-100 rounded-xl transition group">
                  <span className="text-2xl">🔔</span>
                  <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)'}}>
                </div>
              </div>

              <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
                      <span className="text-4xl animate-bounce">💱</span>
                      <span>Currency Exchange Center</span>
                    </h2>
                    <p className="text-white/80 text-lg">Convert USD/EUR to Crypto instantly • Live market rates</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center space-x-2 bg-green-500 px-4 py-2 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      <span className="text-white font-semibold text-sm">LIVE</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  
                  <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6">
                    <label className="text-white/90 text-sm font-semibold mb-3 block uppercase tracking-wide">
                      From (Fiat Currency)
                    </label>
                    
                    <div className="flex space-x-3 mb-6">
                      <button
                        onClick={() => setFromCurrency('USD')}
                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                          fromCurrency === 'USD'
                            ? 'bg-white text-purple-600 shadow-2xl shadow-white/50'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <div className="text-2xl mb-1">🇺🇸</div>
                        <div>USD</div>
                        <div className="text-xs opacity-70">US Dollar</div>
                      </button>
                      
                      <button
                        onClick={() => setFromCurrency('EUR')}
                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                          fromCurrency === 'EUR'
                            ? 'bg-white text-purple-600 shadow-2xl shadow-white/50'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <div className="text-2xl mb-1">🇪🇺</div>
                        <div>EUR</div>
                        <div className="text-xs opacity-70">Euro</div>
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 text-2xl font-bold">
                        {fromCurrency === 'USD' ? '$' : '€'}
                      </div>
                      <input
                        type="number"
                        value={fiatAmount}
                        onChange={(e) => setFiatAmount(e.target.value)}
                        className="w-full bg-white/30 border-3 border-white/50 text-white text-4xl font-bold rounded-2xl pl-14 pr-6 py-6 focus:outline-none focus:border-white focus:bg-white/40 placeholder-white/30 transition-all"
                        placeholder="1000"
                      />
                    </div>

                    <div className="mt-4 text-white/70 text-sm text-center">
                      1 {fromCurrency} = ${fromCurrency === 'USD' ? '1.00' : (1/usdToEur).toFixed(4)} USD
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6">
                    <label className="text-white/90 text-sm font-semibold mb-3 block uppercase tracking-wide">
                      To (Cryptocurrency)
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {Object.entries(prices).map(([symbol, data]) => (
                        <button
                          key={symbol}
                          onClick={() => setToCrypto(symbol)}
                          className={`py-3 px-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                            toCrypto === symbol
                              ? 'bg-white text-purple-600 shadow-2xl shadow-white/50'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <div className="text-xl mb-1">{data.symbol}</div>
                          <div className="text-sm">{symbol}</div>
                        </button>
                      ))}
                    </div>

                    <div className="bg-gradient-to-br from-white/30 to-white/10 border-3 border-white/50 rounded-2xl p-6 mb-4">
                      <div className="text-white/70 text-sm mb-2">You will receive:</div>
                      <div className="text-white text-5xl font-bold mb-2 break-all">
                        {cryptoResult || '0.000000'}
                      </div>
                      <div className="text-white/80 text-lg font-semibold">
                        {toCrypto}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/20 rounded-xl p-3">
                      <span className="text-white/70 text-sm">Live Rate:</span>
                      <span className="text-white font-bold">
                        1 {toCrypto} = {fromCurrency === 'USD' ? '$' : '€'}
                        {fromCurrency === 'USD' 
                          ? prices[toCrypto as keyof typeof prices].usd.toLocaleString()
                          : prices[toCrypto as keyof typeof prices].eur.toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <button className="bg-white text-purple-600 py-4 px-6 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/50 transform hover:scale-105 transition-all flex items-center justify-center space-x-2">
                    <span>💸</span>
                    <span>Exchange Now</span>
                  </button>
                  <button className="bg-white/20 border-2 border-white text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-white/30 transition-all flex items-center justify-center space-x-2">
                    <span>📊</span>
                    <span>View Rates</span>
                  </button>
                  <button className="bg-white/20 border-2 border-white text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-white/30 transition-all flex items-center justify-center space-x-2">
                    <span>📜</span>
                    <span>History</span>
                  </button>
                </div>

                <div className="mt-6 bg-yellow-400/20 border-2 border-yellow-400/40 rounded-xl p-4 flex items-start space-x-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-white font-semibold mb-1">Instant Settlement</p>
                    <p className="text-white/80 text-sm">
                      Crypto transactions settle in seconds. Fiat payments in 1-2 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <StatCard
              title="Portfolio Value"
              value="$247,523"
              change="+12.5%"
              icon="💰"
              gradient="from-blue-500 via-purple-500 to-pink-500"
            />
            <StatCard
              title="Crypto Balance"
              value="$38,173"
              change="+8.3%"
              icon="₿"
              gradient="from-purple-500 via-pink-500 to-red-500"
            />
            <StatCard
              title="Monthly Revenue"
              value="$45,820"
              change="+23%"
              icon="📈"
              gradient="from-green-500 via-emerald-500 to-teal-500"
            />
            <StatCard
              title="Active Wallets"
              value="3"
              change="Connected"
              icon="👛"
              gradient="from-cyan-500 via-blue-500 to-indigo-500"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center space-x-2">
                <span>📊</span>
                <span>Live Crypto Market</span>
                <span className="ml-auto text-sm bg-green-500 px-3 py-1 rounded-full">Real-Time</span>
              </h3>
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-200">
              {Object.entries(prices).map(([symbol, data]) => (
                <div key={symbol} className="p-6 hover:bg-gray-50 transition cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`text-3xl w-12 h-12 bg-gradient-to-br ${data.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition`}>
                      {data.symbol}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">{data.name}</div>
                      <div className="font-bold text-gray-900">{symbol}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">USD:</span>
                      <span className="font-bold text-gray-900">${data.usd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">EUR:</span>
                      <span className="font-bold text-gray-900">€{data.eur.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <QuickAction icon="💸" label="Send Payment" color="from-blue-500 to-cyan-500" />
            <QuickAction icon="📥" label="Receive Money" color="from-purple-500 to-pink-500" />
            <QuickAction icon="📄" label="Create Invoice" color="from-green-500 to-emerald-500" />
            <QuickAction icon="📊" label="View Reports" color="from-orange-500 to-red-500" />
          </div>

        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, badge, active = false }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
        active
          ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      {badge && (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          badge === 'HOT' ? 'bg-red-500 text-white animate-pulse' :
          active ? 'bg-white/20' : 'bg-blue-500/20 text-blue-300'
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function StatCard({ title, value, change, icon, gradient }: any) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 rounded-2xl blur-xl group-hover:opacity-40 transition`}></div>
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl hover:scale-105 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl">{icon}</span>
          <span className="text-sm font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
            {change}
          </span>
        </div>
        <div className="text-sm text-gray-600 mb-1">{title}</div>
        <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color }: any) {
  return (
    <button className={`relative group overflow-hidden bg-gradient-to-br ${color} rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all`}>
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition"></div>
      <div className="relative z-10">
        <div className="text-5xl mb-3 group-hover:scale-110 transition">{icon}</div>
        <div className="text-white font-bold text-lg">{label}</div>
      </div>
    </button>
  );
}
