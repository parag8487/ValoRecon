import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Clock,
  Tag,
  Coins,
  Eye,
  X,
  Check,
  Zap,
  Flame
} from 'lucide-react';
import { getStore, getWallet, getSkinMedia, StoreData, WalletData } from '../api/client';
import { SafeImage } from '../components/SafeImage';

export const StoreScreen: React.FC = () => {
  const [store, setStore] = useState<StoreData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [nightMarketReveals, setNightMarketReveals] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [inspectOffer, setInspectOffer] = useState<StoreData['dailyOffers'][number] | null>(null);
  const [inspectVideo, setInspectVideo] = useState<string | null>(null);
  const [inspectImage, setInspectImage] = useState<string | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeInspect();
    };
    if (inspectOffer) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [inspectOffer]);

  useEffect(() => {
    Promise.all([getStore(), getWallet()])
      .then(([storeData, walletData]) => {
        setStore(storeData);
        setWallet(walletData);
        if (storeData.nightMarket?.offers) {
          const initialReveals: Record<string, boolean> = {};
          storeData.nightMarket.offers.forEach((o) => {
            initialReveals[o.id] = o.isRevealed;
          });
          setNightMarketReveals(initialReveals);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const revealCard = (id: string) => {
    setNightMarketReveals((prev) => ({ ...prev, [id]: true }));
  };

  const inspectSkin = async (offer: StoreData['dailyOffers'][number]) => {
    setInspectOffer(offer);
    setInspectVideo(null);
    setInspectImage(offer.icon || null);
    setInspectLoading(true);
    try {
      // 1. Try server endpoint via authenticated client
      const data = await getSkinMedia({ id: offer.id, name: offer.name }).catch(() => null);
      if (data?.videoUrl || data?.imageUrl) {
        if (data.videoUrl) setInspectVideo(data.videoUrl);
        if (data.imageUrl) setInspectImage(data.imageUrl);
        setInspectLoading(false);
        return;
      }

      // 2. Direct fallback to valorant-api.com
      const response = await fetch('https://valorant-api.com/v1/weapons/skins');
      if (response.ok) {
        const payload = await response.json();
        const skins = Array.isArray(payload?.data) ? payload.data : [];
        const offerId = (offer.id || '').toLowerCase();
        const offerName = (offer.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const skin = skins.find((candidate: any) => {
          const candId = (candidate.uuid || '').toLowerCase();
          const candName = (candidate.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return (
            candId === offerId ||
            candName === offerName ||
            candName.includes(offerName) ||
            offerName.includes(candName) ||
            candidate.levels?.some((lvl: any) => (lvl.uuid || '').toLowerCase() === offerId || (lvl.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '') === offerName) ||
            candidate.chromas?.some((c: any) => (c.uuid || '').toLowerCase() === offerId || (c.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '') === offerName)
          );
        });
        if (skin) {
          const levels = Array.isArray(skin.levels) ? skin.levels : [];
          const chromas = Array.isArray(skin.chromas) ? skin.chromas : [];
          const preview = levels.slice().reverse().find((level: any) => level.streamedVideo)?.streamedVideo ||
                          chromas.find((c: any) => c.streamedVideo)?.streamedVideo;
          const fullImage = chromas.find((c: any) => c.fullRender)?.fullRender ||
                            chromas.find((c: any) => c.displayIcon)?.displayIcon ||
                            skin.displayIcon ||
                            levels.find((l: any) => l.displayIcon)?.displayIcon;
          setInspectVideo(preview || null);
          if (fullImage) setInspectImage(fullImage);
        }
      }
    } catch {
      // Retain static icon fallback
    } finally {
      setInspectLoading(false);
    }
  };

  const closeInspect = () => {
    setInspectOffer(null);
    setInspectVideo(null);
    setInspectImage(null);
    setInspectLoading(false);
  };

  if (loading || !store) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Featured Bundle Showcase */}
      <div className="home-player-banner" style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'var(--surface)',
        backgroundImage: `url(${store.featuredBundle.displayIcon})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'none'
      }}>
        <div style={{ maxWidth: '540px', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="tactical-badge" style={{
              backgroundColor: 'rgba(248, 183, 62, 0.2)',
              color: 'var(--accent-gold)',
              border: '1px solid rgba(248, 183, 62, 0.4)'
            }}>
              FEATURED EXCLUSIVE BUNDLE
            </span>
            <span className="tactical-badge" style={{
              backgroundColor: store.source === 'live' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(248, 183, 62, 0.15)',
              color: store.source === 'live' ? 'var(--accent-green)' : 'var(--accent-gold)',
              border: `1px solid ${store.source === 'live' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(248, 183, 62, 0.3)'}`
            }}>
              {store.source === 'live' ? 'LIVE STORE' : 'DEMO STORE'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <Clock size={12} /> 6D 14H REMAINING
            </div>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            color: '#fff',
            lineHeight: 1,
            letterSpacing: '0.04em',
            marginTop: '8px'
          }}>
            {store.featuredBundle.displayName}
          </h1>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            {store.featuredBundle.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: '#fff' }}>
                {store.featuredBundle.priceVP.toLocaleString()} VP
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                {store.featuredBundle.originalPriceVP.toLocaleString()} VP
              </span>
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-green)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                -{store.featuredBundle.discountPct}% OFF
              </span>
            </div>

            <button className="tactical-btn" style={{ padding: '10px 24px' }}>
              PURCHASE BUNDLE
            </button>
          </div>
        </div>

        {/* Bundle Items Mini Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', zIndex: 2 }}>
          {store.featuredBundle.items.slice(0, 4).map((item, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '180px'
              }}
            >
              <SafeImage src={item.icon} alt={item.name} fallbackLabel={item.weapon} style={{ width: '48px', height: '24px', objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--accent-gold)' }}>{item.priceVP} VP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Rotation Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
              DAILY OFFERS ROTATION
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
              RESETS IN 13H 22M
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            4 SLOTS AVAILABLE
          </span>
        </div>

        <div className="store-offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {store.dailyOffers.map((offer) => (
            <div
              key={offer.id}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px'
              }}
            >
              <span className="tactical-badge" style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: offer.tierColor,
                border: `1px solid ${offer.tierColor}40`
              }}>
                {offer.tier} TIER
              </span>

              <SafeImage
                src={offer.icon}
                alt={offer.name}
                fallbackLabel={offer.weapon}
                style={{
                  width: '180px',
                  height: '80px',
                  objectFit: 'contain',
                  filter: 'none',
                  margin: '10px 0'
                }}
              />

              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{offer.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{offer.weapon}</div>
              </div>

              <div style={{
                marginTop: 'auto',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.06)'
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                  {offer.priceVP} VP
                </span>
                <button
                  onClick={() => inspectSkin(offer)}
                  className="tactical-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  INSPECT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Night Market Section */}
      {store.nightMarket?.isActive && (
        <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'rgba(10, 14, 22, 0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 240, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} color="var(--accent-cyan)" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  .NIGHT.MARKET // SPECIAL DISCOUNTS
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Click to flip and reveal your secret discounted weapon offers
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
              <Clock size={13} /> 9D 18H REMAINING
            </div>
          </div>

          <div className="store-night-market-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px' }}>
            {store.nightMarket.offers.map((nm) => {
              const isRevealed = nightMarketReveals[nm.id];
              return (
                <div
                  key={nm.id}
                  onClick={() => !isRevealed && revealCard(nm.id)}
                  style={{
                    backgroundColor: isRevealed ? 'rgba(19, 25, 36, 0.9)' : 'rgba(0,0,0,0.5)',
                    border: `1px solid ${isRevealed ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: isRevealed ? 'default' : 'pointer',
                    minHeight: '210px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  className="glass-panel-hover"
                >
                  {isRevealed ? (
                    <>
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: 'var(--accent-green)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        -{nm.discountPct}%
                      </span>

                      <SafeImage
                        src={nm.icon}
                        alt={nm.name}
                        fallbackLabel={nm.weapon}
                        style={{
                          width: '120px',
                          height: '60px',
                          objectFit: 'contain',
                          marginTop: '20px',
                          marginBottom: '10px'
                        }}
                      />

                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        {nm.name}
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {nm.originalPriceVP} VP
                        </div>
                        <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-gold)' }}>
                          {nm.discountPriceVP} VP
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                      <Eye size={24} color="var(--accent-cyan)" className="pulse-dot" />
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
                        CLICK TO REVEAL
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {inspectOffer && (
        <div className="inspect-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeInspect()}>
          <section className="inspect-dialog" role="dialog" aria-modal="true" aria-label={`Inspect ${inspectOffer.name}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 18px' }}>
              <div>
                <div className="label">{inspectOffer.weapon} inspection</div>
                <h2 style={{ marginTop: '3px', fontSize: '18px' }}>{inspectOffer.name}</h2>
              </div>
              <button onClick={closeInspect} className="tactical-btn-secondary" aria-label="Close inspection" title="Close inspection" style={{ width: '34px', height: '34px', padding: 0 }}>
                <X size={17} />
              </button>
            </div>

            <div className="inspect-media">
              {inspectVideo ? (
                <video key={inspectVideo} src={inspectVideo} controls autoPlay muted playsInline style={{ width: '100%', maxHeight: '560px', background: 'var(--bg)' }} />
              ) : (
                <div style={{ width: '100%', minHeight: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', padding: '32px' }}>
                  <SafeImage src={inspectImage || inspectOffer.icon} alt={inspectOffer.name} fallbackLabel={inspectOffer.weapon} style={{ width: 'min(620px, 90%)', height: '240px', objectFit: 'contain' }} />
                  <div style={{ color: 'var(--text-3)', fontSize: '12px' }}>
                    {inspectLoading ? 'Loading official preview...' : 'No animated preview is available for this item.'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px 18px' }}>
              <span className="badge">{inspectOffer.tier}</span>
              <span className="font-mono" style={{ color: 'var(--gold)', fontWeight: 700 }}>{inspectOffer.priceVP.toLocaleString()} VP</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
