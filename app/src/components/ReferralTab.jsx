import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

const ReferralTab = ({ walletAddress, memeyaBalance }) => {
  const { t, i18n } = useTranslation();
  const [referralInfo, setReferralInfo] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [referrerInput, setReferrerInput] = useState('');
  const [setReferrerLoading, setSetReferrerLoading] = useState(false);
  const [setReferrerMsg, setSetReferrerMsg] = useState(null);

  const referralLink = `https://aimemeforge.io/?ref=${walletAddress}`;
  const isElite = (memeyaBalance || 0) >= 50000;
  const maskedWallet = (w) => w ? w.slice(0, 4) + '...' + w.slice(-4) : '\u2014';

  // Fetch referral info + referral list
  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/users/${walletAddress}/referral-info`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/users/${walletAddress}/referrals`).then(r => r.json())
    ]).then(([infoData, refData]) => {
      if (infoData.success) setReferralInfo(infoData.data);
      if (refData.success) setReferrals(refData.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareOnX = () => {
    const text = `${t('dashboard.referral.shareText')}\n${referralLink}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSetReferrer = async () => {
    if (!referrerInput.trim()) return;
    const wallet = referrerInput.trim();

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      setSetReferrerMsg({ type: 'error', text: t('dashboard.referral.errorInvalidWallet') });
      return;
    }
    if (wallet === walletAddress) {
      setSetReferrerMsg({ type: 'error', text: t('dashboard.referral.errorSelfReferral') });
      return;
    }

    setSetReferrerLoading(true);
    setSetReferrerMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${walletAddress}/set-referrer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerWallet: wallet })
      });
      const data = await res.json();
      if (data.success) {
        setSetReferrerMsg({ type: 'success', text: t('dashboard.referral.successSet') });
        setReferralInfo(prev => ({ ...prev, referredBy: wallet }));
        setReferrerInput('');
      } else {
        const errorKey = data.error?.includes('yourself') ? 'errorSelfReferral'
          : data.error?.includes('already') ? 'errorAlreadySet'
          : data.error?.includes('not found') ? 'errorNotFound'
          : 'errorGeneric';
        setSetReferrerMsg({ type: 'error', text: t(`dashboard.referral.${errorKey}`) });
      }
    } catch {
      setSetReferrerMsg({ type: 'error', text: t('dashboard.referral.errorGeneric') });
    } finally {
      setSetReferrerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Your Referral Link */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{'\uD83D\uDD17'}</span>
          <h3 className="text-xl font-bold">{t('dashboard.referral.yourLink')}</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">{t('dashboard.referral.yourLinkDesc')}</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 font-mono text-sm text-cyan-300 truncate">
            {referralLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                linkCopied
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
              }`}
            >
              {linkCopied ? t('dashboard.referral.linkCopied') : t('dashboard.referral.copyLink')}
            </button>
            <button
              onClick={shareOnX}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              {t('dashboard.referral.shareOnX')}
            </button>
          </div>
        </div>

        {/* Elite status notice */}
        <div className={`text-sm px-4 py-2.5 rounded-lg ${
          isElite
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
        }`}>
          {isElite ? t('dashboard.referral.eliteActive') : t('dashboard.referral.eliteRequired')}
        </div>
      </div>

      {/* Section 2: Set Your Referrer */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{'\uD83E\uDD1D'}</span>
          <h3 className="text-xl font-bold">{t('dashboard.referral.setReferrer')}</h3>
        </div>

        {referralInfo?.referredBy ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
            <div className="text-sm text-green-400 font-medium">{t('dashboard.referral.referrerLocked')}</div>
            <div className="text-sm text-gray-400 mt-1">
              {t('dashboard.referral.referrerLockedDesc')}: <span className="font-mono text-cyan-300">{maskedWallet(referralInfo.referredBy)}</span>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">{t('dashboard.referral.setReferrerDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={referrerInput}
                onChange={(e) => setReferrerInput(e.target.value)}
                placeholder={t('dashboard.referral.referrerWallet')}
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
              />
              <button
                onClick={handleSetReferrer}
                disabled={setReferrerLoading || !referrerInput.trim()}
                className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setReferrerLoading ? '...' : t('dashboard.referral.setReferrerBtn')}
              </button>
            </div>
            {setReferrerMsg && (
              <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
                setReferrerMsg.type === 'success'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {setReferrerMsg.text}
              </div>
            )}
          </>
        )}
      </div>

      {/* Section 3: Referral Stats */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{'\uD83D\uDCCA'}</span>
          <h3 className="text-xl font-bold">{t('dashboard.referral.stats')}</h3>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{referrals?.count || 0}</div>
            <div className="text-xs text-gray-400 mt-1">{t('dashboard.referral.totalReferred')}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">${(referrals?.totalL1Earnings || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-400 mt-1">{t('dashboard.referral.l1Earnings')}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">${(referrals?.totalL2Earnings || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-400 mt-1">{t('dashboard.referral.l2Earnings')}</div>
          </div>
        </div>

        {/* Referred users table */}
        {!referrals?.referrals?.length ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 opacity-50">{'\uD83D\uDC65'}</div>
            <p className="text-gray-400 text-sm">{t('dashboard.referral.noReferrals')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-white/10">
                  <th className="text-left py-2 px-3">{t('dashboard.referral.wallet')}</th>
                  <th className="text-left py-2 px-3">{t('dashboard.referral.joined')}</th>
                  <th className="text-center py-2 px-3">{t('dashboard.referral.usdcQualified')}</th>
                  <th className="text-right py-2 px-3">{t('dashboard.referral.yourEarnings')}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.referrals.map((ref, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 px-3 font-mono text-cyan-300">{ref.maskedWallet}</td>
                    <td className="py-2.5 px-3 text-gray-400">
                      {new Date(ref.joinedAt).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {ref.usdcQualified
                        ? <span className="text-green-400">{'\u2705'}</span>
                        : <span className="text-gray-500">{'\u274C'}</span>
                      }
                    </td>
                    <td className="py-2.5 px-3 text-right text-green-400 font-medium">
                      ${(ref.totalEarnings || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: How It Works */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{'\u2753'}</span>
          <h3 className="text-xl font-bold">{t('dashboard.referral.howItWorks')}</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 text-gray-300">
            <span className="text-cyan-400 font-bold mt-0.5">1.</span>
            <span>{t('dashboard.referral.howStep1')}</span>
          </div>
          <div className="flex items-start gap-3 text-gray-300">
            <span className="text-cyan-400 font-bold mt-0.5">2.</span>
            <span>{t('dashboard.referral.howStep2')}</span>
          </div>
          <div className="flex items-start gap-3 text-green-400">
            <span className="text-green-400 font-bold mt-0.5">3.</span>
            <span>{t('dashboard.referral.howStep3')}</span>
          </div>
          <div className="flex items-start gap-3 text-yellow-400">
            <span className="text-yellow-400 font-bold mt-0.5">4.</span>
            <span>{t('dashboard.referral.howStep4')}</span>
          </div>
          <div className="flex items-start gap-3 text-purple-400">
            <span className="text-purple-400 font-bold mt-0.5">5.</span>
            <span>{t('dashboard.referral.howStep5')}</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
          {t('dashboard.referral.howNote')}
        </div>
      </div>
    </div>
  );
};

export default ReferralTab;
