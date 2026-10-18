
import { useEffect, useState } from "react";
import {
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  Globe,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import "./App.css";

const API = "http://127.0.0.1:5000/api";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function formatPrice(value) {
  if (value == null || !Number.isFinite(Number(value))) return "Price unavailable";
  return Number(value).toFixed(2);
}

function App() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState("");
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    fetch(`${API}/health`)
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    fetch(`${API}/analytics`)
      .then((response) => {
        if (!response.ok) throw new Error("Analytics unavailable");
        return response.json();
      })
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, []);

  async function searchProducts(event) {
    event.preventDefault();
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    setError("");
    setProducts([]);

    try {
      const response = await fetch(
        `${API}/products?q=${encodeURIComponent(query)}&limit=20`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed");
      setProducts(data.products || []);
      if (!data.products?.length) setError("No matching products found.");
    } catch {
      setError("Could not reach the backend. Check that Flask is running on port 5000.");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadRecommendations(product) {
    setSelected(product);
    setRecommendations([]);
    setError("");
    setLoadingRecommendations(true);

    try {
      const response = await fetch(
        `${API}/recommendations?product=${encodeURIComponent(product.stock_code)}&limit=5`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not get recommendations");
      setSelected(data.selected_product || product);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err.message || "Could not load recommendations.");
    } finally {
      setLoadingRecommendations(false);
    }
  }

  const summary = analytics?.summary;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon"><ShoppingBag size={22} /></span>
          <span>Retail<span className="brand-accent">Sense</span></span>
        </a>
        <nav>
          <a href="#home">Home</a>
          <a href="#recommendations">Recommendations</a>
          <a href="#analytics">Analytics</a>
        </nav>
        <span className={`api-status ${apiOnline ? "online" : "offline"}`}>
          <span className="status-dot" />
          {apiOnline ? "API Connected" : "API Offline"}
        </span>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow"><Sparkles size={15} /> MACHINE LEARNING POWERED</span>
            <h1>Discover products<br />you’ll <span>love.</span></h1>
            <p>
              Explore retail products and discover relevant recommendations
              powered by purchase-pattern similarity.
            </p>
            <form className="search-form" onSubmit={searchProducts}>
              <Search size={21} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, e.g. heart, bag, mug..."
                aria-label="Search products"
              />
              <button type="submit" disabled={loadingProducts}>
                {loadingProducts ? <LoaderCircle className="spin" size={18} /> : "Search"}
              </button>
            </form>
            <div className="hero-note">
              <span>✓</span> Explore products
              <span>✓</span> Discover similar items
              <span>✓</span> View retail insights
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="floating-card card-top">
              <span className="floating-emoji">🎁</span>
              <span><b>Smart discovery</b><small>Find your next favourite</small></span>
            </div>
            <div className="product-illustration">
              <div className="illustration-circle"><ShoppingBag size={100} strokeWidth={1.1} /></div>
              <span className="spark spark-one">✦</span>
              <span className="spark spark-two">✧</span>
              <span className="spark spark-three">✦</span>
            </div>
            <div className="floating-card card-bottom">
              <span className="mini-chart"><TrendingUp size={22} /></span>
              <span><b>Data-driven</b><small>Recommendations</small></span>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">×</button>
          </div>
        )}

        <section className="section search-results">
          <div className="section-heading">
            <div>
              <span className="section-kicker">EXPLORE THE CATALOG</span>
              <h2>Product search</h2>
              <p>Choose a product to discover items with similar purchase patterns.</p>
            </div>
            {products.length > 0 && (
              <span className="result-count">{products.length} results</span>
            )}
          </div>

          {loadingProducts ? (
            <div className="loading-state"><LoaderCircle className="spin" /> Searching products...</div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.stock_code}>

                  <div className="product-art">
                    <img
                      src={`https://loremflickr.com/400/300/${encodeURIComponent(
                        product.description.trim().replace(/\s+/g, ",")
                      )}`}
                      alt={product.description}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <span className="stock-code">CODE {product.stock_code}</span>
                  <h3>{product.description.trim()}</h3>
                  <div className="product-card-bottom">
                    <span className="price">{formatPrice(product.unit_price)}</span>
                    <button onClick={() => loadRecommendations(product)}>
                      Find similar <Sparkles size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Search size={25} /></div>
              <h3>Find something interesting</h3>
              <p>Search the catalog above, then select a product to get recommendations.</p>
            </div>
          )}
        </section>

        <section className="section recommendations-section" id="recommendations">
          <div className="section-heading">
            <div>
              <span className="section-kicker">PERSONALIZED DISCOVERY</span>
              <h2>Recommended for you</h2>
              <p>Products ranked by similarity in customer purchase patterns.</p>
            </div>
            <span className="ai-pill"><Sparkles size={14} /> ML powered</span>
          </div>

          {!selected ? (
            <div className="empty-state recommendation-empty">
              <div className="empty-icon"><Sparkles size={25} /></div>
              <h3>Your recommendations start here</h3>
              <p>Search for a product and click “Find similar” to see the model’s results.</p>
            </div>
          ) : (
            <div className="recommendation-panel">
              <div className="selected-product">
                <div className="selected-icon"><ShoppingBag size={30} /></div>
                <div className="selected-info">
                  <span>SELECTED PRODUCT · {selected.stock_code}</span>
                  <h3>{selected.description?.trim()}</h3>
                  <p>Price: {formatPrice(selected.unit_price)}</p>
                </div>
                <button className="refresh-button" onClick={() => loadRecommendations(selected)} title="Refresh recommendations">
                  <RefreshCw size={17} />
                </button>
              </div>

              {loadingRecommendations ? (
                <div className="loading-state"><LoaderCircle className="spin" /> Finding similar products...</div>
              ) : recommendations.length > 0 ? (
                <div className="recommendation-list">
                  {recommendations.map((item, index) => (
                    <article className="recommendation-item" key={`${item.stock_code}-${index}`}>
                      <div className="rank">0{index + 1}</div>
                      <div className="recommendation-icon"><Package size={23} /></div>
                      <div className="recommendation-info">
                        <h3>{item.description?.trim()}</h3>
                        <span>Product code: {item.stock_code}</span>
                      </div>
                      <div className="similarity">
                        <b>{(Number(item.similarity) * 100).toFixed(1)}%</b>
                        <span>Similarity</span>
                        <div className="similarity-track">
                          <div style={{ width: `${Math.max(0, Math.min(100, Number(item.similarity) * 100))}%` }} />
                        </div>
                      </div>
                      <div className="recommendation-price">{formatPrice(item.unit_price)}</div>
                    </article>
                  ))}
                </div>
              ) : (
                !loadingRecommendations && <p className="no-results">No recommendations available for this product.</p>
              )}
              <p className="method-note">
                Similarity scores reflect patterns in historical purchases; they are not guarantees of customer preference.
              </p>
            </div>
          )}
        </section>

        <section className="section analytics-section" id="analytics">
          <div className="section-heading">
            <div>
              <span className="section-kicker">RETAIL PERFORMANCE</span>
              <h2>Analytics overview</h2>
              <p>A snapshot of the historical retail dataset.</p>
            </div>
            <span className="data-badge"><span className="status-dot" /> Dataset insights</span>
          </div>

          {!analytics ? (
            <div className="loading-state"><LoaderCircle className="spin" /> Loading analytics...</div>
          ) : (
            <>
              <div className="stats-grid">
                <StatCard icon={<TrendingUp />} label="Total sales" value={formatNumber(summary?.total_sales)} detail="Historical sales value" />
                <StatCard icon={<Users />} label="Customers" value={formatNumber(summary?.total_customers)} detail="Unique identified customers" />
                <StatCard icon={<Package />} label="Products" value={formatNumber(summary?.total_products)} detail="Unique catalog items" />
                <StatCard icon={<Globe />} label="Countries" value={formatNumber(summary?.total_countries)} detail="Countries represented" />
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-card-heading">
                    <div><h3>Monthly sales</h3><p>Sales value by month</p></div>
                    <TrendingUp size={20} />
                  </div>
                  <div className="monthly-chart">
                    {(analytics.monthly_sales || []).map((month) => {
                      const maxSales = Math.max(...(analytics.monthly_sales || []).map((item) => item.sales), 1);
                      return (
                        <div className="month-column" key={month.Month} title={`${month.Month}: ${formatPrice(month.sales)}`}>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ height: `${(month.sales / maxSales) * 100}%` }} />
                          </div>
                          <span>{month.Month.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="chart-footnote">Months shown in chronological order · 2010–2011</div>
                </div>

                <div className="analytics-card">
                  <div className="analytics-card-heading">
                    <div><h3>Top-selling products</h3><p>Ranked by quantity sold</p></div>
                    <Package size={20} />
                  </div>
                  <div className="top-products">
                    {(analytics.top_products || []).slice(0, 5).map((item, index) => {
                      const maxQuantity = Math.max(...(analytics.top_products || []).map((product) => product.quantity_sold), 1);
                      return (
                        <div className="top-product" key={item.StockCode}>
                          <span className="top-rank">{index + 1}</span>
                          <div className="top-product-main">
                            <div className="top-product-label">
                              <span>{item.Description?.trim()}</span>
                              <b>{formatNumber(item.quantity_sold)}</b>
                            </div>
                            <div className="quantity-track">
                              <div style={{ width: `${(item.quantity_sold / maxQuantity) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <p className="dataset-note">Historical dataset: December 2010–December 2011. Sales figures are displayed in dataset price units.</p>
            </>
          )}
        </section>

        <footer>
          <a className="brand footer-brand" href="#home"><span className="brand-icon"><ShoppingBag size={18} /></span>Retail<span className="brand-accent">Sense</span></a>
          <p>Machine learning meets smarter retail discovery.</p>
          <span>Built with React · Flask · Python · scikit-learn</span>
        </footer>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}

export default App;
